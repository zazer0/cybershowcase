<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { HTML } from '@threlte/extras';
	import { onDestroy } from 'svelte';
	import * as THREE from 'three';

	let { isActive, activeNodeId }: { isActive: boolean; activeNodeId: string } = $props();

	// ── Spring-driven glow opacity ──────────────────────────────────────────
	let targetGlowOpacity = $derived(isActive ? 0.06 : 0);
	let currentGlowOpacity = $state(0);

	const SPRING = 8;

	useTask((delta) => {
		const dt = Math.min(delta, 0.1);
		currentGlowOpacity += (targetGlowOpacity - currentGlowOpacity) * SPRING * dt;
	});

	// ── Geometry (disposed on destroy) ─────────────────────────────────────
	const planeGeo = new THREE.PlaneGeometry(2.9, 2.1);
	const layerBorderGeo = new THREE.PlaneGeometry(2.52, 1.65);
	const layerFillGeo = new THREE.PlaneGeometry(2.44, 1.57);

	onDestroy(() => {
		planeGeo.dispose();
		layerBorderGeo.dispose();
		layerFillGeo.dispose();
	});
</script>

<!-- Stacked back-layers for depth effect -->
<!-- Layer 2 (back-most) -->
<T.Mesh position={[0.16, 0.26, -0.35]}>
	<T is={layerBorderGeo} />
	<T.MeshBasicMaterial color="#cfcbc0" />
</T.Mesh>
<T.Mesh position={[0.16, 0.26, -0.345]}>
	<T is={layerFillGeo} />
	<T.MeshBasicMaterial color="#f5f3ec" />
</T.Mesh>

<!-- Layer 1 -->
<T.Mesh position={[0.08, 0.18, -0.2]}>
	<T is={layerBorderGeo} />
	<T.MeshBasicMaterial color="#cfcbc0" />
</T.Mesh>
<T.Mesh position={[0.08, 0.18, -0.195]}>
	<T is={layerFillGeo} />
	<T.MeshBasicMaterial color="#f5f3ec" />
</T.Mesh>

<!-- Glow plane sits slightly behind the HTML overlay -->
<T.Mesh position={[0, 0, -0.5]}>
	<T is={planeGeo} />
	<T.MeshBasicMaterial
		color="#C9A227"
		transparent
		opacity={currentGlowOpacity}
		depthWrite={false}
	/>
</T.Mesh>

<!-- HTML card overlay — fixed orientation, centered on this group's origin -->
<HTML pointerEvents="none" center distanceFactor={8}>
	<div class="server-card">
		<!-- Top row: DEV VM / ubuntu labels -->
		<div class="top-row">
			<span class="vm-label">DEV VM</span>
			<span class="os-label">ubuntu</span>
		</div>

		<!-- CLI Agent — always gold border, gold background tint when active -->
		<div class="item item--cli" class:item--active={activeNodeId === 'server'}>
			CLI Agent
		</div>

		<!-- automate_loop.sh — dashed, goes gold when active -->
		<div class="item item--dashed" class:item--dashed-active={activeNodeId === 'server'}>
			automate_loop.sh
		</div>

		<!-- solution.sh — dashed, goes gold when active -->
		<div class="item item--dashed" class:item--dashed-active={activeNodeId === 'server'}>
			solution.sh
		</div>
	</div>

	<!-- Label sits below the card -->
	<div class="card-label">SERVER</div>
</HTML>

<style>
	.server-card {
		width: 240px;
		background: #f5f3ec;
		border: 1.5px solid #cfcbc0;
		border-radius: 10px;
		padding: 14px 16px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 8px;
		user-select: none;
		pointer-events: none;
	}

	.top-row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}

	.vm-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #cfcbc0;
	}

	.os-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		color: #cfcbc0;
	}

	.item {
		border-radius: 6px;
		text-align: center;
		box-sizing: border-box;
		width: 100%;
		transition:
			border-color 350ms ease,
			background 350ms ease;
	}

	/* CLI Agent — solid gold border, always */
	.item--cli {
		border: 1.5px solid #c9a227;
		padding: 8px 12px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		font-weight: 600;
		color: #1a1a1a;
		background: transparent;
	}

	.item--cli.item--active {
		background: rgba(201, 162, 39, 0.08);
	}

	/* automate_loop.sh and solution.sh — dashed muted, gold when active */
	.item--dashed {
		border: 1.5px dashed #cfcbc0;
		padding: 7px 12px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: #1a1a1a;
	}

	.item--dashed.item--dashed-active {
		border-color: #c9a227;
	}

	.card-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: #cfcbc0;
		text-align: center;
		margin-top: 8px;
		user-select: none;
		pointer-events: none;
	}
</style>
