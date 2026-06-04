<script lang="ts">
	import { T } from '@threlte/core';
	import DiagramNode from './DiagramNode.svelte';
	import DiagramArc from './DiagramArc.svelte';
	import StepAnimations from './StepAnimations.svelte';
	import { NODES, ARCS, getNodePosition } from './diagramData.js';

	let {
		activeNodeId,
		activeArcId
	}: {
		activeNodeId: string;
		activeArcId: string | null;
	} = $props();
</script>

<!-- Camera: pulled back to z=7 and fov=60 so all 5 nodes + labels fit -->
<T.PerspectiveCamera
	makeDefault
	position={[0, 0.5, 7]}
	fov={60}
	oncreate={(ref) => ref.lookAt(0, 0, 0)}
/>

<!--
	Layered lighting for depth and material definition:
	- HemisphereLight: sky/ground gradient for ambient color temperature
	- AmbientLight: base fill to prevent pure-black shadowed areas
	- DirectionalLight (key): main light from upper-right-front
	- DirectionalLight (rim): back-left fill for edge definition on spheres
-->
<T.HemisphereLight intensity={0.35} color="#ffffff" groundColor="#444466" />
<T.AmbientLight intensity={0.35} />
<T.DirectionalLight position={[5, 10, 5]} intensity={0.8} />
<T.DirectionalLight position={[-4, -1, -3]} intensity={0.25} />

<!-- 5 system nodes -->
{#each NODES as node (node.id)}
	<DiagramNode
		id={node.id}
		label={node.label}
		position={node.position}
		isActive={activeNodeId === node.id}
		isIO={node.isIO}
	/>
{/each}

<!-- 3 cycle arcs -->
{#each ARCS as arc (arc.id)}
	<DiagramArc
		from={getNodePosition(arc.fromId)}
		to={getNodePosition(arc.toId)}
		controlPoint={arc.controlPoint}
		isActive={activeArcId === arc.id}
	/>
{/each}

<!-- I/O connector: Trigger (0, 2.2, 0) → Orchestrate (0, 1.0, 0) -->
<T.Mesh position={[0, 1.65, 0]}>
	<T.CylinderGeometry args={[0.015, 0.015, 0.9, 6]} />
	<T.MeshStandardMaterial
		color={activeNodeId === 'trigger' || activeNodeId === 'orchestrate' ? '#C9A227' : '#CFCBC0'}
		roughness={0.3}
		metalness={0.15}
	/>
</T.Mesh>

<!-- Scroll-synced step animations (packets, data stream, scanning ring) -->
<StepAnimations {activeNodeId} />

<!-- I/O connector: bottom of cycle (0, -0.8, 0) → Resolution (0, -2.2, 0) -->
<T.Mesh position={[0, -1.55, 0]}>
	<T.CylinderGeometry args={[0.015, 0.015, 1.0, 6]} />
	<T.MeshStandardMaterial
		color={activeNodeId === 'resolution' ? '#C9A227' : '#CFCBC0'}
		roughness={0.3}
		metalness={0.15}
	/>
</T.Mesh>
