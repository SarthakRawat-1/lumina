/**
 * VideoPlayer - Remotion-based video player for TTV feature
 * 
 * Renders AI-generated videos with Ken Burns effect and subtitles.
 */
import { useCallback, useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import {
    AbsoluteFill,
    Audio,
    Img,
    Sequence,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
} from 'remotion';
import type { VideoScene, Video } from '@/types';


// =============================================================================
// Ken Burns Effect Component
// =============================================================================

function KenBurnsImage({ src }: { src: string }) {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    // Zoom from 1.0 to 1.15 over the scene duration
    const scale = interpolate(
        frame,
        [0, durationInFrames],
        [1, 1.15],
        { extrapolateRight: 'clamp' }
    );

    // Subtle rotation for more life (0 to 1 degree)
    const rotate = interpolate(
        frame,
        [0, durationInFrames],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    return (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    transformOrigin: 'center center',
                }}
            />
        </AbsoluteFill>
    );
}


// =============================================================================
// Scene Component
// =============================================================================

interface SceneComponentProps {
    scene: VideoScene;
    showSubtitles: boolean;
    isFirst?: boolean;
    isLast?: boolean;
}

function SceneComponent({ scene, showSubtitles, isFirst = false, isLast = false }: SceneComponentProps) {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const FADE_DURATION = 8; // 8 frames = ~0.27 seconds

    // Calculate opacity based on position
    let opacity = 1;

    // Fade in (skip for first scene)
    if (!isFirst && frame < FADE_DURATION) {
        opacity = frame / FADE_DURATION;
    }

    // Fade out (skip for last scene)
    if (!isLast && frame > durationInFrames - FADE_DURATION) {
        opacity = (durationInFrames - frame) / FADE_DURATION;
    }

    // Clamp between 0 and 1
    opacity = Math.max(0, Math.min(1, opacity));

    return (
        <AbsoluteFill style={{ opacity }}>
            {/* Background Image with Ken Burns */}
            <KenBurnsImage src={scene.image_url} />

            {/* Audio */}
            <Audio src={scene.audio_url} />

            {/* Subtitle Overlay */}
            {showSubtitles && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '60px',
                        left: '10%',
                        right: '10%',
                        textAlign: 'center',
                    }}
                >
                    <span
                        style={{
                            display: 'inline-block',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            fontSize: '28px',
                            fontWeight: 600,
                            padding: '12px 24px',
                            borderRadius: '8px',
                            maxWidth: '80%',
                            lineHeight: 1.4,
                        }}
                    >
                        {scene.caption}
                    </span>
                </div>
            )}
        </AbsoluteFill>
    );
}


// =============================================================================
// Main Composition
// =============================================================================

interface VideoCompositionProps {
    data: Video;
    showSubtitles: boolean;
}

function VideoComposition({ data, showSubtitles }: VideoCompositionProps) {
    const OVERLAP_FRAMES = 8; // Same as FADE_DURATION in SceneComponent
    let accumulatedFrames = 0;

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {data.scenes.map((scene, index) => {
                const isFirst = index === 0;
                const isLast = index === data.scenes.length - 1;

                // Start earlier (except first) to overlap with previous scene's fade-out
                const fromFrame = isFirst ? 0 : accumulatedFrames - OVERLAP_FRAMES;
                // Extend duration to cover the overlap period
                const duration = scene.duration_frames + (isLast ? 0 : OVERLAP_FRAMES);

                accumulatedFrames += scene.duration_frames;

                return (
                    <Sequence
                        key={index}
                        from={fromFrame}
                        durationInFrames={duration}
                    >
                        <SceneComponent
                            scene={scene}
                            showSubtitles={showSubtitles}
                            isFirst={isFirst}
                            isLast={isLast}
                        />
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
}


// =============================================================================
// Player Wrapper Component
// =============================================================================

interface VideoPlayerProps {
    video: Video;
}

export function VideoPlayer({ video }: VideoPlayerProps) {
    const [showSubtitles, setShowSubtitles] = useState(true);

    const compositionComponent = useMemo(
        () => function Composition() {
            return <VideoComposition data={video} showSubtitles={showSubtitles} />;
        },
        [video, showSubtitles]
    );

    return (
        <div className="w-full space-y-4">
            {/* Player */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <Player
                    component={compositionComponent}
                    durationInFrames={video.total_duration_frames}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    fps={30}
                    controls
                    acknowledgeRemotionLicense={true}
                    style={{
                        width: '100%',
                        aspectRatio: '16/9',
                    }}
                />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showSubtitles}
                            onChange={(e) => setShowSubtitles(e.target.checked)}
                            className="w-4 h-4 rounded bg-white/10 border-white/20"
                        />
                        Show Subtitles
                    </label>
                </div>

                <div className="text-sm text-white/50">
                    {Math.round(video.total_duration_seconds)} seconds • {video.scenes.length} scenes
                </div>
            </div>
        </div>
    );
}
