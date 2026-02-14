/**
 * Images Plugin - handles image insertion commands
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
    $createImageNode,
    ImageNode,
    type ImagePayload,
} from '@/components/editor/nodes/ImageNode';

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> =
    createCommand('INSERT_IMAGE_COMMAND');

export default function ImagesPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([ImageNode])) {
            throw new Error('ImagesPlugin: ImageNode not registered on editor');
        }

        return editor.registerCommand<ImagePayload>(
            INSERT_IMAGE_COMMAND,
            (payload) => {
                const imageNode = $createImageNode(payload);
                $insertNodeToNearestRoot(imageNode);
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
}

export { ImageNode, type ImagePayload };
