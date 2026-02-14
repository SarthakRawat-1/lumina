/**
 * CourseGraph - Interactive course knowledge graph visualization
 * 
 * Uses React Flow with Dagre layout to visualize course topics and prerequisites.
 */
import { useCallback, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
} from '@xyflow/react';
import type { Node, Edge, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
import { Lock, CheckCircle2, Circle, PlayCircle, Clock } from 'lucide-react';
import type { TopicNode, TopicEdge, NodeStatus } from '@/types';


// =============================================================================
// Custom Node Component
// =============================================================================

interface CourseNodeData extends Record<string, unknown> {
    label: string;
    summary: string;
    status: NodeStatus;
    timeMinutes: number;
}

function CourseNode({ data, selected }: NodeProps<Node<CourseNodeData>>) {
    const getStatusStyles = () => {
        switch (data.status) {
            case 'completed':
                return 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]';
            case 'in_progress':
                return 'border-amber-500 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]';
            case 'unlocked':
                // Changed from violet to teal/emerald theme
                return 'border-teal-500/50 bg-teal-500/10 hover:border-teal-400 hover:bg-teal-500/20 hover:shadow-[0_0_15px_rgba(20,184,166,0.15)]';
            case 'locked':
            default:
                return 'border-zinc-700 bg-zinc-800/50 opacity-60 hover:opacity-100 hover:border-zinc-600';
        }
    };

    const getStatusIcon = () => {
        switch (data.status) {
            case 'completed':
                return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'in_progress':
                return <PlayCircle className="w-4 h-4 text-amber-400" />;
            case 'unlocked':
                return <Circle className="w-4 h-4 text-teal-400" />;
            case 'locked':
                return <Lock className="w-4 h-4 text-zinc-500" />;
            default:
                return null;
        }
    };

    return (
        <div
            className={`
                rounded-xl border backdrop-blur-md transition-all duration-300
                cursor-pointer shadow-lg px-4 py-3 min-w-[180px] max-w-[220px] 
                flex flex-col gap-2 group
                ${getStatusStyles()}
                ${selected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-black scale-105' : ''}
            `}
        >
            <Handle type="target" position={Position.Top} className="!bg-teal-500 !w-2.5 !h-2.5 !border-2 !border-black" />

            <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-white font-semibold text-sm truncate tracking-wide flex-1">{data.label}</span>
            </div>

            <div className="text-zinc-400 text-xs flex items-center gap-1.5 font-medium pl-0.5">
                <Clock className="w-3 h-3" />
                {data.timeMinutes} min
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-teal-500 !w-2.5 !h-2.5 !border-2 !border-black" />
        </div>
    );
}

const nodeTypes = {
    courseNode: CourseNode,
};


// =============================================================================
// Layout Engine
// =============================================================================

function getLayoutedElements(
    nodes: Node<CourseNodeData>[],
    edges: Edge[],
    direction = 'TB'
): { nodes: Node<CourseNodeData>[]; edges: Edge[] } {
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: direction, nodesep: 100, ranksep: 120 }); // Increased spacing

    nodes.forEach((node) => {
        g.setNode(node.id, { width: 220, height: 80 });
    });

    edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
    });

    Dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
        const position = g.node(node.id);
        return {
            ...node,
            position: {
                x: position.x - 110,
                y: position.y - 40,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
}


// =============================================================================
// Main Component
// =============================================================================

interface CourseGraphProps {
    nodes: TopicNode[];
    edges: TopicEdge[];
    onNodeClick?: (nodeId: string, node: TopicNode) => void;
}

export function CourseGraph({
    nodes: topicNodes,
    edges: topicEdges,
    onNodeClick,
}: CourseGraphProps) {
    // Convert API data to React Flow format
    const initialNodes: Node<CourseNodeData>[] = useMemo(() => {
        return topicNodes.map((node) => ({
            id: node.id,
            type: 'courseNode',
            position: { x: 0, y: 0 },
            data: {
                label: node.title,
                summary: node.summary,
                status: node.status,
                timeMinutes: node.time_minutes,
            },
        }));
    }, [topicNodes]);

    const initialEdges: Edge[] = useMemo(() => {
        return topicEdges.map((edge, index) => ({
            id: `edge-${index}`,
            source: edge.source,
            target: edge.target,
            style: { stroke: '#14B8A6', strokeWidth: 2, opacity: 0.5 }, // Teal stroke
            animated: true, // Make edges animated by default
        }));
    }, [topicEdges]);

    // Apply layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
        () => getLayoutedElements(initialNodes, initialEdges),
        [initialNodes, initialEdges]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    // Update nodes when topic nodes change
    useEffect(() => {
        const { nodes: newLayoutedNodes, edges: newLayoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
        setNodes(newLayoutedNodes);
        setEdges(newLayoutedEdges);
    }, [topicNodes, topicEdges, initialNodes, initialEdges, setNodes, setEdges]);

    const handleNodeClick = useCallback(
        (_: React.MouseEvent, node: Node<CourseNodeData>) => {
            const topicNode = topicNodes.find(n => n.id === node.id);
            if (topicNode) {
                onNodeClick?.(node.id, topicNode);
            }
        },
        [onNodeClick, topicNodes]
    );

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden border border-white/5 bg-[#0e0e0e] shadow-2xl relative">
            <style>{`
                .react-flow__controls {
                    background: #18181B !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 8px !important;
                    overflow: hidden !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                }
                .react-flow__controls-button {
                    background: transparent !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                    fill: #a1a1aa !important; /* zinc-400 */
                }
                .react-flow__controls-button:last-child {
                    border-bottom: none !important;
                }
                .react-flow__controls-button:hover {
                    background: rgba(255, 255, 255, 0.05) !important;
                    fill: #ffffff !important;
                }
                .react-flow__controls-button svg {
                    fill: currentColor !important;
                }
            `}</style>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.3}
                maxZoom={1.5}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                proOptions={{ hideAttribution: true }}
            >
                {/* Changed background color to teal/emerald tint */}
                <Background color="#14B8A6" gap={30} size={1.5} style={{ opacity: 0.1 }} />

                {/* 
                  Fix for Controls:
                  - bg-[#18181B] sets dark background
                  - fill-white sets icon color
                  - border-white/10 for subtle border
                  - hover effects for interactivity
                */}
                <Controls showInteractive={false} />

                <MiniMap
                    className="!bg-[#18181B] !border-white/10 !rounded-lg !shadow-xl"
                    maskColor="rgba(0, 0, 0, 0.7)"
                    nodeColor={(node) => {
                        const status = (node.data as CourseNodeData)?.status;
                        if (status === 'completed') return '#10B981';
                        if (status === 'in_progress') return '#F59E0B';
                        if (status === 'unlocked') return '#14B8A6';
                        return '#3F3F46';
                    }}
                />
            </ReactFlow>
        </div>
    );
}
