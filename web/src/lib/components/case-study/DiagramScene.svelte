<script lang="ts">
	import { T } from '@threlte/core';
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
</script>

<!-- Camera: pulled back to z=10 for wider two-panel layout -->
<T.PerspectiveCamera
	makeDefault
	position={[0, 0, 10]}
	fov={60}
	oncreate={(ref) => ref.lookAt(0, 0, 0)}
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
