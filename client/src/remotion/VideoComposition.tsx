
import { AbsoluteFill, Sequence, Audio, Img, useVideoConfig } from 'remotion';

export type Scene = {
    index: number;
    caption: string;
    image_url: string;
    audio_url: string;
    duration_frames: number;
};

export type VideoProps = {
    video_id: string;
    topic: string;
    language: string;
    duration_mode: string;
    fps: number;
    total_duration_frames: number;
    scenes: Scene[];
};

export const VideoComposition: React.FC<VideoProps> = ({ scenes }) => {
    const { fps } = useVideoConfig();

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {scenes.map((scene, index) => {
                // Calculate start frame based on previous scenes
                const startFrame = scenes
                    .slice(0, index)
                    .reduce((acc, s) => acc + s.duration_frames, 0);

                return (
                    <Sequence
                        key={scene.index}
                        from={startFrame}
                        durationInFrames={scene.duration_frames}
                    >
                        <AbsoluteFill>
                            <Img
                                src={scene.image_url}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                            <Audio src={scene.audio_url} />

                            {/* Caption Overlay */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: 100,
                                    left: 0,
                                    right: 0,
                                    textAlign: 'center',
                                    padding: '0 40px',
                                }}
                            >
                                <span
                                    style={{
                                        color: 'white',
                                        fontSize: 50,
                                        fontFamily: 'sans-serif',
                                        fontWeight: 'bold',
                                        textShadow: '0px 2px 10px rgba(0,0,0,0.8)',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                    }}
                                >
                                    {scene.caption}
                                </span>
                            </div>
                        </AbsoluteFill>
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};
