<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import CyberClawEntity from './CyberClawEntity.svelte';
	import DevVMEntity from './DevVMEntity.svelte';
	import SSHConnection from './SSHConnection.svelte';
	import { CYBERCLAW_ENTITY, DEVVM_ENTITY, CAMERA_FULL, CAMERA_ZOOM_VM } from './diagramData.js';
	import type { PerspectiveCamera } from 'three';

	let {
		activeNodeId,
		activeArcId,
		activeEntityId = 'cyberclaw' as 'cyberclaw' | 'devvm' | 'both',
		activeRegionId = null as string | null
	}: {
		activeNodeId: string;
		activeArcId: string | null;
		activeEntityId?: 'cyberclaw' | 'devvm' | 'both';
		activeRegionId?: string | null;
	} = $props();

	// ── Camera interpolation ──────────────────────────────────────────
	// Determine target camera based on which entity is focused
	let isZoomedIntoVM = $derived(activeEntityId === 'devvm' && activeRegionId === 'automate-loop');

	let targetCamPos = $derived(isZoomedIntoVM ? CAMERA_ZOOM_VM.position : CAMERA_FULL.position);
	let targetLookAt = $derived(isZoomedIntoVM ? CAMERA_ZOOM_VM.lookAt : CAMERA_FULL.lookAt);

	// Spring-animated camera position
	let camPos: [number, number, number] = $state([...CAMERA_FULL.position]);
	let lookAtPos: [number, number, number] = $state([...CAMERA_FULL.lookAt]);

	const SPRING = 8;

	let cameraRef: PerspectiveCamera | undefined = $state();

	// ── Validator converging particles (Step 3) ──────────────────────
	const VALIDATOR_PARTICLE_COUNT = 6;
	const VALIDATOR_CENTER: [number, number, number] = [1.8, -0.7, 0.16];
	const SPIRAL_RADIUS = 0.8;
	const SPIRAL_DURATION = 2.5; // seconds per full spiral cycle

	let validatorTime = $state(0);
	let validatorParticleOpacity = $state(0);
	let targetValidatorOpacity = $derived(activeRegionId === 'validator' ? 0.85 : 0);

	// Compute particle positions from validatorTime
	let validatorParticles: [number, number, number][] = $state(
		Array.from({ length: VALIDATOR_PARTICLE_COUNT }, () => [0, 0, 0] as [number, number, number])
	);

	// Reset validator time when leaving validator step
	$effect(() => {
		if (activeRegionId !== 'validator') {
			validatorTime = 0;
		}
	});

	useTask((delta) => {
		const dt = Math.min(delta, 0.1);
		for (let i = 0; i < 3; i++) {
			camPos[i] += (targetCamPos[i] - camPos[i]) * SPRING * dt;
			lookAtPos[i] += (targetLookAt[i] - lookAtPos[i]) * SPRING * dt;
		}
		if (cameraRef) {
			cameraRef.position.set(camPos[0], camPos[1], camPos[2]);
			cameraRef.lookAt(lookAtPos[0], lookAtPos[1], lookAtPos[2]);
		}

		// Spring-animate validator particle opacity
		validatorParticleOpacity += (targetValidatorOpacity - validatorParticleOpacity) * SPRING * dt;

		// Animate validator particles when active
		if (activeRegionId === 'validator') {
			validatorTime += dt;
			for (let i = 0; i < VALIDATOR_PARTICLE_COUNT; i++) {
				const phase = (i / VALIDATOR_PARTICLE_COUNT) * Math.PI * 2;
				const t = ((validatorTime / SPIRAL_DURATION) + i / VALIDATOR_PARTICLE_COUNT) % 1;
				// Spiral inward: radius shrinks from SPIRAL_RADIUS to 0 as t goes 0→1
				const r = SPIRAL_RADIUS * (1 - t);
				const angle = phase + t * Math.PI * 4; // 2 full rotations per cycle
				validatorParticles[i] = [
					VALIDATOR_CENTER[0] + r * Math.cos(angle),
					VALIDATOR_CENTER[1] + r * Math.sin(angle),
					VALIDATOR_CENTER[2]
				];
			}
		}
	});
</script>

<!-- Camera: spring-animated between full view and zoomed VM view -->
<T.PerspectiveCamera
	makeDefault
	position={camPos}
	fov={60}
	oncreate={(ref) => {
		cameraRef = ref;
		ref.lookAt(...CAMERA_FULL.lookAt);
	}}
/>

<!--
	Layered lighting for depth and material definition:
	- HemisphereLight: sky/ground gradient for ambient color temperature
	- AmbientLight: base fill to prevent pure-black shadowed areas
	- DirectionalLight (key): main light from upper-right-front
	- DirectionalLight (rim): back-left fill for edge definition
-->
<T.HemisphereLight intensity={0.35} color="#ffffff" groundColor="#444466" />
<T.AmbientLight intensity={0.35} />
<T.DirectionalLight position={[5, 10, 5]} intensity={0.8} />
<T.DirectionalLight position={[-4, -1, -3]} intensity={0.25} />

<!-- CyberClaw agent entity -->
<CyberClawEntity
	entity={CYBERCLAW_ENTITY}
	isActive={activeEntityId === 'cyberclaw' || activeEntityId === 'both'}
	{activeRegionId}
/>

<!-- Dev VM server entity -->
<DevVMEntity
	entity={DEVVM_ENTITY}
	isActive={activeEntityId === 'devvm' || activeEntityId === 'both'}
	{activeRegionId}
	isZoomed={isZoomedIntoVM}
/>

<!-- SSH connection between entities -->
<SSHConnection
	fromPosition={[CYBERCLAW_ENTITY.position[0] + CYBERCLAW_ENTITY.size[0] / 2, CYBERCLAW_ENTITY.position[1], CYBERCLAW_ENTITY.position[2]]}
	toPosition={[DEVVM_ENTITY.position[0] - DEVVM_ENTITY.size[0] / 2, DEVVM_ENTITY.position[1], DEVVM_ENTITY.position[2]]}
	isActive={activeEntityId === 'cyberclaw' || activeEntityId === 'both'}
	showReturnPath={activeRegionId === 'validator' || activeRegionId === 'success-badge'}
/>

<!-- Validator converging particles (Step 3) -->
{#each validatorParticles as pos, i (i)}
	<T.Mesh position={pos}>
		<T.SphereGeometry args={[0.03, 12, 12]} />
		<T.MeshStandardMaterial
			color="#C9A227"
			emissive="#C9A227"
			emissiveIntensity={0.8}
			transparent
			opacity={validatorParticleOpacity}
			depthWrite={false}
		/>
	</T.Mesh>
{/each}
