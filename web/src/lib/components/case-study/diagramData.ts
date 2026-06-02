/**
 * Static data for the 3D cycle diagram.
 * Node positions, arc definitions, and utility functions.
 * No Three.js imports — pure data/logic module for testability.
 */

export interface NodeData {
	id: string;
	label: string;
	position: [number, number, number];
	isIO?: boolean;
}

export interface ArcData {
	id: string;
	fromId: string;
	toId: string;
	/** Bezier control point for the curved arc */
	controlPoint: [number, number, number];
}

/**
 * 5 system nodes in 3D space (Y-up).
 * Layout:
 *   Trigger (0, 2.2, 0)          — I/O top
 *   Orchestrate (0, 1, 0)        — Cycle top
 *   Coding Agent (1.5, -0.8, 0)  — Cycle bottom-right
 *   Validator (-1.5, -0.8, 0)    — Cycle bottom-left
 *   Resolution (0, -2.2, 0)      — I/O bottom
 */
export const NODES: NodeData[] = [
	{ id: 'trigger', label: 'Trigger', position: [0, 2.2, 0], isIO: true },
	{ id: 'orchestrate', label: 'Orchestrate', position: [0, 1, 0] },
	{ id: 'coding-agent', label: 'Coding Agent', position: [1.3, -0.8, 0] },
	{ id: 'validator', label: 'Validator', position: [-1.5, -0.8, 0] },
	{ id: 'resolution', label: 'Resolution', position: [0, -2.2, 0], isIO: true }
];

/**
 * 3 cycle arcs: orchestrate → coding-agent → validator → orchestrate
 * controlPoint creates the outward curve for each arc.
 */
export const ARCS: ArcData[] = [
	{
		id: 'orchestrate-to-coding',
		fromId: 'orchestrate',
		toId: 'coding-agent',
		controlPoint: [2.4, 0.6, 0]
	},
	{
		id: 'coding-to-validator',
		fromId: 'coding-agent',
		toId: 'validator',
		controlPoint: [0, -2.4, 0]
	},
	{
		id: 'validator-to-orchestrate',
		fromId: 'validator',
		toId: 'orchestrate',
		controlPoint: [-2.4, 0.6, 0]
	}
];

/** Look up a node by ID. */
export function getNodeById(id: string): NodeData | undefined {
	return NODES.find((n) => n.id === id);
}

/** Look up a node's 3D position, returning [0,0,0] for unknown IDs. */
export function getNodePosition(id: string): [number, number, number] {
	return getNodeById(id)?.position ?? [0, 0, 0];
}

/** Returns true when the given node is the active one. */
export function isNodeActive(nodeId: string, activeNodeId: string): boolean {
	return nodeId === activeNodeId;
}

/** Returns true when the given arc is the active one. */
export function isArcActive(arcId: string, activeArcId: string | null): boolean {
	return arcId === activeArcId;
}
