
import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';
import type { VideoProps } from './VideoComposition';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MainVideo"
                component={VideoComposition}
                width={1920}
                height={1080}
                fps={30}
                calculateMetadata={({ props }) => {
                    return {
                        durationInFrames: props.total_duration_frames || 300,
                        props,
                    };
                }}
                defaultProps={{
                    video_id: 'default',
                    topic: 'Default Topic',
                    language: 'en',
                    duration_mode: 'short',
                    fps: 30,
                    total_duration_frames: 300,
                    scenes: [],
                } as VideoProps}
            />
        </>
    );
};
