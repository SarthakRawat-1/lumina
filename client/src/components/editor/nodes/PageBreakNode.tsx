/**
 * Page Break Node for Lexical Editor
 */
import type {
    DOMConversionMap,
    DOMConversionOutput,
    LexicalNode,
    SerializedLexicalNode,
} from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
    $applyNodeReplacement,
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    DecoratorNode,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
} from 'lexical';
import * as React from 'react';
import { useCallback, useEffect } from 'react';

export type SerializedPageBreakNode = SerializedLexicalNode;

function PageBreakComponent({ nodeKey }: { nodeKey: string }) {
    const [editor] = useLexicalComposerContext();
    const [isSelected, setSelected, clearSelection] =
        useLexicalNodeSelection(nodeKey);

    const $onDelete = useCallback(
        (event: KeyboardEvent) => {
            event.preventDefault();
            const selection = $getSelection();
            if (isSelected && $isNodeSelection(selection)) {
                const node = $getNodeByKey(nodeKey);
                if ($isPageBreakNode(node)) {
                    node.remove();
                    return true;
                }
            }
            return false;
        },
        [isSelected, nodeKey]
    );

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                CLICK_COMMAND,
                (event: MouseEvent) => {
                    const pbElem = editor.getElementByKey(nodeKey);
                    if (event.target === pbElem) {
                        if (!event.shiftKey) {
                            clearSelection();
                        }
                        setSelected(!isSelected);
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
    }, [clearSelection, editor, isSelected, nodeKey, $onDelete, setSelected]);

    return (
        <div
            className={`page-break ${isSelected ? 'selected' : ''}`}
            data-page-break="true">
            <span className="page-break-label">Page Break</span>
        </div>
    );
}

export class PageBreakNode extends DecoratorNode<React.JSX.Element> {
    static getType(): string {
        return 'page-break';
    }

    static clone(node: PageBreakNode): PageBreakNode {
        return new PageBreakNode(node.__key);
    }

    static importJSON(): PageBreakNode {
        return $createPageBreakNode();
    }

    static importDOM(): DOMConversionMap | null {
        return {
            figure: (domNode: HTMLElement) => {
                if (domNode.getAttribute('data-page-break') === 'true') {
                    return {
                        conversion: (): DOMConversionOutput | null => ({
                            node: $createPageBreakNode(),
                        }),
                        priority: 1,
                    };
                }
                return null;
            },
        };
    }

    exportJSON(): SerializedPageBreakNode {
        return {
            type: this.getType(),
            version: 1,
        };
    }

    createDOM(): HTMLElement {
        const el = document.createElement('figure');
        el.setAttribute('data-page-break', 'true');
        el.style.pageBreakAfter = 'always';
        return el;
    }

    getTextContent(): string {
        return '\n';
    }

    isInline(): false {
        return false;
    }

    updateDOM(): boolean {
        return false;
    }

    decorate(): React.JSX.Element {
        return <PageBreakComponent nodeKey={this.__key} />;
    }
}

export function $createPageBreakNode(): PageBreakNode {
    return $applyNodeReplacement(new PageBreakNode());
}

export function $isPageBreakNode(
    node: LexicalNode | null | undefined
): node is PageBreakNode {
    return node instanceof PageBreakNode;
}
