import { describe, it, expect } from 'vitest';
import {
	ELEMENTS,
	CONNECTIONS,
	getNodeById,
	getNodePosition,
	isNodeActive,
	isArcActive
} from '../diagramData.js';

describe('ELEMENTS', () => {
	it('has exactly 9 elements', () => {
		expect(ELEMENTS).toHaveLength(9);
	});

	it('contains all expected element IDs', () => {
		const ids = ELEMENTS.map((e) => e.id);
		expect(ids).toContain('agent');
		expect(ids).toContain('cyberclaw');
		expect(ids).toContain('orchestrator');
		expect(ids).toContain('server');
		expect(ids).toContain('cli-agent');
		expect(ids).toContain('automate-loop');
		expect(ids).toContain('solution-sh');
		expect(ids).toContain('ssh');
		expect(ids).toContain('result');
	});

	it('agent card is left of center (x < 0)', () => {
		const agent = getNodeById('agent')!;
		expect(agent.position[0]).toBeLessThan(0);
	});

	it('server card is right of center (x > 0)', () => {
		const server = getNodeById('server')!;
		expect(server.position[0]).toBeGreaterThan(0);
	});

	it('all positions are 3-element tuples with z=0', () => {
		for (const el of ELEMENTS) {
			expect(el.position).toHaveLength(3);
			for (const coord of el.position) {
				expect(typeof coord).toBe('number');
			}
			expect(el.position[2]).toBe(0);
		}
	});
});

describe('CONNECTIONS', () => {
	it('has exactly 1 connection', () => {
		expect(CONNECTIONS).toHaveLength(1);
	});

	it('ssh-arrow references valid element IDs', () => {
		const elementIds = new Set(ELEMENTS.map((e) => e.id));
		const sshArrow = CONNECTIONS.find((c) => c.id === 'ssh-arrow')!;
		expect(sshArrow).toBeDefined();
		expect(elementIds.has(sshArrow.fromId)).toBe(true);
		expect(elementIds.has(sshArrow.toId)).toBe(true);
	});
});

describe('getNodeById', () => {
	it('returns the correct element for a known ID', () => {
		const el = getNodeById('agent');
		expect(el).toBeDefined();
		expect(el!.id).toBe('agent');
	});

	it('returns undefined for an unknown ID', () => {
		expect(getNodeById('nonexistent')).toBeUndefined();
	});
});

describe('getNodePosition', () => {
	it('returns the correct position for known elements', () => {
		expect(getNodePosition('agent')).toEqual([-3.0, 0, 0]);
		expect(getNodePosition('server')).toEqual([3.0, 0, 0]);
		expect(getNodePosition('ssh')).toEqual([0, 0.3, 0]);
		expect(getNodePosition('result')).toEqual([0, -0.3, 0]);
	});

	it('returns [0, 0, 0] for an unknown element ID', () => {
		expect(getNodePosition('unknown')).toEqual([0, 0, 0]);
	});
});

describe('isNodeActive', () => {
	it('returns true when nodeId matches activeNodeId', () => {
		expect(isNodeActive('agent', 'agent')).toBe(true);
		expect(isNodeActive('server', 'server')).toBe(true);
	});

	it('returns false when nodeId does not match activeNodeId', () => {
		expect(isNodeActive('agent', 'server')).toBe(false);
		expect(isNodeActive('ssh', 'agent')).toBe(false);
	});
});

describe('isArcActive', () => {
	it('returns true when arcId matches activeArcId', () => {
		expect(isArcActive('ssh-arrow', 'ssh-arrow')).toBe(true);
	});

	it('returns false when arcId does not match activeArcId', () => {
		expect(isArcActive('ssh-arrow', 'other-arc')).toBe(false);
	});

	it('returns false when activeArcId is null', () => {
		expect(isArcActive('ssh-arrow', null)).toBe(false);
	});

	it('returns false for empty string activeArcId', () => {
		expect(isArcActive('ssh-arrow', '')).toBe(false);
	});
});
