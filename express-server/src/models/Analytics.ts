import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export type AnalyticsEventType =
    | 'page_view'
    | 'study_session'
    | 'course_created'
    | 'course_started'
    | 'chapter_completed'
    | 'course_completed'
    | 'roadmap_created'
    | 'roadmap_node_completed'
    | 'video_created'
    | 'video_watched'
    | 'quiz_completed'
    | 'flashcard_session'
    | 'note_created'
    | 'slides_created';


export interface IAnalyticsEvent extends MongoDocument {
    userId: mongoose.Types.ObjectId;
    eventType: AnalyticsEventType;
    metadata: {
        path?: string;
        duration?: number;

        courseId?: string;
        chapterId?: string;
        roadmapId?: string;
        nodeId?: string;
        videoId?: string;

        score?: number;
        totalQuestions?: number;
        topic?: string;
        cardsReviewed?: number;

        title?: string;
        source?: 'web' | 'api';
    };
    createdAt: Date;
}


const analyticsEventSchema = new Schema<IAnalyticsEvent>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        eventType: {
            type: String,
            required: true,
            index: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

analyticsEventSchema.index({ userId: 1, eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ userId: 1, createdAt: -1 });


export const AnalyticsEventModel = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);
