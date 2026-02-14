import { Router, Request, Response } from 'express';
import { AnalyticsEventModel, AnalyticsEventType } from '../models/Analytics.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = Router();

router.post('/track', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { userId, eventType, metadata } = req.body;
        const effectiveUserId = (req as any).user?._id || userId;

        if (!effectiveUserId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        if (!eventType) {
            return res.status(400).json({ error: 'eventType is required' });
        }

        const event = await AnalyticsEventModel.create({
            userId: new mongoose.Types.ObjectId(effectiveUserId),
            eventType,
            metadata: {
                ...metadata,
                source: (req as any).user ? 'web' : 'api',
            },
        });

        res.status(201).json({ success: true, eventId: event._id });
    } catch (error) {
        console.error('Analytics track error:', error);
        res.status(500).json({ error: 'Failed to track event' });
    }
});

router.get('/stats', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const eventCounts = await AnalyticsEventModel.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: '$eventType', count: { $sum: 1 } } },
        ]);

        const counts: Record<string, number> = {};
        eventCounts.forEach((e) => {
            counts[e._id] = e.count;
        });

        const studyTimeResult = await AnalyticsEventModel.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    eventType: 'study_session'
                }
            },
            { $group: { _id: null, totalMinutes: { $sum: '$metadata.duration' } } },
        ]);
        const totalStudyMinutes = studyTimeResult[0]?.totalMinutes || 0;

        const streak = await calculateStreak(userId);

        const weeklyActivity = await getWeeklyActivity(userId);

        const quizScores = await getRecentQuizScores(userId);

        res.json({
            coursesCompleted: counts['course_completed'] || 0,
            coursesCreated: counts['course_created'] || 0,
            chaptersCompleted: counts['chapter_completed'] || 0,
            roadmapsCreated: counts['roadmap_created'] || 0,
            nodesCompleted: counts['roadmap_node_completed'] || 0,
            videosCreated: counts['video_created'] || 0,
            videosWatched: counts['video_watched'] || 0,
            quizzesCompleted: counts['quiz_completed'] || 0,
            flashcardSessions: counts['flashcard_session'] || 0,
            totalStudyMinutes,
            streak,
            weeklyActivity,
            quizScores,
        });
    } catch (error) {
        console.error('Analytics stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

router.get('/heatmap', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const dailyActivity = await AnalyticsEventModel.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: oneYearAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const heatmapData: Record<string, number> = {};
        dailyActivity.forEach((d) => {
            heatmapData[d._id] = d.count;
        });

        res.json({ heatmapData });
    } catch (error) {
        console.error('Analytics heatmap error:', error);
        res.status(500).json({ error: 'Failed to get heatmap data' });
    }
});

async function calculateStreak(userId: mongoose.Types.ObjectId): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activityDays = await AnalyticsEventModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            },
        },
        { $sort: { _id: -1 } },
        { $limit: 365 },
    ]);

    if (activityDays.length === 0) return 0;

    const dates = activityDays.map((d) => d._id);
    let streak = 0;
    let currentDate = new Date(today);

    const todayStr = currentDate.toISOString().split('T')[0];
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (!dates.includes(todayStr) && !dates.includes(yesterdayStr)) {
        return 0;
    }

    for (let i = 0; i < 365; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (dates.includes(dateStr)) {
            streak++;
        } else if (i > 0) {
            break;
        }
        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
}

async function getWeeklyActivity(userId: mongoose.Types.ObjectId): Promise<{ day: string; count: number }[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const activity = await AnalyticsEventModel.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: sevenDaysAgo }
            }
        },
        {
            $group: {
                _id: { $dayOfWeek: '$createdAt' },
                count: { $sum: 1 },
            },
        },
    ]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = dayNames.map((day, index) => ({
        day,
        count: activity.find((a) => a._id === index + 1)?.count || 0,
    }));

    return result;
}

async function getRecentQuizScores(userId: mongoose.Types.ObjectId): Promise<{ date: string; score: number }[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const quizzes = await AnalyticsEventModel.find({
        userId: new mongoose.Types.ObjectId(userId),
        eventType: 'quiz_completed',
        createdAt: { $gte: thirtyDaysAgo },
    })
        .sort({ createdAt: 1 })
        .limit(20)
        .select('metadata.score createdAt');

    return quizzes.map((q) => ({
        date: q.createdAt.toISOString().split('T')[0],
        score: q.metadata?.score || 0,
    }));
}

export default router;
