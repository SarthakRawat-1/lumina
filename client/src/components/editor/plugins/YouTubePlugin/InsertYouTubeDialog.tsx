/**
 * Insert YouTube Dialog Component
 */
import type { LexicalEditor } from 'lexical';

import * as React from 'react';
import { useState } from 'react';

import Button from '@/components/editor/ui/Button';
import { DialogActions } from '@/components/editor/ui/Dialog';
import TextInput from '@/components/editor/ui/TextInput';
import { INSERT_YOUTUBE_COMMAND } from './index';

const YOUTUBE_REGEX =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

export function InsertYouTubeDialog({
    activeEditor,
    onClose,
}: {
    activeEditor: LexicalEditor;
    onClose: () => void;
}): React.JSX.Element {
    const [url, setUrl] = useState('');

    const parseYouTubeUrl = (urlString: string): string | null => {
        const match = urlString.match(YOUTUBE_REGEX);
        return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = parseYouTubeUrl(url);
    const isDisabled = !videoId;

    const handleSubmit = () => {
        if (videoId) {
            activeEditor.dispatchCommand(INSERT_YOUTUBE_COMMAND, videoId);
            onClose();
        }
    };

    return (
        <>
            <TextInput
                label="YouTube URL"
                placeholder="https://www.youtube.com/watch?v=..."
                onChange={setUrl}
                value={url}
                data-test-id="youtube-modal-url-input"
            />
            {url && !videoId && (
                <p style={{ color: 'red', fontSize: '12px' }}>
                    Invalid YouTube URL. Please enter a valid YouTube video URL.
                </p>
            )}
            {videoId && (
                <div style={{ marginTop: '10px' }}>
                    <p style={{ color: 'green', fontSize: '12px' }}>
                        ✓ Video ID: {videoId}
                    </p>
                </div>
            )}
            <DialogActions>
                <Button
                    data-test-id="youtube-modal-confirm-btn"
                    disabled={isDisabled}
                    onClick={handleSubmit}>
                    Embed Video
                </Button>
            </DialogActions>
        </>
    );
}
