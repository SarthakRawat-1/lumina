/**
 * PendingNotePlugin - Inserts pending note content after editor syncs
 */
import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { notesApi } from '@/lib/documentsApi';

interface PendingNotePluginProps {
    documentId?: string;
}

export default function PendingNotePlugin({ documentId }: PendingNotePluginProps) {
    const [editor] = useLexicalComposerContext();
    const hasInsertedRef = useRef(false);
    const attemptCountRef = useRef(0);

    useEffect(() => {
        if (!documentId || hasInsertedRef.current) return;

        const insertContent = async () => {
            try {
                const note = await notesApi.getPending(documentId);
                if (!note?.content) return;

                // Wait for editor to be ready and check if empty
                const tryInsert = () => {
                    attemptCountRef.current++;

                    editor.update(() => {
                        const root = $getRoot();
                        const textContent = root.getTextContent().trim();

                        // Only insert if editor is empty
                        if (textContent.length > 0) {
                            console.log('[PendingNote] Editor has content, skipping insert');
                            return;
                        }

                        if (hasInsertedRef.current) return;
                        hasInsertedRef.current = true;

                        console.log('[PendingNote] Inserting content into empty editor');
                        const lines = note.content.split('\n');
                        root.clear();

                        for (const line of lines) {
                            if (line.startsWith('# ')) {
                                const heading = $createHeadingNode('h1');
                                heading.append($createTextNode(line.slice(2)));
                                root.append(heading);
                            } else if (line.startsWith('## ')) {
                                const heading = $createHeadingNode('h2');
                                heading.append($createTextNode(line.slice(3)));
                                root.append(heading);
                            } else if (line.startsWith('### ')) {
                                const heading = $createHeadingNode('h3');
                                heading.append($createTextNode(line.slice(4)));
                                root.append(heading);
                            } else if (line.trim()) {
                                const paragraph = $createParagraphNode();
                                paragraph.append($createTextNode(line));
                                root.append(paragraph);
                            } else {
                                root.append($createParagraphNode());
                            }
                        }
                    });

                    // Delete pending note after insertion
                    if (hasInsertedRef.current) {
                        notesApi.deletePending(documentId).catch(() => { });
                        console.log('[PendingNote] Content inserted and pending note deleted');
                    } else if (attemptCountRef.current < 10) {
                        // Retry if editor wasn't ready
                        setTimeout(tryInsert, 500);
                    }
                };

                // Start trying after a delay to let collaboration sync
                setTimeout(tryInsert, 1500);
            } catch (err) {
                // 404 is expected for regular documents
            }
        };

        insertContent();
    }, [documentId, editor]);

    return null;
}
