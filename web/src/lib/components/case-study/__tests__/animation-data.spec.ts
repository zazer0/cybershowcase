import { describe, it, expect } from 'vitest';
import {
	getAnimationType,
	getParticleCount,
	getOrchParticlePosition,
	getCodingParticlePosition,
	getValidatorParticlePosition,
	ORCH_PATHS,
	CODING_CENTER,
	VALIDATOR_CENTER
} from '../animationData.js';

describe('getAnimationType', () => {
	it('returns "orchestrate" for orchestrating node', () => {
		expect(getAnimationType('orchestrate')).toBe('orchestrate');
	});

	it('returns "coding" for coding-agent node', () => {
		expect(getAnimationType('coding-agent')).toBe('coding');
	});

	it('returns "validator" for validator node', () => {
		expect(getAnimationType('validator')).toBe('validator');
	});

	it('returns null for non-cycle nodes (trigger)', () => {
		expect(getAnimationType('trigger')).toBeNull();
	});

	it('returns null for non-cycle nodes (resolution)', () => {
		expect(getAnimationType('resolution')).toBeNull();
	});

	it('returns null for unknown node IDs', () => {
		expect(getAnimationType('unknown')).toBeNull();
	});
});

describe('getParticleCount', () => {
	it('returns 9 for orchestrate animation (3 paths × 3 particles)', () => {
		expect(getParticleCount('orchestrate')).toBe(9);
	});

	it('returns 8 for coding animation', () => {
		expect(getParticleCount('coding')).toBe(8);
	});

	it('returns 8 for validator animation', () => {
		expect(getParticleCount('validator')).toBe(8);
	});

	it('returns 0 for unknown animation type', () => {
		expect(getParticleCount('unknown')).toBe(0);
	});
});

describe('ORCH_PATHS', () => {
	it('has 3 paths', () => {
		expect(ORCH_PATHS).toHaveLength(3);
	});

	it('path 0 goes from orchestrate to coding-agent', () => {
		const p = ORCH_PATHS[0];
		expect(p.from).toEqual([0, 1, 0]);
		expect(p.to).toEqual([1.3, -0.8, 0]);
	});

	it('path 1 goes from validator to orchestrate (reverse cycle arc)', () => {
		const p = ORCH_PATHS[1];
		expect(p.from).toEqual([-1.5, -0.8, 0]);
		expect(p.to).toEqual([0, 1, 0]);
	});

	it('path 2 goes from orchestrate down toward resolution (I/O connector)', () => {
		const p = ORCH_PATHS[2];
		expect(p.from).toEqual([0, 1, 0]);
		expect(p.to).toEqual([0, -2.2, 0]);
	});

	it('paths with control points have valid tuple format', () => {
		for (const p of ORCH_PATHS) {
			if (p.controlPoint) {
				expect(p.controlPoint).toHaveLength(3);
				for (const c of p.controlPoint) {
					expect(typeof c).toBe('number');
				}
			}
		}
	});
});

describe('getOrchParticlePosition', () => {
	it('returns a 3-element array', () => {
		const pos = getOrchParticlePosition(0, 0.5);
		expect(pos).toHaveLength(3);
		for (const c of pos) {
			expect(typeof c).toBe('number');
		}
	});

	it('at t=0, path 0 starts at orchestrate position', () => {
		const pos = getOrchParticlePosition(0, 0);
		expect(pos[0]).toBeCloseTo(0, 1);
		expect(pos[1]).toBeCloseTo(1, 1);
	});

	it('at t=1, path 0 ends at coding-agent position', () => {
		const pos = getOrchParticlePosition(0, 1);
		expect(pos[0]).toBeCloseTo(1.3, 1);
		expect(pos[1]).toBeCloseTo(-0.8, 1);
	});

	it('at t=0, path 1 starts at validator position', () => {
		const pos = getOrchParticlePosition(1, 0);
		expect(pos[0]).toBeCloseTo(-1.5, 1);
		expect(pos[1]).toBeCloseTo(-0.8, 1);
	});

	it('at t=1, path 1 ends at orchestrate position', () => {
		const pos = getOrchParticlePosition(1, 1);
		expect(pos[0]).toBeCloseTo(0, 1);
		expect(pos[1]).toBeCloseTo(1, 1);
	});

	it('at t=0.5, path 2 (linear) is halfway between orchestrate and resolution', () => {
		const pos = getOrchParticlePosition(2, 0.5);
		// Linear path: y from 1 to -2.2, midpoint = -0.6
		expect(pos[0]).toBeCloseTo(0, 1);
		expect(pos[1]).toBeCloseTo(-0.6, 1);
		expect(pos[2]).toBeCloseTo(0, 1);
	});

	it('clamps path index to valid range', () => {
		// Invalid path index should still return a valid position using path 0
		const pos = getOrchParticlePosition(99, 0);
		expect(pos).toHaveLength(3);
	});
});

describe('getCodingParticlePosition', () => {
	it('returns a 3-element array', () => {
		const pos = getCodingParticlePosition(0, 0.5, 0);
		expect(pos).toHaveLength(3);
		for (const c of pos) {
			expect(typeof c).toBe('number');
		}
	});

	it('at t=0, particle is near coding-agent Y position', () => {
		const pos = getCodingParticlePosition(0, 0, 0);
		expect(pos[1]).toBeCloseTo(-0.8, 1);
	});

	it('at t=1, particle has risen above coding-agent', () => {
		const pos = getCodingParticlePosition(0, 1, 0);
		expect(pos[1]).toBeGreaterThan(-0.8);
	});

	it('different particle indices produce different X offsets', () => {
		const pos0 = getCodingParticlePosition(0, 0.5, 0);
		const pos1 = getCodingParticlePosition(1, 0.5, 0);
		// They should have different positions due to spread
		expect(pos0[0] !== pos1[0] || pos0[2] !== pos1[2]).toBe(true);
	});

	it('particles stay near coding-agent X coordinate', () => {
		const pos = getCodingParticlePosition(0, 0.5, 0);
		// Should be within ~0.5 units of coding agent X (1.3)
		expect(Math.abs(pos[0] - 1.3)).toBeLessThan(0.5);
	});
});

describe('getValidatorParticlePosition', () => {
	it('returns a 3-element array', () => {
		const pos = getValidatorParticlePosition(0, 0.5, 0);
		expect(pos).toHaveLength(3);
		for (const c of pos) {
			expect(typeof c).toBe('number');
		}
	});

	it('at t=0, particle is far from validator center', () => {
		const pos = getValidatorParticlePosition(0, 0, 0);
		const dist = Math.sqrt((pos[0] + 1.5) ** 2 + (pos[1] + 0.8) ** 2 + pos[2] ** 2);
		expect(dist).toBeGreaterThan(0.5);
	});

	it('at t=1, particle has converged near validator center', () => {
		const pos = getValidatorParticlePosition(0, 1, 0);
		const dist = Math.sqrt((pos[0] + 1.5) ** 2 + (pos[1] + 0.8) ** 2 + pos[2] ** 2);
		expect(dist).toBeLessThan(0.3);
	});

	it('particles converge inward as t increases', () => {
		const posEarly = getValidatorParticlePosition(0, 0.2, 0);
		const posLate = getValidatorParticlePosition(0, 0.8, 0);
		const distEarly = Math.sqrt(
			(posEarly[0] + 1.5) ** 2 + (posEarly[1] + 0.8) ** 2 + posEarly[2] ** 2
		);
		const distLate = Math.sqrt((posLate[0] + 1.5) ** 2 + (posLate[1] + 0.8) ** 2 + posLate[2] ** 2);
		expect(distLate).toBeLessThan(distEarly);
	});

	it('different particle indices produce distinct positions', () => {
		const pos0 = getValidatorParticlePosition(0, 0.5, 0);
		const pos1 = getValidatorParticlePosition(1, 0.5, 0);
		const samePosition = pos0[0] === pos1[0] && pos0[1] === pos1[1] && pos0[2] === pos1[2];
		expect(samePosition).toBe(false);
	});
});

describe('animation centers', () => {
	it('CODING_CENTER is at coding-agent position', () => {
		expect(CODING_CENTER).toEqual([1.3, -0.8, 0]);
	});

	it('VALIDATOR_CENTER is at validator position', () => {
		expect(VALIDATOR_CENTER).toEqual([-1.5, -0.8, 0]);
	});
});
