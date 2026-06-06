<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import type { PerspectiveCamera } from 'three';
	import { getCameraConfig } from './animationData.js';
	import AgentCard from './AgentCard.svelte';
	import ServerCard from './ServerCard.svelte';
	import SSHArrow from './SSHArrow.svelte';

	let {
		activeNodeId,
		activeArcId,
		activeStepIndex
	}: {
		activeNodeId: string;
		activeArcId: string | null;
		activeStepIndex: number;
	} = $props();

	let cameraRef: PerspectiveCamera | undefined;
	let targetConfig = $derived(getCameraConfig(activeStepIndex));

	let camX = $state(0);
	let camY = $state(0);
	let camZ = $state(10);
	let camFov = $state(60);
	let lookX = $state(0);
	let lookY = $state(0);
	let lookZ = $state(0);

	const CAMERA_SPRING = 4;

	useTask((delta) => {
		if (!cameraRef) return;
		const dt = Math.min(delta, 0.1);
		const k = CAMERA_SPRING * dt;

		camX += (targetConfig.position[0] - camX) * k;
		camY += (targetConfig.position[1] - camY) * k;
		camZ += (targetConfig.position[2] - camZ) * k;
		camFov += (targetConfig.fov - camFov) * k;
		lookX += (targetConfig.lookAt[0] - lookX) * k;
		lookY += (targetConfig.lookAt[1] - lookY) * k;
		lookZ += (targetConfig.lookAt[2] - lookZ) * k;

		cameraRef.position.set(camX, camY, camZ);
		cameraRef.fov = camFov;
		cameraRef.updateProjectionMatrix();
		cameraRef.lookAt(lookX, lookY, lookZ);
	});
</script>

<T.PerspectiveCamera
	makeDefault
	position={[0, 0, 10]}
	fov={60}
	oncreate={(ref) => {
		cameraRef = ref;
		ref.lookAt(0, 0, 0);
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

<!-- Agent card — left panel -->
<T.Group position={[-3.0, 0, 0]}>
	<AgentCard isActive={activeNodeId === 'agent' || activeNodeId === 'orchestrator'} {activeNodeId} />
</T.Group>

<!-- SSH arrow — center connection -->
<SSHArrow isActive={activeNodeId === 'ssh' || activeArcId === 'ssh-arrow'} />

<!-- Server card — right panel -->
<T.Group position={[3.0, 0, 0]}>
	<ServerCard isActive={activeNodeId === 'server' || activeNodeId === 'result'} {activeNodeId} {activeStepIndex} />
</T.Group>
