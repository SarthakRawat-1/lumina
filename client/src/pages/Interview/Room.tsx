import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LiveKitRoom,
    useTracks,
    RoomAudioRenderer,
    ControlBar,
    useRoomContext,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { Card } from '@/components/ui/card';

import { Loader2 } from 'lucide-react';

const InterviewRoom = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { token, wsUrl, interviewId } = location.state || {}; // Expecting these from Setup

    if (!token) return <div>No token provided. Please start from setup.</div>;

    return (
        <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={wsUrl}
            connect={true}
            className="h-screen w-screen flex flex-col bg-black"
            onDisconnected={() => navigate(`/interview/report/${interviewId}`)}
        >
            <RoomContent interviewId={interviewId} />
            <RoomAudioRenderer />
            <ControlBar />
        </LiveKitRoom>
    );
};

const RoomContent = ({ interviewId }: { interviewId: string }) => {
    const room = useRoomContext();
    const navigate = useNavigate();

    // Get all video tracks (Local + Remote/Agent)
    const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

    useEffect(() => {
        if (!room) return;

        // Listen for RPC events from Agent
        const handleRpc = async (payload: any) => {
            try {
                const data = JSON.parse(payload);

                if (data.type === 'evaluation_recorded') {
                    console.log("Evaluation Recorded:", data.category);
                } else if (data.type === 'interview_ended') {
                    console.log("Interview Ended:", data.decision);
                    // Disconnect after delay
                    setTimeout(() => {
                        room.disconnect();
                        navigate(`/interview/report/${interviewId}`);
                    }, 2000);
                }
            } catch (e) {
                console.error("Failed to parse RPC payload", e);
            }
            return JSON.stringify({ status: "ok" });
        };

        // Register RPC method
        room.localParticipant.registerRpcMethod(
            'client.showNotification',
            handleRpc
        );

    }, [room, navigate, interviewId]);

    return (
        <div className="flex-1 flex items-center justify-center p-4 relative">
            {/* Render Participant Tiles (Agent + User) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl h-full">
                {tracks.map((track) => (
                    <div key={track.publication.trackSid} className="relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
                        <video
                            ref={(el) => {
                                if (el) track.publication.track?.attach(el);
                            }}
                            className="w-full h-full object-cover"
                            autoPlay
                            playsInline
                        />
                        <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-sm">
                            {track.participant.identity === room.localParticipant.identity ? "You" : "Interviewer (Simli)"}
                        </div>
                    </div>
                ))}

                {tracks.length === 0 && (
                    <div className="col-span-2 flex items-center justify-center text-white">
                        <div className="text-center">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
                            <p>Waiting for agent to connect...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewRoom;
