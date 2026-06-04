<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { onDestroy, untrack } from 'svelte';
	import { QuadraticBezierCurve3, Vector3, TubeGeometry, Quaternion, Euler } from 'three';

	let {
		from,
		to,
		controlPoint,
		isActive
	}: {
		from: [number, number, number];
		to: [number, number, number];
		controlPoint: [number, number, number];
		isActive: boolean;
	} = $props();

	const COLOR_ACTIVE = '#C9A227';
	const COLOR_INACTIVE = '#CFCBC0';

	const CONE_HEIGHT = 0.14;
	const MAIN_TUBE_RADIUS = 0.025;
	const GLOW_TUBE_RADIUS = 0.07;

	// ── Spring-driven animated values ──────────────────────────────────
	let targetGlowOpacity = $derived(isActive ? 0.22 : 0);
	let targetEmissiveIntensity = $derived(isActive ? 0.8 : 0);
	let targetColorMix = $derived(isActive ? 1.0 : 0.0);

	let currentGlowOpacity = $state(0);
	let currentEmissiveIntensity = $state(0);
	let currentColorMix = $state(0);

	const SPRING = 8;

	useTask((delta) => {
		const dt = Math.min(delta, 0.1);
		currentGlowOpacity += (targetGlowOpacity - currentGlowOpacity) * SPRING * dt;
		currentEmissiveIntensity += (targetEmissiveIntensity - currentEmissiveIntensity) * SPRING * dt;
		currentColorMix += (targetColorMix - currentColorMix) * SPRING * dt;
	});

	let currentColor = $derived(
		currentColorMix > 0.99
			? COLOR_ACTIVE
			: currentColorMix < 0.01
				? COLOR_INACTIVE
				: lerpHexColor(COLOR_INACTIVE, COLOR_ACTIVE, currentColorMix)
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
	 * untrack() tells Svelte we intentionally read props outside reactive context
	 * (positions are immutable after mount — they come from static NODES data).
	 */
	const { tubeGeo, glowGeo, conePos, coneRot } = untrack(() => {
		const curve = new QuadraticBezierCurve3(
			new Vector3(...from),
			new Vector3(...controlPoint),
			new Vector3(...to)
		);

		const geo = new TubeGeometry(curve, 48, MAIN_TUBE_RADIUS, 8, false);
		const glow = new TubeGeometry(curve, 48, GLOW_TUBE_RADIUS, 8, false);

		const endPt = curve.getPoint(1);
		const tang = curve.getTangent(0.92).normalize();
		const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), tang);
		const euler = new Euler().setFromQuaternion(quat);

		const pos: [number, number, number] = [
			endPt.x - tang.x * CONE_HEIGHT * 0.5,
			endPt.y - tang.y * CONE_HEIGHT * 0.5,
			endPt.z - tang.z * CONE_HEIGHT * 0.5
		];
		const rot: [number, number, number] = [euler.x, euler.y, euler.z];

		return { tubeGeo: geo, glowGeo: glow, conePos: pos, coneRot: rot };
	});

	onDestroy(() => {
		tubeGeo.dispose();
		glowGeo.dispose();
	});
</script>

<!-- Glow tube: wider, semi-transparent, only visible when active -->
<T.Mesh geometry={glowGeo}>
	<T.MeshBasicMaterial
		color="#C9A227"
		transparent
		opacity={currentGlowOpacity}
		depthWrite={false}
	/>
</T.Mesh>

<!-- Main arc tube -->
<T.Mesh geometry={tubeGeo}>
	<T.MeshStandardMaterial
		color={currentColor}
		emissive={currentEmissiveIntensity > 0.01 ? '#C9A227' : '#000000'}
		emissiveIntensity={currentEmissiveIntensity}
		roughness={isActive ? 0.25 : 0.4}
		metalness={isActive ? 0.2 : 0.1}
	/>
</T.Mesh>

<!-- Arrowhead cone -->
<T.Mesh position={conePos} rotation={coneRot}>
	<T.ConeGeometry args={[0.055, CONE_HEIGHT, 8]} />
	<T.MeshStandardMaterial
		color={currentColor}
		emissive={currentEmissiveIntensity > 0.01 ? '#C9A227' : '#000000'}
		emissiveIntensity={currentEmissiveIntensity}
		roughness={isActive ? 0.25 : 0.4}
		metalness={isActive ? 0.2 : 0.1}
	/>
</T.Mesh>
