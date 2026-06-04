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
