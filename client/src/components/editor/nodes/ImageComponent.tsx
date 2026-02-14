/**
 * Image Component for ImageNode
 */
import type { NodeKey } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    SELECTION_CHANGE_COMMAND,
} from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { $isImageNode } from './ImageNode';

export default function ImageComponent({
    src,
    altText,
    nodeKey,
    width,
    height,
    maxWidth,
}: {
    altText: string;
    height: 'inherit' | number;
    maxWidth: number;
    nodeKey: NodeKey;
    src: string;
    width: 'inherit' | number;
}): React.JSX.Element {
    const imageRef = useRef<null | HTMLImageElement>(null);
    const [isSelected, setSelected, clearSelection] =
        useLexicalNodeSelection(nodeKey);
    const [editor] = useLexicalComposerContext();
    const [selection, setSelection] = useState<null | ReturnType<typeof $getSelection>>(null);
    const activeEditorRef = useRef<typeof editor | null>(null);

    const $onDelete = useCallback(
        (event: KeyboardEvent) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);
                if ($isImageNode(node)) {
                    node.remove();
                    return true;
                }
            }
            return false;
        },
        [isSelected, nodeKey]
    );

    useEffect(() => {
        let isMounted = true;
        const unregister = mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                if (isMounted) {
                    setSelection(editorState.read(() => $getSelection()));
                }
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_, activeEditor) => {
                    activeEditorRef.current = activeEditor;
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand<MouseEvent>(
                CLICK_COMMAND,
                (payload) => {
                    const event = payload;
                    if (event.target === imageRef.current) {
                        if (event.shiftKey) {
                            setSelected(!isSelected);
                        } else {
                            clearSelection();
                            setSelected(true);
                        }
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                KEY_DELETE_COMMAND,
                $onDelete,
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                KEY_BACKSPACE_COMMAND,
                $onDelete,
                COMMAND_PRIORITY_LOW
            )
        );

        return () => {
            isMounted = false;
            unregister();
        };
    }, [clearSelection, editor, isSelected, nodeKey, $onDelete, setSelected]);

    const isFocused = isSelected;

    return (
        <div className={`image-wrapper ${isFocused ? 'focused' : ''}`}>
            <img
                className={isFocused ? 'focused' : ''}
                src={src}
                alt={altText}
                ref={imageRef}
                style={{
                    height: height === 'inherit' ? 'auto' : height,
                    maxWidth,
                    width: width === 'inherit' ? 'auto' : width,
                }}
                draggable="false"
            />
        </div>
    );
}
