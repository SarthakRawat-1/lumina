import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
import os from 'os';

interface RenderJob {
    status: 'rendering' | 'done' | 'error';
    file?: string;
    gcsUrl?: string;
    error?: string;
}

export class RenderService {
    private static instance: RenderService;
    private renderQueue: Map<string, RenderJob> = new Map();
    private remotionRoot = path.resolve(process.cwd(), '../client/src/remotion/index.ts');
    private outputDir = path.resolve(process.cwd(), 'renders');
    private bundleLocation: string | null = null;
    private storage: Storage | null = null;

    private constructor() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        if (process.env.GCP_BUCKET_NAME) {
            this.storage = new Storage();
        }
    }

    public static getInstance(): RenderService {
        if (!RenderService.instance) {
            RenderService.instance = new RenderService();
        }
        return RenderService.instance;
    }

    private async getBundle(): Promise<string> {
        if (!this.bundleLocation) {
            console.log('Bundling Remotion project (one-time)...');
            this.bundleLocation = await bundle({ entryPoint: this.remotionRoot });
            console.log('Bundle cached at:', this.bundleLocation);
        }
        return this.bundleLocation;
    }

    public async renderVideo(videoId: string, videoData: any): Promise<void> {
        this.renderQueue.set(videoId, { status: 'rendering' });

        try {
            console.log(`Starting render for video ${videoId}`);

            const bundleLoc = await this.getBundle();
            const compositionId = 'MainVideo';

            const composition = await selectComposition({
                serveUrl: bundleLoc,
                id: compositionId,
                inputProps: videoData,
            });

            if (!composition) {
                throw new Error(`Composition ${compositionId} not found`);
            }

            const outputFile = path.join(this.outputDir, `${videoId}.mp4`);
            console.log(`Rendering to ${outputFile}...`);

            const cpuCount = os.cpus().length;
            const concurrency = Math.max(2, Math.min(Math.floor(cpuCount / 2), 4));

            await renderMedia({
                composition,
                serveUrl: bundleLoc,
                codec: 'h264',
                outputLocation: outputFile,
                inputProps: videoData,
                concurrency,
            });

            console.log(`Render complete: ${outputFile}`);

            let gcsUrl: string | undefined;

            if (this.storage && process.env.GCP_BUCKET_NAME) {
                try {
                    gcsUrl = await this.uploadToGCS(videoId, outputFile);
                    console.log(`Uploaded to GCS: ${gcsUrl}`);

                    fs.unlinkSync(outputFile);
                    console.log(`Deleted local file: ${outputFile}`);
                } catch (uploadErr) {
                    console.error('GCS upload failed, keeping local file:', uploadErr);
                }
            }

            this.renderQueue.set(videoId, {
                status: 'done',
                file: gcsUrl ? undefined : `${videoId}.mp4`,
                gcsUrl,
            });

        } catch (error: any) {
            console.error(`Render failed for ${videoId}:`, error);
            this.renderQueue.set(videoId, { status: 'error', error: error.message });
        }
    }

    private async uploadToGCS(videoId: string, filePath: string): Promise<string> {
        const bucketName = process.env.GCP_BUCKET_NAME!;
        const bucket = this.storage!.bucket(bucketName);
        const destination = `videos/${videoId}.mp4`;

        await bucket.upload(filePath, {
            destination,
            metadata: {
                contentType: 'video/mp4',
            },
        });

        await bucket.file(destination).makePublic();

        return `https://storage.googleapis.com/${bucketName}/${destination}`;
    }

    public getStatus(videoId: string): RenderJob | undefined {
        return this.renderQueue.get(videoId);
    }

    public getFilePath(filename: string): string {
        return path.join(this.outputDir, filename);
    }
}
