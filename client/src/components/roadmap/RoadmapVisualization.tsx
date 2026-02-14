import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { RoadmapNode, RoadmapEdge } from '@/types';

interface ProcessedNode extends RoadmapNode {
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    children: ProcessedNode[];
    // Layout properties
    x: number;
    y: number;
    width: number;
    height: number;
    lane: 'center' | 'left' | 'right';
}

interface RoadmapVisualizationProps {
    nodes: RoadmapNode[];
    edges: RoadmapEdge[];
    userProgress: Record<string, any>;
    onNodeClick?: (nodeId: string, label: string) => void;
}

// --- CONSTANTS & CONFIG ---
const CONFIG = {
    MAIN_WIDTH: 260,
    MAIN_HEIGHT: 80,
    SUB_WIDTH: 200,
    BASE_SUB_HEIGHT: 50,
    GAP_Y_BUFFER: 100,    // Pure empty space between node clusters (reduced from fixed 220)
    GAP_Y_SUB: 20,        // Vertical gap between subtopics
    GAP_X_BRANCH: 120,    // Horizontal gap from main spine to subtopic columns
    SPINE_X: 600,         // Center X coordinate
    START_Y: 150          // Initial top padding
};

// --- STYLES ---
const STYLES = {
    colors: {
        bg: '#121212',
        spine: '#d946ef',        // Pink/Magenta
        branch: '#d946ef',       // Pink/Magenta
        main: {
            bg: '#111827',
            border: '#06b6d4',   // Cyan
            text: '#ffffff',
            glow: '0 0 20px rgba(6, 182, 212, 0.3)'
        },
        sub: {
            bg: 'rgba(30, 41, 59, 0.8)',
            border: '#0ea5e9',   // Sky Blue
            text: '#cbd5e1'
        },
        status: {
            completed: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', text: '#d1fae5', gradient: '#34d399, #059669' },
            in_progress: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', text: '#fef3c7', gradient: '#fbbf24, #d97706' },
        }
    }
};

/**
 * Heuristic to calculate node height based on text length
 */
const calculateNodeHeight = (label: string, isMain: boolean): number => {
    if (isMain) return CONFIG.MAIN_HEIGHT;

    // Base height covers padding + ~2 lines
    const charsPerLine = 22; // Approx for subtopic width
    const lineHeight = 20;   // px
    const padding = 30;      // px (top + bottom)

    const lines = Math.ceil(label.length / charsPerLine);
    const estimatedHeight = Math.max(CONFIG.BASE_SUB_HEIGHT, padding + (lines * lineHeight));

    return estimatedHeight;
};

export const RoadmapVisualization = ({ nodes, edges, userProgress = {}, onNodeClick }: RoadmapVisualizationProps) => {

    // --- LAYOUT ENGINE ---
    const layout = useMemo(() => {
        if (!nodes.length) return { nodes: [], height: 0 };

        // 1. Identify Main Chain (Spine)
        const nodeMap = new Map(nodes.map(n => [n.id, {
            ...n,
            children: [] as ProcessedNode[],
            status: userProgress[n.id] || 'pending',
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            lane: 'center' as const
        }]));

        const roots: ProcessedNode[] = [];
        nodes.forEach(n => {
            const processed = nodeMap.get(n.id)!;
            if (n.type === 'main' || !n.parent_id) {
                roots.push(processed);
            } else if (n.parent_id) {
                const parent = nodeMap.get(n.parent_id);
                if (parent) parent.children.push(processed);
            }
        });

        // Dedup roots just in case
        const uniqueRoots = Array.from(new Set(roots));

        // Sort roots sequentially.
        const spine = uniqueRoots.sort((a, b) => {
            const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        // 2. Calculate Coordinates (Dynamic Spacing)
        const positionedNodes: ProcessedNode[] = [];
        let currentCenterY = CONFIG.START_Y;
        let prevHalfHeight = 0;
        let maxY = 0; // Track bottom-most point

        spine.forEach((node, index) => {
            // --- STEP A: Calculate Geometry FIRST ---
            const leftKids = node.children.filter((_: any, i: number) => i % 2 === 0);
            const rightKids = node.children.filter((_: any, i: number) => i % 2 === 1);

            const leftHeights = leftKids.map((child: any) => calculateNodeHeight(child.label, false));
            const rightHeights = rightKids.map((child: any) => calculateNodeHeight(child.label, false));

            // Height = Sum(Heights) + Sum(Gaps)
            const leftTotalH = leftHeights.reduce((sum: number, h: number) => sum + h, 0) +
                (Math.max(0, leftKids.length - 1) * CONFIG.GAP_Y_SUB);

            const rightTotalH = rightHeights.reduce((sum: number, h: number) => sum + h, 0) +
                (Math.max(0, rightKids.length - 1) * CONFIG.GAP_Y_SUB);

            // Cluster Height is max of spine node or side columns
            // This determines how much vertical space this node "owns"
            const maxClusterH = Math.max(CONFIG.MAIN_HEIGHT, leftTotalH, rightTotalH);
            const currentHalfHeight = maxClusterH / 2;

            // --- STEP B: Determine Vertical Position ---
            if (index > 0) {
                // Pos = PrevPos + PrevHalf + Buffer + CurrHalf
                currentCenterY += prevHalfHeight + CONFIG.GAP_Y_BUFFER + currentHalfHeight;
            } else {
                // First node adjustment if needed, or just start at START_Y centered
                // Ensure START_Y allows for the top half of the first node
                currentCenterY = Math.max(CONFIG.START_Y, currentHalfHeight + 50);
            }
            prevHalfHeight = currentHalfHeight;

            // --- STEP C: Position Main Node ---
            node.width = CONFIG.MAIN_WIDTH;
            node.height = CONFIG.MAIN_HEIGHT;
            node.x = CONFIG.SPINE_X - (CONFIG.MAIN_WIDTH / 2);
            node.y = currentCenterY - (CONFIG.MAIN_HEIGHT / 2); // Top-Left from Center
            node.lane = 'center';
            positionedNodes.push(node);

            // --- STEP D: Position Subtopics (Centered) ---

            // Left Group
            let subY = currentCenterY - (leftTotalH / 2); // Start Y relative to center
            leftKids.forEach((child: any, i: number) => {
                child.width = CONFIG.SUB_WIDTH;
                child.height = leftHeights[i];
                child.x = CONFIG.SPINE_X - (CONFIG.MAIN_WIDTH / 2) - CONFIG.GAP_X_BRANCH - CONFIG.SUB_WIDTH;
                child.y = subY;
                child.lane = 'left';
                positionedNodes.push(child);
                subY += child.height + CONFIG.GAP_Y_SUB;
            });
            maxY = Math.max(maxY, subY);

            // Right Group
            subY = currentCenterY - (rightTotalH / 2);
            rightKids.forEach((child: any, i: number) => {
                child.width = CONFIG.SUB_WIDTH;
                child.height = rightHeights[i];
                child.x = CONFIG.SPINE_X + (CONFIG.MAIN_WIDTH / 2) + CONFIG.GAP_X_BRANCH;
                child.y = subY;
                child.lane = 'right';
                positionedNodes.push(child);
                subY += child.height + CONFIG.GAP_Y_SUB;
            });
            maxY = Math.max(maxY, subY);
        });

        // Add padding to bottom
        const totalHeight = Math.max(maxY, currentCenterY + prevHalfHeight) + 200;

        return { nodes: positionedNodes, height: totalHeight };
    }, [nodes, userProgress]);

    // --- DRAWING HELPERS ---
    const drawSpine = () => {
        if (!layout.nodes.length) return null;

        const centerNodes = layout.nodes.filter(n => n.lane === 'center');
        if (!centerNodes.length) return null;

        const firstNode = centerNodes[0];
        const lastNode = centerNodes[centerNodes.length - 1];

        const startY = firstNode.y;
        const endY = lastNode.y + lastNode.height + 100;

        return (
            <line
                x1={CONFIG.SPINE_X}
                y1={startY}
                x2={CONFIG.SPINE_X}
                y2={endY}
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
            />
        );
    };

    const drawBranchConnector = (parent: ProcessedNode, child: ProcessedNode) => {
        // Start from center of parent side
        const startX = child.lane === 'left' ? parent.x : parent.x + parent.width;

        // Start from absolute vertical center of parent
        const startY = parent.y + (parent.height / 2);

        // End at center of child side
        const endX = child.lane === 'left' ? child.x + child.width : child.x;
        const endY = child.y + (child.height / 2);

        // Control points for bezier
        const c1x = child.lane === 'left' ? startX - 40 : startX + 40;
        const c1y = startY;
        const c2x = child.lane === 'left' ? endX + 40 : endX - 40;
        const c2y = endY;

        const path = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;

        return (
            <path
                key={`${parent.id}-${child.id}`}
                d={path}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="4 4" // Dotted
                opacity="0.6"
            />
        );
    };

    const renderConnections = () => {
        const spineNodes = layout.nodes.filter(n => n.lane === 'center');
        const connections: JSX.Element[] = [];

        // Branch Connections
        spineNodes.forEach(parent => {
            parent.children.forEach(child => {
                connections.push(drawBranchConnector(parent, child));
            });
        });

        return (
            <svg
                width="1200"
                height={layout.height}
                className="absolute top-0 left-0 pointer-events-none overflow-visible"
            >
                {drawSpine()}
                {connections}
            </svg>
        );
    };

    return (
        <div className="w-full h-full min-h-screen bg-[#121212] overflow-x-auto overflow-y-auto relative scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-transparent">
            <div
                className="relative mx-auto transition-all duration-300 ease-in-out"
                style={{ width: '1200px', height: layout.height }}
            >
                {/* 1. LAYER: EDGES */}
                {renderConnections()}

                {/* 2. LAYER: NODES */}
                {layout.nodes.map((node) => {
                    const isMain = node.lane === 'center';

                    // Determine styles based on state
                    let bgColor = isMain ? STYLES.colors.main.bg : STYLES.colors.sub.bg;
                    let textColor = isMain ? STYLES.colors.main.text : STYLES.colors.sub.text;
                    let shadow = 'none'; // REMOVED GLOW
                    let borderStyle = {};

                    // Gradient for border
                    const gradientColors = '#06b6d4, #2563eb'; // Cyan-500 to Blue-600

                    if (isMain) {
                        borderStyle = {
                            border: '2px solid transparent',
                            background: `linear-gradient(${bgColor}, ${bgColor}) padding-box, linear-gradient(to right, ${gradientColors}) border-box`
                        };
                    } else {
                        // Sub-nodes keep solid border for now unless status changes
                        const borderColor = STYLES.colors.sub.border;
                        borderStyle = {
                            border: `2px solid ${borderColor}`,
                            backgroundColor: bgColor
                        };
                    }

                    // Progress Overrides
                    if (node.status === 'completed') {
                        const statusColor = STYLES.colors.status.completed.border;
                        const statusGradient = STYLES.colors.status.completed.gradient;
                        textColor = STYLES.colors.status.completed.text;
                        // shadow override removed

                        // Universal Gradient Border for completed status using Standard BG
                        borderStyle = {
                            border: '2px solid transparent',
                            background: `linear-gradient(${bgColor}, ${bgColor}) padding-box, linear-gradient(to right, ${statusGradient}) border-box`
                        };
                    } else if (node.status === 'in_progress') {
                        const statusColor = STYLES.colors.status.in_progress.border;
                        const statusGradient = STYLES.colors.status.in_progress.gradient;
                        textColor = STYLES.colors.status.in_progress.text;
                        // shadow override removed

                        // Universal Gradient Border for in_progress status using Standard BG
                        borderStyle = {
                            border: '2px solid transparent',
                            background: `linear-gradient(${bgColor}, ${bgColor}) padding-box, linear-gradient(to right, ${statusGradient}) border-box`
                        };
                    }

                    return (
                        <motion.div
                            key={node.id}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            whileHover={{ scale: 1.05, zIndex: 50 }}
                            onClick={() => onNodeClick?.(node.id, node.label)}
                            className={`absolute flex items-center justify-center p-4 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-md`}

                            style={{
                                left: node.x,
                                top: node.y,
                                width: node.width,
                                height: node.height,
                                color: textColor,
                                boxShadow: shadow,
                                ...borderStyle,
                                // Fonts
                                fontFamily: '"Inter", sans-serif',
                                fontSize: isMain ? '18px' : '15px',
                                fontWeight: isMain ? 700 : 500,
                            }}
                        >
                            {/* Status Badge (Corner) */}
                            {node.status !== 'pending' && (
                                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center bg-[#121212] border-2 border-current shadow-lg z-10 font-bold text-xs"
                                    style={{
                                        borderColor: node.status === 'completed' ? STYLES.colors.status.completed.border :
                                            node.status === 'in_progress' ? STYLES.colors.status.in_progress.border :
                                                STYLES.colors.sub.border,
                                        color: node.status === 'completed' ? STYLES.colors.status.completed.border :
                                            node.status === 'in_progress' ? STYLES.colors.status.in_progress.border :
                                                STYLES.colors.sub.border
                                    }}
                                >
                                    {node.status === 'completed' && '✓'}
                                    {node.status === 'in_progress' && '⚡'}
                                    {node.status === 'skipped' && '⏭️'}
                                </div>
                            )}

                            <span className="text-center leading-tight">
                                {node.label}
                            </span>

                            {/* Main Node Numbering if desired */}
                            {isMain && (
                                <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-gray-700 font-bold text-4xl opacity-20 pointer-events-none select-none">
                                    {node.id.replace(/\D/g, '')}
                                </div>
                            )}
                        </motion.div>
                    );
                })}

                {/* 3. FOOTER */}
                {(() => {
                    const centerNodes = layout.nodes.filter(n => n.lane === 'center');
                    if (!centerNodes.length) return null;
                    const last = centerNodes[centerNodes.length - 1];

                    return (
                        <div
                            className="absolute left-1/2 -translate-x-1/2 text-center"
                            style={{
                                top: last.y + last.height + 110
                            }}
                        >
                            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 font-outfit uppercase tracking-widest opacity-90 drop-shadow-lg">
                                Keep Learning
                            </span>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};
