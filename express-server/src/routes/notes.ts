import { Router, Request, Response } from 'express';
import { PendingNoteModel } from '../models/index.js';
import crypto from 'crypto';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/pending', requireAuth, async (req: Request, res: Response) => {
    try {
        const { content, title, sourceType, sourceId } = req.body;
        const userId = (req as any).user._id;

        if (!content || !title || !sourceType) {
            res.status(400).json({
                error: 'Missing required fields: content, title, sourceType'
            });
            return;
        }

        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(4).toString('hex');
        const documentId = `${sourceType}-note-${timestamp}-${random}`;

        const pendingNote = await PendingNoteModel.create({
            documentId,
            content,
            title,
            sourceType,
            sourceId,
            userId,
        });

        console.log(`Created pending note: ${documentId}`);

        res.status(201).json({
            documentId: pendingNote.documentId,
            url: `/notes/${pendingNote.documentId}`,
            expiresAt: pendingNote.expiresAt
        });
    } catch (error) {
        console.error('Error creating pending note:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

router.get('/pending/:documentId', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { documentId } = req.params;
        const userId = (req as any).user?._id;

        let query: { documentId: string; userId?: string } = { documentId };
        if (userId) {
            query = { documentId, userId };
        }

        const pendingNote = await PendingNoteModel.findOne(query);

        if (!pendingNote) {
            res.status(404).json({ error: 'Pending note not found' });
            return;
        }

        res.json({
            documentId: pendingNote.documentId,
            content: pendingNote.content,
            title: pendingNote.title,
            sourceType: pendingNote.sourceType
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

router.delete('/pending/:documentId', requireAuth, async (req: Request, res: Response) => {
    try {
        const { documentId } = req.params;
        const userId = (req as any).user._id;

        const result = await PendingNoteModel.deleteOne({ documentId, userId });

        if (result.deletedCount === 0) {
            res.status(404).json({ error: 'Pending note not found' });
            return;
        }

        console.log(`🗑️ Deleted pending note: ${documentId}`);
        res.json({ message: 'Pending note deleted' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;
