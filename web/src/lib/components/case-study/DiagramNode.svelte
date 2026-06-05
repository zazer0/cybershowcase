<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { HTML, Float } from '@threlte/extras';

	let {
		id = '',
		label,
		position,
		isActive,
		isIO = false
	}: {
		id?: string;
		label: string;
		position: [number, number, number];
		isActive: boolean;
		isIO?: boolean;
	} = $props();

	const COLOR_ACTIVE = '#C9A227';
	const COLOR_INACTIVE = '#CFCBC0';

	/** IO nodes are smaller (derived — isIO is constant per instance but Svelte doesn't know) */
	let radius = $derived(isIO ? 0.22 : 0.32);
	let glowRadius = $derived(isIO ? 0.4 : 0.55);
	let labelY = $derived(isIO ? 0.5 : 0.65);

	// ── Spring-driven animated values (~550ms convergence) ──────────────
	let targetScale = $derived(isActive ? 1.25 : 1.0);
	let targetEmissiveIntensity = $derived(isActive ? 0.7 : 0);
	let targetGlowOpacity = $derived(isActive ? 0.18 : 0);

	let currentScale = $state(1.0);
	let currentEmissiveIntensity = $state(0);
	let currentGlowOpacity = $state(0);

	const SPRING = 8;

	useTask((delta) => {
		const dt = Math.min(delta, 0.1);
		currentScale += (targetScale - currentScale) * SPRING * dt;
		currentEmissiveIntensity += (targetEmissiveIntensity - currentEmissiveIntensity) * SPRING * dt;
		currentGlowOpacity += (targetGlowOpacity - currentGlowOpacity) * SPRING * dt;
	});
</script>

<Float floatIntensity={1.2} speed={0.7} rotationIntensity={0.2}>
	<T.Group {position}>
		<!-- Glow aura: larger semi-transparent cube behind the main node -->
		<T.Mesh scale={currentScale}>
			<T.BoxGeometry args={[glowRadius * 2, glowRadius * 2, glowRadius * 2]} />
			<T.MeshBasicMaterial
				color="#C9A227"
				transparent
				opacity={currentGlowOpacity}
				depthWrite={false}
			/>
		</T.Mesh>

		<!-- Main node cube with physical material -->
		<T.Mesh scale={currentScale}>
			<T.BoxGeometry args={[radius * 2, radius * 2, radius * 2]} />
			<T.MeshPhysicalMaterial
				color={isActive ? COLOR_ACTIVE : COLOR_INACTIVE}
				emissive={isActive ? COLOR_ACTIVE : '#000000'}
				emissiveIntensity={currentEmissiveIntensity}
				roughness={isActive ? 0.2 : 0.45}
				metalness={isActive ? 0.3 : 0.12}
				clearcoat={0.15}
				clearcoatRoughness={0.5}
			/>
		</T.Mesh>

		<!-- HTML label billboard above cube -->
		<HTML sprite pointerEvents="none" position={[0, labelY, 0]}>
			<span class="node-label" class:active={isActive} data-node-id={id}>{label}</span>
		</HTML>
	</T.Group>
</Float>

<style>
	.node-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
		font-weight: 700;
		color: #cfcbc0;
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-align: center;
		display: block;
		user-select: none;
		transition: color 550ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.node-label.active {
		color: #1a1a1a;
	}
</style>
