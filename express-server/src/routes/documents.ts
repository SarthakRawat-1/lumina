import { Router, Request, Response } from 'express';
import { DocumentModel } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const docs = await DocumentModel.find({ userId }, 'name createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(100);
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

router.get('/:name', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const doc = await DocumentModel.findOne(
            { name: req.params.name, userId },
            'name createdAt updatedAt'
        );
        if (!doc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

router.delete('/:name', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const result = await DocumentModel.deleteOne({ name: req.params.name, userId });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;
