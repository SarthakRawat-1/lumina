/**
 * Page Break Plugin - handles page break insertion
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
    $createPageBreakNode,
    PageBreakNode,
} from '@/components/editor/nodes/PageBreakNode';

export const INSERT_PAGE_BREAK_COMMAND: LexicalCommand<undefined> =
    createCommand('INSERT_PAGE_BREAK_COMMAND');

export default function PageBreakPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([PageBreakNode])) {
            throw new Error('PageBreakPlugin: PageBreakNode not registered on editor');
        }

        return editor.registerCommand<undefined>(
            INSERT_PAGE_BREAK_COMMAND,
            () => {
                const pageBreakNode = $createPageBreakNode();
                $insertNodeToNearestRoot(pageBreakNode);
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
}

export { PageBreakNode };
