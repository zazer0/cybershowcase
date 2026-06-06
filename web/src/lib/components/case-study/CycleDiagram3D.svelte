<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { WebGLRenderer } from 'three';
	import DiagramScene from './DiagramScene.svelte';
	import { MCPBridgeComponent } from 'threlte-mcp/client';

	let {
		activeNodeId,
		activeArcId
	}: {
		activeNodeId: string;
		activeArcId: string | null;
	} = $props();

	/**
	 * Custom renderer factory with alpha: true for transparent canvas background.
	 * Called client-side only (Canvas handles SSR guard).
	 */
	function createRenderer(canvas: HTMLCanvasElement) {
		return new WebGLRenderer({ canvas, alpha: true, antialias: true });
	}
</script>

<!--
  Canvas wrapper for the 3D cycle diagram.
  Matches the same prop interface as CycleDiagram.svelte (SVG version).
  Position: relative is required by Threlte for HTML overlays.
-->
<div class="canvas-wrapper">
	<Canvas {createRenderer}>
		<DiagramScene {activeNodeId} {activeArcId} />
		<MCPBridgeComponent reconnectDelay={3000} />
	</Canvas>
</div>

<style>
	.canvas-wrapper {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: visible;
	}

	.canvas-wrapper :global(> div) {
		overflow: visible;
	}
</style>
