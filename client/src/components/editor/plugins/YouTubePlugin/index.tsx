/**
 * YouTube Plugin - handles YouTube video embedding
 */
import type { LexicalCommand } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import {
    COMMAND_PRIORITY_EDITOR,
    createCommand,
} from 'lexical';
import { useEffect } from 'react';

import {
    $createYouTubeNode,
    YouTubeNode,
} from '@/components/editor/nodes/YouTubeNode';

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> =
    createCommand('INSERT_YOUTUBE_COMMAND');

export default function YouTubePlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([YouTubeNode])) {
            throw new Error('YouTubePlugin: YouTubeNode not registered on editor');
        }

        return editor.registerCommand<string>(
            INSERT_YOUTUBE_COMMAND,
            (payload) => {
                const youtubeNode = $createYouTubeNode(payload);
                $insertNodeToNearestRoot(youtubeNode);
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
}

export { YouTubeNode };
