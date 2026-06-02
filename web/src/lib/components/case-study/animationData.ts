/**
 * Pure data/logic module for scroll-synced step animations.
 * No Three.js or Threlte imports — testable in vitest node environment.
 *
 * Three distinct animations for the 3 cycle steps:
 * - Orchestrate: dispatch particles flowing outward along arcs
 * - Coding Agent: rising data-stream particles + pulsing ring
 * - Validator: converging particles + scanning ring
 */

export type AnimationType = 'orchestrate' | 'coding' | 'validator';

export interface ParticlePosition {
	pos: [number, number, number];
	opacity: number;
}

export interface OrchPath {
	from: [number, number, number];
	to: [number, number, number];
	controlPoint?: [number, number, number];
}

/**
 * Determines which animation type corresponds to the active node.
 * Returns null for non-cycle nodes (trigger, resolution).
 */
export function getAnimationType(activeNodeId: string): AnimationType | null {
	switch (activeNodeId) {
		case 'orchestrate':
			return 'orchestrate';
		case 'coding-agent':
			return 'coding';
		case 'validator':
			return 'validator';
		default:
			return null;
	}
}

/** Number of particles per animation type. */
export function getParticleCount(type: AnimationType | string | null): number {
	switch (type) {
		case 'orchestrate':
			return 9; // 3 paths × 3 particles
		case 'coding':
			return 8;
		case 'validator':
			return 8;
		default:
			return 0;
	}
}

// ═══════════════════════════════════════════════════════════
// Orchestrate: dispatch paths
// ═══════════════════════════════════════════════════════════

export const ORCH_PATHS: OrchPath[] = [
	{
		from: [0, 1, 0],
		to: [1.3, -0.8, 0],
		controlPoint: [2.4, 0.6, 0]
	},
	{
		from: [-1.5, -0.8, 0],
		to: [0, 1, 0],
		controlPoint: [-2.4, 0.6, 0]
	},
	{
		from: [0, 1, 0],
		to: [0, -2.2, 0]
		// linear — no control point
	}
];

/**
 * Compute a particle position along an orchestrate dispatch path.
 * @param pathIdx - which path (0-2)
 * @param t - progress along the path (0-1)
 */
export function getOrchParticlePosition(pathIdx: number, t: number): [number, number, number] {
	const safeIdx = ((pathIdx % ORCH_PATHS.length) + ORCH_PATHS.length) % ORCH_PATHS.length;
	const path = ORCH_PATHS[safeIdx];
	const tClamped = Math.max(0, Math.min(1, t));

	if (path.controlPoint) {
		// Quadratic bezier: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
		const u = 1 - tClamped;
		const x =
			u * u * path.from[0] +
			2 * u * tClamped * path.controlPoint[0] +
			tClamped * tClamped * path.to[0];
		const y =
			u * u * path.from[1] +
			2 * u * tClamped * path.controlPoint[1] +
			tClamped * tClamped * path.to[1];
		const z =
			u * u * path.from[2] +
			2 * u * tClamped * path.controlPoint[2] +
			tClamped * tClamped * path.to[2];
		return [x, y, z];
	}

	// Linear interpolation
	const x = path.from[0] + tClamped * (path.to[0] - path.from[0]);
	const y = path.from[1] + tClamped * (path.to[1] - path.from[1]);
	const z = path.from[2] + tClamped * (path.to[2] - path.from[2]);
	return [x, y, z];
}

// ═══════════════════════════════════════════════════════════
// Coding Agent: data-stream particles
// ═══════════════════════════════════════════════════════════

export const CODING_CENTER: [number, number, number] = [1.3, -0.8, 0];

/**
 * Compute a particle position for the coding-agent data-stream animation.
 * Particles rise upward from the coding-agent node with subtle horizontal oscillation.
 *
 * @param particleIdx - which particle (0 to count-1)
 * @param t - progress (0-1), 0 = bottom, 1 = top of rise
 * @param time - global time accumulator for oscillation
 */
export function getCodingParticlePosition(
	particleIdx: number,
	t: number,
	time: number
): [number, number, number] {
	const tClamped = Math.max(0, Math.min(1, t));
	const [cx, cy, cz] = CODING_CENTER;

	// Spread particles in a loose column around the center
	const angleOffset = particleIdx * 1.2;
	const spreadRadius = 0.3;
	const baseX = cx + Math.cos(angleOffset) * spreadRadius * 0.5;
	const baseZ = cz + Math.sin(angleOffset) * spreadRadius * 0.3;

	// Vertical rise: from node Y up by 1.8 units
	const y = cy + tClamped * 1.8;

	// Subtle horizontal oscillation for "data stream" effect
	const oscX = Math.sin(tClamped * 5 + particleIdx + time * 0.5) * 0.1;
	const oscZ = Math.cos(tClamped * 5 + particleIdx + time * 0.5) * 0.1;

	return [baseX + oscX, y, baseZ + oscZ];
}

// ═══════════════════════════════════════════════════════════
// Validator: converging scanning particles
// ═══════════════════════════════════════════════════════════

export const VALIDATOR_CENTER: [number, number, number] = [-1.5, -0.8, 0];

/**
 * Compute a particle position for the validator converging animation.
 * Particles spiral inward toward the validator node.
 *
 * @param particleIdx - which particle (0 to count-1)
 * @param t - progress (0-1), 0 = far outer ring, 1 = converged at center
 * @param time - global time accumulator for rotation
 */
export function getValidatorParticlePosition(
	particleIdx: number,
	t: number,
	time: number
): [number, number, number] {
	const tClamped = Math.max(0, Math.min(1, t));
	const [cx, cy, cz] = VALIDATOR_CENTER;

	// Each particle starts at a different angle, rotating inward
	const baseAngle = particleIdx * (Math.PI * 0.25);
	const spiralAngle = baseAngle + tClamped * Math.PI * 2 + time * 0.8;

	// Radius shrinks as t increases (convergence)
	const maxRadius = 1.2;
	const radius = (1 - tClamped) * maxRadius;

	const x = cx + Math.cos(spiralAngle) * radius;
	const y = cy + Math.sin(spiralAngle) * radius * 0.6;
	const z = cz + Math.sin(spiralAngle * 0.7) * 0.3;

	return [x, y, z];
}
