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

// ── Camera configuration ──────────────────────────────────────────

export interface CameraConfig {
	position: [number, number, number];
	lookAt: [number, number, number];
	fov: number;
}

export const DEFAULT_CAMERA: CameraConfig = {
	position: [0, 0, 10],
	lookAt: [0, 0, 0],
	fov: 60
};

export const STEP2_CAMERA: CameraConfig = {
	position: [3.0, -0.1, 5.4],
	lookAt: [3.0, -0.1, 0],
	fov: 46
};

export function getCameraConfig(stepIndex: number): CameraConfig {
	if (stepIndex === 2) return STEP2_CAMERA;
	return DEFAULT_CAMERA;
}

// ── Substep highlight animation ───────────────────────────────────

export const SUBSTEP_CYCLE_DURATION = 4.0;
export const SUBSTEP_COUNT = 3;

export function getSubstepGlow(substepIndex: number, time: number): number {
	const phase = (time % SUBSTEP_CYCLE_DURATION) / SUBSTEP_CYCLE_DURATION;
	const substepPhase = phase * SUBSTEP_COUNT;
	const current = Math.floor(substepPhase);
	if (current !== substepIndex) return 0;
	const local = substepPhase - current;
	return Math.sin(local * Math.PI);
}
