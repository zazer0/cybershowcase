<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { HTML } from '@threlte/extras';
	import { onDestroy, untrack } from 'svelte';
	import { QuadraticBezierCurve3, Vector3, TubeGeometry } from 'three';

	let {
		fromPosition,
		toPosition,
		isActive,
		showReturnPath
	}: {
		fromPosition: [number, number, number];
		toPosition: [number, number, number];
		isActive: boolean;
		showReturnPath: boolean;
	} = $props();

	const COLOR_ACTIVE = '#C9A227';
	const COLOR_INACTIVE = '#CFCBC0';

	const FORWARD_TUBE_RADIUS = 0.02;
	const RETURN_TUBE_RADIUS = 0.01;
	const PARTICLE_RADIUS = 0.04;
	const PARTICLE_COUNT = 4;
	const TRAVEL_DURATION = 2; // seconds for one full traversal
	const SPRING = 8;

	// ── Spring-driven animated values ──────────────────────────────────
	let targetForwardColorMix = $derived(isActive ? 1.0 : 0.0);
	let targetForwardEmissive = $derived(isActive ? 0.6 : 0);
	let targetParticleOpacity = $derived(isActive ? 0.9 : 0);
	let targetReturnOpacity = $derived(showReturnPath ? 0.25 : 0);

	let currentForwardColorMix = $state(0);
	let currentForwardEmissive = $state(0);
	let currentParticleOpacity = $state(0);
	let currentReturnOpacity = $state(0);

	// Particle progress along curve (0..1 for each particle)
	let particleTs: number[] = $state(
		Array.from({ length: PARTICLE_COUNT }, (_, i) => i / PARTICLE_COUNT)
	);

	// Particle world positions derived from curve sampling
	let particlePositions: [number, number, number][] = $state(
		Array.from({ length: PARTICLE_COUNT }, () => [0, 0, 0] as [number, number, number])
	);

	useTask((delta) => {
		const dt = Math.min(delta, 0.1);

		// Spring interpolation
		currentForwardColorMix += (targetForwardColorMix - currentForwardColorMix) * SPRING * dt;
		currentForwardEmissive += (targetForwardEmissive - currentForwardEmissive) * SPRING * dt;
		currentParticleOpacity += (targetParticleOpacity - currentParticleOpacity) * SPRING * dt;
		currentReturnOpacity += (targetReturnOpacity - currentReturnOpacity) * SPRING * dt;

		// Animate particles along the forward curve when active
		if (isActive) {
			for (let i = 0; i < PARTICLE_COUNT; i++) {
				particleTs[i] = (particleTs[i] + dt / TRAVEL_DURATION) % 1;
				const pt = forwardCurve.getPoint(particleTs[i]);
				particlePositions[i] = [pt.x, pt.y, pt.z];
			}
		}
	});

	let currentForwardColor = $derived(
		currentForwardColorMix > 0.99
			? COLOR_ACTIVE
			: currentForwardColorMix < 0.01
				? COLOR_INACTIVE
				: lerpHexColor(COLOR_INACTIVE, COLOR_ACTIVE, currentForwardColorMix)
	);

	/** Simple RGB lerp between two hex colors. */
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

	/**
	 * Static geometry computed once from initial prop values.
	 * untrack() tells Svelte we intentionally read props outside reactive context.
	 */
	const {
		forwardCurve,
		forwardTubeGeo,
		forwardMidpoint,
		_returnCurve,
		returnTubeGeo,
		returnMidpoint
	} = untrack(() => {
		const from = new Vector3(...fromPosition);
		const to = new Vector3(...toPosition);
		const mid = new Vector3().addVectors(from, to).multiplyScalar(0.5);

		// Forward path: slight upward arc
		const forwardControl = new Vector3(mid.x, mid.y + 0.5, mid.z);
		const fwdCurve = new QuadraticBezierCurve3(from, forwardControl, to);
		const fwdGeo = new TubeGeometry(fwdCurve, 48, FORWARD_TUBE_RADIUS, 8, false);
		const fwdMid: [number, number, number] = [forwardControl.x, forwardControl.y + 0.15, forwardControl.z];

		// Return path: lower arc, offset Y -0.3
		const returnFrom = new Vector3(to.x, to.y - 0.3, to.z);
		const returnTo = new Vector3(from.x, from.y - 0.3, from.z);
		const returnMid = new Vector3().addVectors(returnFrom, returnTo).multiplyScalar(0.5);
		const returnControl = new Vector3(returnMid.x, returnMid.y - 0.4, returnMid.z);
		const retCurve = new QuadraticBezierCurve3(returnFrom, returnControl, returnTo);
		const retGeo = new TubeGeometry(retCurve, 48, RETURN_TUBE_RADIUS, 8, false);
		const retMidPt: [number, number, number] = [returnControl.x, returnControl.y - 0.15, returnControl.z];

		// Initialize particle positions along the forward curve
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const pt = fwdCurve.getPoint(particleTs[i]);
			particlePositions[i] = [pt.x, pt.y, pt.z];
		}

		return {
			forwardCurve: fwdCurve,
			forwardTubeGeo: fwdGeo,
			forwardMidpoint: fwdMid,
			_returnCurve: retCurve,
			returnTubeGeo: retGeo,
			returnMidpoint: retMidPt
		};
	});

	onDestroy(() => {
		forwardTubeGeo.dispose();
		returnTubeGeo.dispose();
	});
</script>

<!-- ═══ Forward SSH Tunnel ═══ -->

<!-- Main forward tube -->
<T.Mesh geometry={forwardTubeGeo}>
	<T.MeshStandardMaterial
		color={currentForwardColor}
		emissive={currentForwardEmissive > 0.01 ? COLOR_ACTIVE : '#000000'}
		emissiveIntensity={currentForwardEmissive}
		roughness={isActive ? 0.25 : 0.4}
		metalness={isActive ? 0.2 : 0.1}
		transparent
		opacity={0.6}
	/>
</T.Mesh>

<!-- Animated particles along forward path -->
{#each particlePositions as pos, i (i)}
	<T.Mesh position={pos}>
		<T.SphereGeometry args={[PARTICLE_RADIUS, 16, 16]} />
		<T.MeshStandardMaterial
			color={COLOR_ACTIVE}
			emissive={COLOR_ACTIVE}
			emissiveIntensity={currentForwardEmissive}
			transparent
			opacity={currentParticleOpacity}
			depthWrite={false}
		/>
	</T.Mesh>
{/each}

<!-- SSH label at forward midpoint -->
<HTML sprite pointerEvents="none" position={forwardMidpoint}>
	<span class="ssh-label" class:active={isActive}>SSH</span>
</HTML>

<!-- ═══ Return Path ═══ -->

<!-- Return tube (subtle, lower) -->
<T.Mesh geometry={returnTubeGeo}>
	<T.MeshStandardMaterial
		color={COLOR_INACTIVE}
		transparent
		opacity={currentReturnOpacity}
		roughness={0.5}
		metalness={0.05}
		depthWrite={false}
	/>
</T.Mesh>

<!-- Return path label -->
<HTML sprite pointerEvents="none" position={returnMidpoint}>
	<span
		class="return-label"
		style:opacity={currentReturnOpacity > 0.05 ? Math.min(currentReturnOpacity * 3, 0.8) : 0}
	>
		result
	</span>
</HTML>

<style>
	.ssh-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		font-weight: 700;
		color: #cfcbc0;
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		user-select: none;
		transition: color 550ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.ssh-label.active {
		color: #c9a227;
	}

	.return-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		font-weight: 500;
		color: #cfcbc0;
		white-space: nowrap;
		letter-spacing: 0.1em;
		user-select: none;
		transition: opacity 550ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}
</style>
