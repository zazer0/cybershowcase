import { describe, it, expect } from 'vitest';
import {
	getAnimationType,
	getParticleCount,
	getSSHParticlePosition,
	SSH_ARROW_START,
	SSH_ARROW_END,
	getCameraConfig,
	DEFAULT_CAMERA,
	STEP2_CAMERA,
	getSubstepGlow,
	SUBSTEP_CYCLE_DURATION,
	SUBSTEP_COUNT
} from '../animationData.js';

describe('getAnimationType', () => {
	it('returns "ssh-flow" for the ssh connection element', () => {
		expect(getAnimationType('ssh')).toBe('ssh-flow');
	});

	it('returns null for the agent card', () => {
		expect(getAnimationType('agent')).toBeNull();
	});

	it('returns null for the server card', () => {
		expect(getAnimationType('server')).toBeNull();
	});

	it('returns null for unknown node IDs', () => {
		expect(getAnimationType('unknown')).toBeNull();
	});

	it('returns null for the result connection element', () => {
		expect(getAnimationType('result')).toBeNull();
	});
});

describe('getParticleCount', () => {
	it('returns 6 for ssh-flow animation', () => {
		expect(getParticleCount('ssh-flow')).toBe(6);
	});

	it('returns 0 for unknown animation type', () => {
		expect(getParticleCount('other')).toBe(0);
	});

	it('returns 0 for null', () => {
		expect(getParticleCount(null)).toBe(0);
	});
});

describe('getSSHParticlePosition', () => {
	it('returns a 3-element array', () => {
		const pos = getSSHParticlePosition(0, 0.5);
		expect(pos).toHaveLength(3);
		for (const c of pos) {
			expect(typeof c).toBe('number');
		}
	});

	it('at t=0, particleIdx=0 position is near SSH_ARROW_START', () => {
		const pos = getSSHParticlePosition(0, 0);
		expect(pos[0]).toBeCloseTo(SSH_ARROW_START[0], 5);
		expect(pos[1]).toBeCloseTo(SSH_ARROW_START[1], 5);
		expect(pos[2]).toBeCloseTo(SSH_ARROW_START[2], 5);
	});

	it('at t=1, particleIdx=0 position is near SSH_ARROW_END', () => {
		const pos = getSSHParticlePosition(0, 1);
		expect(pos[0]).toBeCloseTo(SSH_ARROW_END[0], 5);
		expect(pos[1]).toBeCloseTo(SSH_ARROW_END[1], 5);
		expect(pos[2]).toBeCloseTo(SSH_ARROW_END[2], 5);
	});

	it('different particle indices produce different x positions at same t', () => {
		const pos0 = getSSHParticlePosition(0, 0.5);
		const pos1 = getSSHParticlePosition(1, 0.5);
		expect(pos0[0]).not.toBeCloseTo(pos1[0], 5);
	});

	it('all coordinates are finite numbers for any valid input', () => {
		for (let i = 0; i < 6; i++) {
			const pos = getSSHParticlePosition(i, 0.5);
			expect(Number.isFinite(pos[0])).toBe(true);
			expect(Number.isFinite(pos[1])).toBe(true);
			expect(Number.isFinite(pos[2])).toBe(true);
		}
	});
});

describe('getCameraConfig', () => {
	it('returns DEFAULT_CAMERA for steps 0, 1, 3, 4', () => {
		for (const step of [0, 1, 3, 4]) {
			expect(getCameraConfig(step)).toBe(DEFAULT_CAMERA);
		}
	});

	it('returns STEP2_CAMERA for step 2', () => {
		expect(getCameraConfig(2)).toBe(STEP2_CAMERA);
	});

	it('camera configs have 3-element position arrays', () => {
		expect(DEFAULT_CAMERA.position).toHaveLength(3);
		expect(STEP2_CAMERA.position).toHaveLength(3);
	});

	it('camera configs have 3-element lookAt arrays', () => {
		expect(DEFAULT_CAMERA.lookAt).toHaveLength(3);
		expect(STEP2_CAMERA.lookAt).toHaveLength(3);
	});
});

describe('getSubstepGlow', () => {
	it('returns 0 for non-active substep', () => {
		// At time=0, substep 0 is active, so substep 1 should return 0
		const glow = getSubstepGlow(1, 0);
		expect(glow).toBe(0);
	});

	it('returns > 0 for active substep at midpoint', () => {
		// Substep 0 is active at time = SUBSTEP_CYCLE_DURATION / (2 * SUBSTEP_COUNT)
		// which is the midpoint of substep 0's window
		const midpoint = SUBSTEP_CYCLE_DURATION / (2 * SUBSTEP_COUNT);
		const glow = getSubstepGlow(0, midpoint);
		expect(glow).toBeGreaterThan(0);
	});

	it('returns value between 0 and 1 inclusive', () => {
		// Sample across a full cycle
		for (let i = 0; i < SUBSTEP_COUNT; i++) {
			for (let t = 0; t < SUBSTEP_CYCLE_DURATION; t += 0.1) {
				const glow = getSubstepGlow(i, t);
				expect(glow).toBeGreaterThanOrEqual(0);
				expect(glow).toBeLessThanOrEqual(1);
			}
		}
	});

	it('peak glow is 1 at substep midpoint', () => {
		// At the exact midpoint of substep 0's window, sin(0.5 * PI) = 1
		const midpoint = SUBSTEP_CYCLE_DURATION / (2 * SUBSTEP_COUNT);
		const glow = getSubstepGlow(0, midpoint);
		expect(glow).toBeCloseTo(1, 5);
	});
});
