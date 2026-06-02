import { describe, it, expect } from 'vitest';
import {
	NODES,
	ARCS,
	getNodeById,
	getNodePosition,
	isNodeActive,
	isArcActive
} from '../diagramData.js';

describe('NODES', () => {
	it('has exactly 5 nodes', () => {
		expect(NODES).toHaveLength(5);
	});

	it('contains all required node IDs', () => {
		const ids = NODES.map((n) => n.id);
		expect(ids).toContain('trigger');
		expect(ids).toContain('orchestrate');
		expect(ids).toContain('coding-agent');
		expect(ids).toContain('validator');
		expect(ids).toContain('resolution');
	});

	it('trigger is at top — highest Y position', () => {
		const trigger = getNodeById('trigger')!;
		const orchestrate = getNodeById('orchestrate')!;
		expect(trigger.position[1]).toBeGreaterThan(orchestrate.position[1]);
	});

	it('resolution is at bottom — lowest Y position', () => {
		const resolution = getNodeById('resolution')!;
		const validator = getNodeById('validator')!;
		expect(resolution.position[1]).toBeLessThan(validator.position[1]);
	});

	it('cycle nodes form a triangle layout', () => {
		const orch = getNodeById('orchestrate')!;
		const coding = getNodeById('coding-agent')!;
		const validator = getNodeById('validator')!;

		// Orchestrate is the highest cycle node (top of triangle)
		expect(orch.position[1]).toBeGreaterThan(coding.position[1]);
		expect(orch.position[1]).toBeGreaterThan(validator.position[1]);

		// Coding agent is to the right (positive X)
		expect(coding.position[0]).toBeGreaterThan(0);

		// Validator is to the left (negative X)
		expect(validator.position[0]).toBeLessThan(0);
	});

	it('trigger and resolution are marked as IO nodes', () => {
		expect(getNodeById('trigger')!.isIO).toBe(true);
		expect(getNodeById('resolution')!.isIO).toBe(true);
	});

	it('cycle nodes are not marked as IO', () => {
		expect(getNodeById('orchestrate')!.isIO).toBeFalsy();
		expect(getNodeById('coding-agent')!.isIO).toBeFalsy();
		expect(getNodeById('validator')!.isIO).toBeFalsy();
	});

	it('positions are [number, number, number] tuples', () => {
		for (const node of NODES) {
			expect(node.position).toHaveLength(3);
			for (const coord of node.position) {
				expect(typeof coord).toBe('number');
			}
		}
	});
});

describe('ARCS', () => {
	it('has exactly 3 cycle arcs', () => {
		expect(ARCS).toHaveLength(3);
	});

	it('contains all required arc IDs', () => {
		const ids = ARCS.map((a) => a.id);
		expect(ids).toContain('orchestrate-to-coding');
		expect(ids).toContain('coding-to-validator');
		expect(ids).toContain('validator-to-orchestrate');
	});

	it('all arc fromId and toId reference valid node IDs', () => {
		const nodeIds = new Set(NODES.map((n) => n.id));
		for (const arc of ARCS) {
			expect(nodeIds.has(arc.fromId)).toBe(true);
			expect(nodeIds.has(arc.toId)).toBe(true);
		}
	});

	it('arcs form a complete cycle: orch → coding → validator → orch', () => {
		const orch2coding = ARCS.find((a) => a.id === 'orchestrate-to-coding')!;
		const coding2val = ARCS.find((a) => a.id === 'coding-to-validator')!;
		const val2orch = ARCS.find((a) => a.id === 'validator-to-orchestrate')!;

		expect(orch2coding.fromId).toBe('orchestrate');
		expect(orch2coding.toId).toBe('coding-agent');

		expect(coding2val.fromId).toBe('coding-agent');
		expect(coding2val.toId).toBe('validator');

		expect(val2orch.fromId).toBe('validator');
		expect(val2orch.toId).toBe('orchestrate');
	});

	it('arcs chain together: toId of one matches fromId of next', () => {
		const orch2coding = ARCS.find((a) => a.id === 'orchestrate-to-coding')!;
		const coding2val = ARCS.find((a) => a.id === 'coding-to-validator')!;
		const val2orch = ARCS.find((a) => a.id === 'validator-to-orchestrate')!;

		expect(orch2coding.toId).toBe(coding2val.fromId);
		expect(coding2val.toId).toBe(val2orch.fromId);
		expect(val2orch.toId).toBe(orch2coding.fromId);
	});

	it('control points are [number, number, number] tuples', () => {
		for (const arc of ARCS) {
			expect(arc.controlPoint).toHaveLength(3);
			for (const coord of arc.controlPoint) {
				expect(typeof coord).toBe('number');
			}
		}
	});
});

describe('getNodeById', () => {
	it('returns the correct node for a known ID', () => {
		const node = getNodeById('orchestrate');
		expect(node).toBeDefined();
		expect(node!.id).toBe('orchestrate');
	});

	it('returns undefined for an unknown ID', () => {
		expect(getNodeById('nonexistent')).toBeUndefined();
	});
});

describe('getNodePosition', () => {
	it('returns the correct position for a known node', () => {
		expect(getNodePosition('orchestrate')).toEqual([0, 1, 0]);
		expect(getNodePosition('trigger')).toEqual([0, 2.2, 0]);
		expect(getNodePosition('resolution')).toEqual([0, -2.2, 0]);
		expect(getNodePosition('coding-agent')).toEqual([1.3, -0.8, 0]);
		expect(getNodePosition('validator')).toEqual([-1.5, -0.8, 0]);
	});

	it('returns [0, 0, 0] for an unknown node ID', () => {
		expect(getNodePosition('unknown')).toEqual([0, 0, 0]);
	});
});

describe('isNodeActive', () => {
	it('returns true when nodeId matches activeNodeId', () => {
		expect(isNodeActive('orchestrate', 'orchestrate')).toBe(true);
		expect(isNodeActive('trigger', 'trigger')).toBe(true);
	});

	it('returns false when nodeId does not match activeNodeId', () => {
		expect(isNodeActive('validator', 'orchestrate')).toBe(false);
		expect(isNodeActive('coding-agent', 'trigger')).toBe(false);
	});
});

describe('isArcActive', () => {
	it('returns true when arcId matches activeArcId', () => {
		expect(isArcActive('orchestrate-to-coding', 'orchestrate-to-coding')).toBe(true);
	});

	it('returns false when arcId does not match activeArcId', () => {
		expect(isArcActive('orchestrate-to-coding', 'coding-to-validator')).toBe(false);
	});

	it('returns false when activeArcId is null', () => {
		expect(isArcActive('orchestrate-to-coding', null)).toBe(false);
	});

	it('returns false for empty string activeArcId', () => {
		expect(isArcActive('orchestrate-to-coding', '')).toBe(false);
	});
});
