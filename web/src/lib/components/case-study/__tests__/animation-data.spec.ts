import { describe, it, expect } from 'vitest';
import {
	getAnimationType,
	getParticleCount,
	getSSHParticlePosition,
	SSH_ARROW_START,
	SSH_ARROW_END
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
