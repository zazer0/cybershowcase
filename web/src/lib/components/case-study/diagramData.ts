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

// === Entity-based layout (new) ===

export interface SubRegion {
	id: string;
	label: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface EntityDef {
	id: string;
	label: string;
	position: [number, number, number];
	size: [number, number, number]; // width, height, depth
	borderColor: string;
	subRegions: SubRegion[];
}

export interface CameraPreset {
	position: [number, number, number];
	lookAt: [number, number, number];
}

export const CYBERCLAW_ENTITY: EntityDef = {
	id: 'cyberclaw',
	label: 'CYBERCLAW',
	position: [-2.5, 0.3, 0],
	size: [1.8, 2.2, 0.3],
	borderColor: '#C9A227',
	subRegions: [
		{ id: 'orchestrator', label: 'orchestrator', x: 0.1, y: 0.3, width: 0.8, height: 0.25 },
		{ id: 'spawn', label: 'spawn agent via SSH', x: 0.1, y: 0.6, width: 0.8, height: 0.2 }
	]
};

export const DEVVM_ENTITY: EntityDef = {
	id: 'devvm',
	label: 'DEV VM',
	position: [1.8, 0, 0],
	size: [1.8, 2.2, 0.3],
	borderColor: '#CFCBC0',
	subRegions: [
		{ id: 'cli-agent', label: 'CLI Agent', x: 0.2, y: 0.15, width: 0.6, height: 0.12 },
		{ id: 'automate-loop', label: 'automate_loop.sh', x: 0.05, y: 0.3, width: 0.9, height: 0.35 },
		{ id: 'validator', label: 'solution.sh', x: 0.15, y: 0.7, width: 0.7, height: 0.12 },
		{ id: 'success-badge', label: '13/13 PASS', x: 0.25, y: 0.85, width: 0.5, height: 0.1 }
	]
};

export const AUTOMATE_LOOP_STAGES = [
	{ id: 'diagnose', label: 'DIAGNOSE', description: 'investigate error' },
	{ id: 'plan', label: 'PLAN', description: 'write fix steps' },
	{ id: 'implement', label: 'IMPLEMENT', description: 'execute plan' }
] as const;

export const CAMERA_FULL: CameraPreset = {
	position: [0, 0.5, 7],
	lookAt: [0, 0, 0]
};

export const CAMERA_ZOOM_VM: CameraPreset = {
	position: [1.8, 0, 4],
	lookAt: [1.8, 0, 0]
};

export const ENTITIES = [CYBERCLAW_ENTITY, DEVVM_ENTITY] as const;
