import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ToolbarContext } from '@/components/editor/context/ToolbarContext';
import Editor from '@/components/editor/Editor';
import { TableContext } from '@/components/editor/plugins/TablePlugin';
import TypingPerfPlugin from '@/components/editor/plugins/TypingPerfPlugin';
import PlaygroundEditorTheme from '@/components/editor/themes/PlaygroundEditorTheme';
import { PlaygroundNodes } from '@/components/editor/nodes';
import { useSettings } from '@/components/editor/context/SettingsContext';
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from "yjs";
import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { type Provider } from "@lexical/yjs";
import { useParams, Navigate } from 'react-router-dom';
import { generateUsername } from "unique-username-generator";
import WEBSOCKET_CONFIG from '@/config/websocket';
import { useAuth } from '@/context/AuthContext';
import PendingNotePlugin from '@/components/editor/plugins/PendingNotePlugin';
import '@/styles/editor.css';

function EditorNavbar({ slug, connectedUsers, isOnline }: {
    slug?: string;
    connectedUsers: Array<{ clientId: number, user?: { name: string; color: string } }>;
    isOnline: boolean
}) {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <a href="/notes" className="text-xl font-bold gradient-text">Lumina</a>
                    <span className="text-muted-foreground text-sm">/</span>
                    <span className="text-sm text-foreground/80 font-medium truncate max-w-[200px]">
                        {slug || 'Untitled'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${isOnline
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                        {isOnline ? 'Connected' : 'Offline'}
                    </div>
                    <div className="flex -space-x-2">
                        {connectedUsers.slice(0, 5).map((cu) => (
                            <div
                                key={cu.clientId}
                                className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: cu.user?.color || '#8B5CF6' }}
                                title={cu.user?.name || 'Anonymous'}
                            >
                                {(cu.user?.name || 'A').charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {connectedUsers.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">
                                +{connectedUsers.length - 5}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

function CollaborationPageWrapper() {
    const { documentId } = useParams<{ documentId: string }>();

    if (documentId && (documentId.length < 1 || documentId.length > 50)) {
        return <Navigate to="/" replace />;
    }

    return <CollaborationPage slug={documentId} />;
}

function CollaborationPage({ slug }: { slug?: string }) {
    const {
        settings: { measureTypingPerf },
    } = useSettings();
    const { token } = useAuth();

    const providerRef = useRef<HocuspocusProvider | null>(null);
    const currentDocIdRef = useRef<string | null>(null);

    const [connectedUsers, setConnectedUsers] = useState<Array<{ clientId: number, user?: any }>>([]);
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [currentUser] = useState({
        name: generateUsername("", 2, 15),
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        id: Math.floor(Math.random() * 1000000)
    });

    useEffect(() => {
        currentDocIdRef.current = slug || 'default';
    }, [slug]);

    const createWebsocketProvider = useCallback(
        (id: string, yjsDocMap: Map<string, Y.Doc>): Provider => {
            const docId = slug || id;

            if (providerRef.current) {
                return providerRef.current as unknown as Provider;
            }

            let doc = yjsDocMap.get(id);
            if (!doc) {
                doc = new Y.Doc();
                yjsDocMap.set(id, doc);
            }

            const provider = new HocuspocusProvider({
                url: WEBSOCKET_CONFIG.url,
                name: docId,
                document: doc,
                token: token || undefined,
                onAwarenessUpdate: ({ states }) => {
                    setConnectedUsers(Array.from(states));
                },
                onAwarenessChange: ({ states }) => {
                    setConnectedUsers(Array.from(states));
                },
                onConnect: () => {
                    setIsOnline(true);
                },
                onDisconnect: () => {
                    setIsOnline(false);
                },
                onClose: () => {
                    setIsOnline(false);
                },
            });

            provider.setAwarenessField('user', {
                name: currentUser.name,
                color: currentUser.color,
                id: currentUser.id,
                timestamp: Date.now()
            });

            providerRef.current = provider;
            currentDocIdRef.current = docId;

            return provider as unknown as Provider;
        },
        [slug, currentUser, token]
    );

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (providerRef.current) {
                providerRef.current.setAwarenessField('user', {
                    name: currentUser.name,
                    color: currentUser.color,
                    id: currentUser.id,
                    mouseX: event.clientX,
                    mouseY: event.clientY,
                    timestamp: Date.now()
                });
            }
        };

        document.addEventListener('mousemove', handleMouseMove);

        if (providerRef.current) {
            providerRef.current.setAwarenessField('user', {
                name: currentUser.name,
                color: currentUser.color,
                id: currentUser.id,
                timestamp: Date.now()
            });
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [currentUser]);

    const initialConfig = useMemo(() => ({
        editorState: null,
        namespace: 'Lumina',
        theme: PlaygroundEditorTheme,
        onError: (error: Error) => {
            console.error(error);
        },
        nodes: PlaygroundNodes,
    }), []);

    return (
        <div className="min-h-screen bg-background">
            <EditorNavbar slug={slug} connectedUsers={connectedUsers} isOnline={isOnline} />
            <LexicalCollaboration key={slug || 'default'}>
                <LexicalComposer initialConfig={initialConfig}>
                    <TableContext>
                        <ToolbarContext>
                            <div className="editor-shell">
                                <Editor />
                            </div>
                            {measureTypingPerf ? <TypingPerfPlugin /> : null}
                        </ToolbarContext>
                    </TableContext>
                    <CollaborationPlugin
                        id={slug || 'default'}
                        providerFactory={createWebsocketProvider}
                        shouldBootstrap={false}
                        username={currentUser.name}
                    />
                    <PendingNotePlugin documentId={slug} />
                </LexicalComposer>
            </LexicalCollaboration>
        </div>
    );
}

export default CollaborationPageWrapper;
