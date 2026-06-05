<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { HTML } from '@threlte/extras';
	import { onDestroy } from 'svelte';
	import { BoxGeometry, SphereGeometry, ConeGeometry } from 'three';
	import { getSSHParticlePosition, SSH_PARTICLE_COUNT } from './animationData.js';

	let { isActive }: { isActive: boolean } = $props();

	// ── Constants ──────────────────────────────────────────────────────────
	const COLOR_ACTIVE = '#c9a227';
	const COLOR_INACTIVE = '#cfcbc0';

	const ARROW_START_X = -1.5;
	const ARROW_END_X = 1.5;
	const ARROW_Y = 0.3;

	const DASH_COUNT = 4;
	const DASH_WIDTH = 0.35;
	const DASH_GAP = (ARROW_END_X - ARROW_START_X - DASH_COUNT * DASH_WIDTH) / (DASH_COUNT - 1);

	const PARTICLE_SPEED = 0.5;
	const SPRING = 8;

	// Dash x-center positions
	const dashPositions: number[] = Array.from(
		{ length: DASH_COUNT },
		(_, i) => ARROW_START_X + i * (DASH_WIDTH + DASH_GAP) + DASH_WIDTH / 2
	);

	// ── Geometry (created once, shared/disposed) ────────────────────────
	const dashGeo = new BoxGeometry(DASH_WIDTH, 0.06, 0.06);
	const dotGeo = new SphereGeometry(0.08, 12, 8);
	const coneGeo = new ConeGeometry(0.1, 0.25, 8);
	const particleGeo = new SphereGeometry(0.05, 8, 6);

	onDestroy(() => {
		dashGeo.dispose();
		dotGeo.dispose();
		coneGeo.dispose();
		particleGeo.dispose();
	});

	// ── Spring animation ────────────────────────────────────────────────
	let currentColorMix = $state(0);
	let targetColorMix = $derived(isActive ? 1.0 : 0.0);

	// Particle positions updated in useTask
	let particlePositions = $state<[number, number, number][]>(
		Array.from({ length: SSH_PARTICLE_COUNT }, () => [0, ARROW_Y, 0])
	);
	let particleOpacities = $state<number[]>(Array.from({ length: SSH_PARTICLE_COUNT }, () => 0));

	let time = 0;

	useTask((delta) => {
		const dt = Math.min(delta, 0.1);
		currentColorMix += (targetColorMix - currentColorMix) * SPRING * dt;

		if (isActive || currentColorMix > 0.005) {
			time += dt;

			const newPositions: [number, number, number][] = [];
			const newOpacities: number[] = [];

			for (let i = 0; i < SSH_PARTICLE_COUNT; i++) {
				const t = ((time * PARTICLE_SPEED + i / SSH_PARTICLE_COUNT) % 1 + 1) % 1;
				newPositions.push(getSSHParticlePosition(i, t));
				newOpacities.push(currentColorMix * Math.sin(t * Math.PI));
			}

			particlePositions = newPositions;
			particleOpacities = newOpacities;
		}
	});

	// ── Color helpers ────────────────────────────────────────────────────
	function lerpHexColor(a: string, b: string, t: number): string {
		const ar = parseInt(a.slice(1, 3), 16);
		const ag = parseInt(a.slice(3, 5), 16);
		const ab = parseInt(a.slice(5, 7), 16);
		const br = parseInt(b.slice(1, 3), 16);
		const bg = parseInt(b.slice(3, 5), 16);
		const bb = parseInt(b.slice(5, 7), 16);
		const r = Math.round(ar + (br - ar) * t);
		const g = Math.round(ag + (bg - ag) * t);
		const bv = Math.round(ab + (bb - ab) * t);
		return (
			'#' +
			r.toString(16).padStart(2, '0') +
			g.toString(16).padStart(2, '0') +
			bv.toString(16).padStart(2, '0')
		);
	}

	let currentColor = $derived(
		currentColorMix > 0.99
			? COLOR_ACTIVE
			: currentColorMix < 0.01
				? COLOR_INACTIVE
				: lerpHexColor(COLOR_INACTIVE, COLOR_ACTIVE, currentColorMix)
	);
</script>

<!-- Dashes -->
{#each dashPositions as x}
	<T.Mesh geometry={dashGeo} position={[x, ARROW_Y, 0]}>
		<T.MeshStandardMaterial color={currentColor} roughness={0.4} metalness={0.1} />
	</T.Mesh>
{/each}

<!-- Dot at start -->
<T.Mesh geometry={dotGeo} position={[ARROW_START_X, ARROW_Y, 0]}>
	<T.MeshStandardMaterial color={currentColor} roughness={0.4} metalness={0.1} />
</T.Mesh>

<!-- Arrowhead at end — ConeGeometry points up (+y) by default, rotate -90° around z to point right (+x) -->
<T.Mesh geometry={coneGeo} position={[ARROW_END_X, ARROW_Y, 0]} rotation={[0, 0, -Math.PI / 2]}>
	<T.MeshStandardMaterial color={currentColor} roughness={0.4} metalness={0.1} />
</T.Mesh>

<!-- Flow particles -->
{#if isActive || currentColorMix > 0.005}
	{#each particlePositions as pos, i}
		<T.Mesh geometry={particleGeo} position={pos}>
			<T.MeshStandardMaterial
				color={COLOR_ACTIVE}
				transparent
				opacity={particleOpacities[i]}
				roughness={0.2}
				metalness={0.3}
			/>
		</T.Mesh>
	{/each}
{/if}

<!-- SSH label -->
<HTML pointerEvents="none" center position={[0, 0.65, 0]}>
	<span
		style="
			font-family: 'JetBrains Mono', monospace;
			font-size: 10px;
			text-transform: uppercase;
			letter-spacing: 0.12em;
			color: {isActive ? COLOR_ACTIVE : COLOR_INACTIVE};
			transition: color 0.3s ease;
			white-space: nowrap;
			pointer-events: none;
			user-select: none;
		"
	>
		SSH
	</span>
</HTML>

<!-- Result label -->
<HTML pointerEvents="none" center position={[0, -0.2, 0]}>
	<span
		style="
			font-family: 'JetBrains Mono', monospace;
			font-size: 8px;
			text-transform: uppercase;
			letter-spacing: 0.12em;
			color: {COLOR_INACTIVE};
			opacity: {isActive ? 0.5 : 0.3};
			transition: opacity 0.4s ease;
			white-space: nowrap;
			pointer-events: none;
			user-select: none;
		"
	>
		result
	</span>
</HTML>
