/**
 * Pure data/logic module for SSH flow animations in the two-panel diagram.
 * No Three.js or Threlte imports — testable in vitest node environment.
 *
 * Single animation type: ssh-flow
 * Particles travel linearly from the agent panel to the server panel.
 */

export type AnimationType = 'ssh-flow';

export const SSH_ARROW_START: [number, number, number] = [-1.5, 0.3, 0];
export const SSH_ARROW_END: [number, number, number] = [1.5, 0.3, 0];
export const SSH_PARTICLE_COUNT = 6;

/**
 * Determines which animation type corresponds to the active node.
 * Only the 'ssh' connection element triggers the ssh-flow animation.
 */
export function getAnimationType(activeNodeId: string): AnimationType | null {
	if (activeNodeId === 'ssh') {
		return 'ssh-flow';
	}
	return null;
}

/** Number of particles for an animation type. */
export function getParticleCount(type: AnimationType | string | null): number {
	if (type === 'ssh-flow') {
		return SSH_PARTICLE_COUNT;
	}
	return 0;
}

/**
 * Compute a particle position along the SSH arrow path.
 * Linear lerp from SSH_ARROW_START to SSH_ARROW_END.
 *
 * t is the particle's position along the path (0=start, 1=end).
 * particleIdx offsets the starting t so particles are spread along the path:
 * each particle is shifted by (particleIdx / SSH_PARTICLE_COUNT) of the total path length,
 * wrapping back to the start. particleIdx=0 lerps directly so t=0 → start and t=1 → end.
 */
export function getSSHParticlePosition(
	particleIdx: number,
	t: number
): [number, number, number] {
	const pathLength = SSH_ARROW_END[0] - SSH_ARROW_START[0]; // x-axis travel distance

	// particleIdx=0 uses t directly; others wrap via modulo so they are spread along the path
	const effectiveT = particleIdx === 0 ? t : (t + particleIdx / SSH_PARTICLE_COUNT) % 1;

	const x = SSH_ARROW_START[0] + effectiveT * pathLength;
	const y = SSH_ARROW_START[1] + effectiveT * (SSH_ARROW_END[1] - SSH_ARROW_START[1]);
	const z = SSH_ARROW_START[2] + effectiveT * (SSH_ARROW_END[2] - SSH_ARROW_START[2]);

	return [x, y, z];
}
