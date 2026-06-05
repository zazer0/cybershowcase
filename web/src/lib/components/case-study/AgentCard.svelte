<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { HTML } from '@threlte/extras';
	import { onDestroy } from 'svelte';
	import * as THREE from 'three';

	let { isActive, activeNodeId }: { isActive: boolean; activeNodeId: string } = $props();

	// ── Spring-driven glow opacity ──────────────────────────────────────────
	let targetGlowOpacity = $derived(isActive ? 0.12 : 0);
	let currentGlowOpacity = $state(0);

	const SPRING = 8;

	useTask((delta) => {
		const dt = Math.min(delta, 0.1);
		currentGlowOpacity += (targetGlowOpacity - currentGlowOpacity) * SPRING * dt;
	});

	// ── Geometry (disposed on destroy) ─────────────────────────────────────
	const planeGeo = new THREE.PlaneGeometry(3.0, 3.8);
	const layerBorderGeo = new THREE.PlaneGeometry(1.58, 1.98);
	const layerFillGeo = new THREE.PlaneGeometry(1.5, 1.9);

	onDestroy(() => {
		planeGeo.dispose();
		layerBorderGeo.dispose();
		layerFillGeo.dispose();
	});
</script>

<!-- Stacked back-layer for depth effect -->
<T.Mesh position={[0.15, 0.15, -0.2]}>
	<T is={layerBorderGeo} />
	<T.MeshBasicMaterial color="#cfcbc0" depthWrite={false} />
</T.Mesh>
<T.Mesh position={[0.15, 0.15, -0.195]}>
	<T is={layerFillGeo} />
	<T.MeshBasicMaterial color="#f5f3ec" depthWrite={false} />
</T.Mesh>

<!-- Glow plane sits slightly behind the HTML overlay -->
<T.Mesh position={[0, 0, -0.1]}>
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
	<div class="agent-card">
		<!-- Bullseye icon -->
		<div class="icon-wrap">
			<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="14" cy="14" r="11" stroke="#C9A227" stroke-width="1.5" />
				<circle cx="14" cy="14" r="5" stroke="#C9A227" stroke-width="1.5" />
				<circle cx="14" cy="14" r="2" fill="#C9A227" />
			</svg>
		</div>

		<!-- Heading -->
		<div class="heading">CYBERCLAW</div>

		<!-- Orchestrator sub-card -->
		<div class="sub-card" class:sub-card--active={activeNodeId === 'orchestrator'}>
			orchestrator
		</div>

		<!-- Status bar -->
		<div class="status-bar">
			<span class="dot dot--ink"></span>
			<span class="dot dot--gold"></span>
			<span class="refresh">↺</span>
			<span class="count">7/11</span>
		</div>
	</div>

	<!-- Label sits below the card -->
	<div class="card-label">AGENT</div>
</HTML>

<style>
	.agent-card {
		width: 220px;
		background: #f5f3ec;
		border: 2px solid #c9a227;
		border-radius: 12px;
		padding: 16px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		user-select: none;
		pointer-events: none;
	}

	.icon-wrap {
		margin-bottom: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.heading {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #c9a227;
		text-align: center;
		margin-bottom: 12px;
	}

	.sub-card {
		width: 100%;
		padding: 8px;
		border: 1.5px dashed #cfcbc0;
		border-radius: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: #1a1a1a;
		text-align: center;
		box-sizing: border-box;
		transition:
			border-color 350ms ease,
			color 350ms ease;
	}

	.sub-card--active {
		border-color: #c9a227;
		color: #c9a227;
	}

	.status-bar {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6px;
		margin-top: 10px;
		width: 100%;
	}

	.dot {
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.dot--ink {
		background: #1a1a1a;
	}

	.dot--gold {
		background: #c9a227;
	}

	.refresh {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: #cfcbc0;
		line-height: 1;
	}

	.count {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: #cfcbc0;
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
