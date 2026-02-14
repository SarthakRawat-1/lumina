/**
 * RoadmapFlow - Interactive roadmap visualization using React Flow
 * 
 * Uses Dagre for automatic tree layout to create roadmap.sh-like visualizations.
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
import type { Node, Edge, NodeProps, NodeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
import type { RoadmapNode, RoadmapEdge } from '@/types/roadmap';
import type { UserProgress } from '@/lib/roadmapApi';


// =============================================================================
// Custom Node Component
// =============================================================================

interface RoadmapNodeData extends Record<string, unknown> {
    label: string;
    type: 'main' | 'topic' | 'subtopic';
    status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

function CustomNode({ data, selected }: NodeProps<Node<RoadmapNodeData>>) {
    // Neon Brutalist Styles
    const getStatusStyles = () => {
        const base = "border-2 transition-all duration-300";
        switch (data.status) {
            case 'completed':
                // Emerald/Green - Done
                return `${base} border-emerald-500 bg-[#0c0c14] shadow-[4px_4px_0px_0px_rgba(16,185,129,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(16,185,129,0.6)] hover:-translate-y-0.5`;
            case 'in_progress':
                // Amber/Yellow - In Progress
                return `${base} border-amber-500 bg-[#0c0c14] shadow-[4px_4px_0px_0px_rgba(245,158,11,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(245,158,11,0.6)] hover:-translate-y-0.5`;
            case 'skipped':
                // Gray - Skipped
                return `${base} border-zinc-700 bg-[#0c0c14] text-zinc-500 opacity-60 grayscale`;
            default:
                // Violet/Blue - Pending (Default)
                return `${base} border-blue-500 bg-[#0c0c14] shadow-[4px_4px_0px_0px_rgba(59,130,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,0.6)] hover:-translate-y-0.5`;
        }
    };

    const getTypeStyles = () => {
        switch (data.type) {
            case 'main':
                return 'px-8 py-4 text-lg font-bold min-w-[200px] text-center';
            case 'topic':
                return 'px-6 py-3 text-sm font-semibold min-w-[150px] text-center';
            case 'subtopic':
                return 'px-4 py-2 text-xs font-medium min-w-[120px] text-center';
            default:
                return 'px-4 py-2 text-sm';
        }
    };

    // Badge Colors
    const getBadgeColor = () => {
        switch (data.status) {
            case 'completed': return 'bg-emerald-500 text-black';
            case 'in_progress': return 'bg-amber-500 text-black';
            case 'skipped': return 'bg-zinc-700 text-zinc-400';
            default: return 'bg-blue-500/20 text-blue-400 border border-blue-500/50';
        }
    };

    return (
        <div className="relative group">
            <div
                className={`
                    rounded-lg backdrop-blur-xl
                    ${getStatusStyles()}
                    ${getTypeStyles()}
                    ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0c0c14]' : ''}
                `}
            >
                {/* Node Content */}
                <div className="flex flex-col items-center justify-center gap-1">
                    <span className={`text-white ${data.status === 'skipped' ? 'text-zinc-500 line-through' : ''}`}>
                        {data.label}
                    </span>
                    {data.type === 'main' && (
                        <div className="h-0.5 w-1/2 bg-white/10 mt-1" />
                    )}
                </div>

                {/* Handles - Hidden but functional */}
                <Handle type="target" position={Position.Top} className="opacity-0 w-full h-full !bg-transparent !border-0 top-0 rounded-none z-50" />
                <Handle type="source" position={Position.Bottom} className="opacity-0 w-full h-full !bg-transparent !border-0 bottom-0 rounded-none z-50" />
            </div>

            {/* Status Badge (Absolute positioned on corner like roadmap.sh) */}
            <div className={`
                absolute -top-3 -right-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg z-10 transition-transform duration-200 group-hover:scale-110
                ${getBadgeColor()}
            `}>
                {data.status === 'completed' && '✓'}
                {data.status === 'in_progress' && '⚡'}
                {data.status === 'skipped' && '✕'}
                {(!data.status || data.status === 'pending') && (
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                )}
            </div>
        </div>
    );
}

const nodeTypes = {
    roadmap: CustomNode,
};


// =============================================================================
// Layout Engine
// =============================================================================

function getLayoutedElements(
    nodes: Node<RoadmapNodeData>[],
    edges: Edge[],
    direction = 'LR' // Changed to Left-to-Right for better readability/list view
): { nodes: Node<RoadmapNodeData>[]; edges: Edge[] } {
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    // Increased ranksep for longer connection lines, decreased nodesep
    g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 150 });

    nodes.forEach((node) => {
        // Estimate dimensions based on type
        // Main nodes are taller in LR view
        const height = node.data.type === 'main' ? 80 : 50;
        const width = node.data.type === 'main' ? 240 : 180;
        g.setNode(node.id, { width, height });
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
                // Adjust position based on center anchor
                x: position.x - (node.data.type === 'main' ? 120 : 90),
                y: position.y - (node.data.type === 'main' ? 40 : 25),
            },
        };
    });

    return { nodes: layoutedNodes, edges };
}


// =============================================================================
// Main Component
// =============================================================================

interface RoadmapFlowProps {
    roadmapNodes: RoadmapNode[];
    roadmapEdges: RoadmapEdge[];
    progress?: UserProgress;
    onNodeClick?: (nodeId: string, label: string) => void;
}

export function RoadmapFlow({
    roadmapNodes,
    roadmapEdges,
    progress,
    onNodeClick,
}: RoadmapFlowProps) {
    // Convert API data to React Flow format
    const initialNodes: Node<RoadmapNodeData>[] = useMemo(() => {
        return roadmapNodes.map((node) => ({
            id: node.id,
            type: 'roadmap',
            position: { x: 0, y: 0 },
            data: {
                label: node.label,
                type: node.type,
                status: progress?.status[node.id] || 'pending',
            },
        }));
    }, [roadmapNodes, progress]);

    const initialEdges: Edge[] = useMemo(() => {
        return roadmapEdges.map((edge, index) => ({
            id: `edge-${index}`,
            source: edge.source,
            target: edge.target,
            // Thicker, colored lines with smoothstep for circuit-board look
            style: {
                stroke: '#3b82f6', // Blue-500
                strokeWidth: 2,
                strokeOpacity: 0.5
            },
            type: 'smoothstep', // Clean orthogonal lines
            animated: false,
        }));
    }, [roadmapEdges]);

    // Apply layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
        () => getLayoutedElements(initialNodes, initialEdges),
        [initialNodes, initialEdges]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    // Update nodes when progress changes
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    status: progress?.status[node.id] || 'pending',
                },
            }))
        );
    }, [progress, setNodes]);

    const handleNodeClick = useCallback(
        (_: React.MouseEvent, node: Node<RoadmapNodeData>) => {
            onNodeClick?.(node.id, node.data.label);
        },
        [onNodeClick]
    );

    return (
        <div className="w-full h-full bg-[#0c0c14] relative">
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#3b82f630 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.2}
                maxZoom={2}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={false} // Lock nodes for cleaner view
                nodesConnectable={false}
            >
                <Controls
                    className="!bg-white/10 !border-white/20 !rounded-lg !fill-white"
                    showInteractive={false}
                />
            </ReactFlow>
        </div>
    );
}
