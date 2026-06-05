/**
 * Static data for the two-panel system architecture diagram.
 * Element positions, connection definitions, and utility functions.
 * No Three.js imports — pure data/logic module for testability.
 */

export interface ElementData {
	id: string;
	label: string;
	position: [number, number, number]; // 3D world position (all z=0)
	type: 'card' | 'sub-card' | 'sub-item' | 'connection';
	parent?: string; // which card this belongs to
}

export interface ConnectionData {
	id: string;
	fromId: string;
	toId: string;
	label: string;
	style: 'dashed';
}

/**
 * Two-panel layout elements.
 * Left panel: CYBERCLAW agent system (x < 0)
 * Right panel: DEV VM server (x > 0)
 * Center: SSH connection labels
 */
export const ELEMENTS: ElementData[] = [
	{ id: 'agent', label: 'CYBERCLAW', position: [-3.0, 0, 0], type: 'card' },
	{ id: 'cyberclaw', label: 'Cyberclaw', position: [-3.0, 0.6, 0], type: 'sub-card', parent: 'agent' },
	{ id: 'orchestrator', label: 'orchestrator', position: [-3.0, -0.4, 0], type: 'sub-item', parent: 'agent' },
	{ id: 'server', label: 'DEV VM', position: [3.0, 0, 0], type: 'card' },
	{ id: 'cli-agent', label: 'CLI Agent', position: [3.0, 0.6, 0], type: 'sub-item', parent: 'server' },
	{ id: 'automate-loop', label: 'automate_loop.sh', position: [3.0, 0, 0], type: 'sub-item', parent: 'server' },
	{ id: 'solution-sh', label: 'solution.sh', position: [3.0, -0.6, 0], type: 'sub-item', parent: 'server' },
	{ id: 'ssh', label: 'SSH', position: [0, 0.3, 0], type: 'connection' },
	{ id: 'result', label: 'result', position: [0, -0.3, 0], type: 'connection' }
];

/**
 * SSH arrow connecting the two panels.
 */
export const CONNECTIONS: ConnectionData[] = [
	{ id: 'ssh-arrow', fromId: 'agent', toId: 'server', label: 'SSH', style: 'dashed' }
];

/** Look up an element by ID. */
export function getNodeById(id: string): ElementData | undefined {
	return ELEMENTS.find((e) => e.id === id);
}

/** Look up an element's 3D position, returning [0,0,0] for unknown IDs. */
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
