<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import {
		getOrchParticlePosition,
		getCodingParticlePosition,
		getValidatorParticlePosition,
		CODING_CENTER,
		VALIDATOR_CENTER
	} from './animationData.js';

	let { activeNodeId }: { activeNodeId: string } = $props();

	// ═══════════════════════════════════════════════════════════
	// Animation state
	// ═══════════════════════════════════════════════════════════

	/** Accumulated time for continuous animation (seconds). */
	let time = $state(0);

	/** Current opacity for each animation type (lerped toward target for smooth transitions). */
	let orchOpacity = $state(0);
	let codingOpacity = $state(0);
	let validatorOpacity = $state(0);

	/** Derived target opacities from activeNodeId. */
	let orchTarget = $derived(activeNodeId === 'orchestrate' ? 1 : 0);
	let codingTarget = $derived(activeNodeId === 'coding-agent' ? 1 : 0);
	let validatorTarget = $derived(activeNodeId === 'validator' ? 1 : 0);

	// ── Particle counts ──────────────────────────────────────
	const ORCH_COUNT = 9; // 3 paths × 3 particles
	const CODING_COUNT = 8;
	const VALIDATOR_COUNT = 8;

	// ── Speed constants ──────────────────────────────────────
	const FADE_SPEED = 6; // how fast opacity lerps to target
	const ORCH_SPEED = 0.4; // how fast orchestrate particles cycle
	const CODING_SPEED = 0.5; // how fast coding particles rise
	const VALIDATOR_SPEED = 0.45; // how fast validator particles converge

	// ═══════════════════════════════════════════════════════════
	// Frame-based animation loop
	// ═══════════════════════════════════════════════════════════

	useTask((delta) => {
		const dt = Math.min(delta, 0.1);

		// Advance global time
		time += dt;

		// Smooth opacity transitions for crossfade between steps
		orchOpacity += (orchTarget - orchOpacity) * FADE_SPEED * dt;
		codingOpacity += (codingTarget - codingOpacity) * FADE_SPEED * dt;
		validatorOpacity += (validatorTarget - validatorOpacity) * FADE_SPEED * dt;
	});

	// ═══════════════════════════════════════════════════════════
	// Helper: compute phase t for a particle given its index
	// ═══════════════════════════════════════════════════════════

	function particlePhase(count: number, idx: number, speed: number): number {
		// Each particle is offset in phase so they're spread across the cycle
		const offset = idx / count;
		return (((time * speed + offset) % 1) + 1) % 1;
	}

	/** Opacity multiplier for smooth particle appearance (fades at path ends). */
	function particleOpacity(t: number): number {
		// Sine curve: peaks at t=0.5, fades to 0 at endpoints
		return Math.sin(t * Math.PI);
	}

	// ═══════════════════════════════════════════════════════════
	// Render thresholds (skip rendering invisible meshes)
	// ═══════════════════════════════════════════════════════════

	const VISIBILITY_THRESHOLD = 0.005;
</script>

<!-- ═══════════════════════════════════════════════════════════
     ORCHESTRATE ANIMATION: Dispatch particles flowing outward
     along 3 paths (orch→coding arc, validator→orch arc, I/O down)
     ═══════════════════════════════════════════════════════════ -->

{#if orchOpacity > VISIBILITY_THRESHOLD}
	{#each { length: ORCH_COUNT } as _, i (i)}
		{@const pathIdx = i % 3}
		{@const t = particlePhase(ORCH_COUNT / 3, Math.floor(i / 3), ORCH_SPEED)}
		{@const pos = getOrchParticlePosition(pathIdx, t)}
		{@const pOpacity = orchOpacity * particleOpacity(t)}
		{#if pOpacity > 0.01}
			<T.Mesh position={pos}>
				<T.SphereGeometry args={[0.04, 8, 8]} />
				<T.MeshBasicMaterial color="#C9A227" transparent opacity={pOpacity} depthWrite={false} />
			</T.Mesh>
		{/if}
	{/each}
{/if}

<!-- ═══════════════════════════════════════════════════════════
     CODING AGENT ANIMATION: Pulsing ring + rising data-stream particles
     ═══════════════════════════════════════════════════════════ -->

{#if codingOpacity > VISIBILITY_THRESHOLD}
	<!-- Pulsing glow ring around Coding Agent node -->
	{@const ringPulse = 0.8 + 0.2 * Math.sin(time * 3.0)}
	{@const ringScale = codingOpacity * ringPulse}
	{@const ringOpacity = codingOpacity * 0.25}
	<T.Mesh position={CODING_CENTER} rotation={[Math.PI / 2, 0, 0]} scale={ringScale}>
		<T.TorusGeometry args={[0.5, 0.02, 16, 32]} />
		<T.MeshBasicMaterial color="#C9A227" transparent opacity={ringOpacity} depthWrite={false} />
	</T.Mesh>

	<!-- Rising data-stream particles -->
	{#each { length: CODING_COUNT } as _, i (i)}
		{@const t = particlePhase(CODING_COUNT, i, CODING_SPEED)}
		{@const pos = getCodingParticlePosition(i, t, time)}
		{@const pOpacity = codingOpacity * particleOpacity(t)}
		{#if pOpacity > 0.01}
			<T.Mesh position={pos}>
				<T.SphereGeometry args={[0.03, 8, 8]} />
				<T.MeshBasicMaterial color="#C9A227" transparent opacity={pOpacity} depthWrite={false} />
			</T.Mesh>
		{/if}
	{/each}
{/if}

<!-- ═══════════════════════════════════════════════════════════
     VALIDATOR ANIMATION: Scanning ring + converging particles
     ═══════════════════════════════════════════════════════════ -->

{#if validatorOpacity > VISIBILITY_THRESHOLD}
	<!-- Scanning ring: tilted torus rotating around Validator node -->
	{@const scanRotation = time * 1.5}
	{@const scanOpacity = validatorOpacity * 0.35}
	<T.Mesh position={VALIDATOR_CENTER} rotation={[scanRotation, Math.PI / 3, 0]}>
		<T.TorusGeometry args={[0.55, 0.015, 16, 48]} />
		<T.MeshBasicMaterial color="#C9A227" transparent opacity={scanOpacity} depthWrite={false} />
	</T.Mesh>

	<!-- Converging particles spiraling inward toward Validator -->
	{#each { length: VALIDATOR_COUNT } as _, i (i)}
		{@const t = particlePhase(VALIDATOR_COUNT, i, VALIDATOR_SPEED)}
		{@const pos = getValidatorParticlePosition(i, t, time)}
		<!-- Particles get brighter as they converge (opacity increases as t→1) -->
		{@const pOpacity = validatorOpacity * (0.3 + 0.7 * (1 - t))}
		{#if pOpacity > 0.01}
			<T.Mesh position={pos}>
				<T.SphereGeometry args={[0.03, 8, 8]} />
				<T.MeshBasicMaterial color="#C9A227" transparent opacity={pOpacity} depthWrite={false} />
			</T.Mesh>
		{/if}
	{/each}
{/if}
