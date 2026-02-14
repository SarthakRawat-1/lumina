import express from 'express';
import { RenderService } from '../services/renderService.js';

const router = express.Router();
const renderService = RenderService.getInstance();

router.post('/render', async (req, res) => {
    const { videoId, videoData, force } = req.body;

    if (!videoId || !videoData) {
        return res.status(400).json({ error: 'Missing videoId or videoData' });
    }

    const existing = renderService.getStatus(videoId);

    if (!force && existing && existing.status !== 'error') {
        return res.json({ message: 'Render already in progress or done', status: existing.status });
    }

    renderService.renderVideo(videoId, videoData).catch(err => console.error("Background render error:", err));

    res.json({ message: 'Render started', videoId, status: 'rendering' });
});


router.get('/status/:videoId', (req, res) => {
    const { videoId } = req.params;
    const status = renderService.getStatus(videoId);

    if (!status) {
        return res.status(404).json({ error: 'Render job not found' });
    }

    res.json(status);
});

router.get('/download/:videoId', (req, res) => {
    const { videoId } = req.params;
    const status = renderService.getStatus(videoId);

    if (!status || status.status !== 'done') {
        return res.status(404).json({ error: 'Video not ready or not found' });
    }

    if (status.gcsUrl) {
        return res.redirect(status.gcsUrl);
    }

    if (status.file) {
        const filePath = renderService.getFilePath(status.file);
        return res.download(filePath);
    }

    return res.status(404).json({ error: 'Video file not available' });
});

export const videoRoutes = router;
