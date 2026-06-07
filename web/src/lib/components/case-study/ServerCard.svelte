<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { HTML } from '@threlte/extras';
	import { onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { getSubstepGlow } from './animationData.js';

	let { isActive, activeNodeId, activeStepIndex }: { isActive: boolean; activeNodeId: string; activeStepIndex: number } = $props();

	let isExpanded = $derived(activeStepIndex === 2);

	// ── Spring-driven glow opacity ──────────────────────────────────────────
	let targetGlowOpacity = $derived(isActive ? 0.06 : 0);
	let currentGlowOpacity = $state(0);

	const SPRING = 8;

	let substepTime = $state(0);
	let substep0Glow = $state(0);
	let substep1Glow = $state(0);
	let substep2Glow = $state(0);

	function lerpColor(a: string, b: string, t: number): string {
		const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
		const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
		const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
	}

	useTask((delta) => {
		const dt = Math.min(delta, 0.1);
		currentGlowOpacity += (targetGlowOpacity - currentGlowOpacity) * SPRING * dt;
		if (isExpanded) {
			substepTime += dt;
		}
		substep0Glow = isExpanded ? getSubstepGlow(0, substepTime) : 0;
		substep1Glow = isExpanded ? getSubstepGlow(1, substepTime) : 0;
		substep2Glow = isExpanded ? getSubstepGlow(2, substepTime) : 0;
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
	{#if isExpanded}
		<div class="server-card server-card--expanded">
			<div class="top-row">
				<span class="vm-label">DEV VM</span>
				<span class="os-label">ubuntu@cyberclaw-dev</span>
			</div>

			<div class="item item--cli item--active">
				CLI Agent
			</div>

			<div class="arrow-down">▾</div>

			<div class="loop-container">
				<div class="loop-header">automate_loop.sh</div>
				<div class="substeps-row">
					<div class="substep" style:border-color={lerpColor('#cfcbc0', '#c9a227', substep0Glow)} style:background={`rgba(201, 162, 39, ${substep0Glow * 0.08})`}>
						<div class="substep-title">1. DIAGNOSE</div>
						<div class="substep-desc">investigate error<br/>find root cause</div>
					</div>
					<div class="substep-arrow">▸</div>
					<div class="substep" style:border-color={lerpColor('#cfcbc0', '#c9a227', substep1Glow)} style:background={`rgba(201, 162, 39, ${substep1Glow * 0.08})`}>
						<div class="substep-title">2. PLAN</div>
						<div class="substep-desc">write fix steps<br/>to plan file</div>
					</div>
					<div class="substep-arrow">▸</div>
					<div class="substep" style:border-color={lerpColor('#cfcbc0', '#c9a227', substep2Glow)} style:background={`rgba(201, 162, 39, ${substep2Glow * 0.08})`}>
						<div class="substep-title">3. IMPLEMENT</div>
						<div class="substep-desc">execute plan<br/>patch code</div>
					</div>
				</div>
			</div>

			<div class="item item--dashed item--dashed-active">
				solution.sh · validate progress
			</div>
		</div>
	{:else}
		<div class="server-card">
			<div class="top-row">
				<span class="vm-label">DEV VM</span>
				<span class="os-label">ubuntu</span>
			</div>
			<div class="item item--cli" class:item--active={activeNodeId === 'server'}>
				CLI Agent
			</div>
			<div class="item item--dashed" class:item--dashed-active={activeNodeId === 'server'}>
				automate_loop.sh
			</div>
			<div class="item item--dashed" class:item--dashed-active={activeNodeId === 'server'}>
				solution.sh
			</div>
		</div>
	{/if}

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

	.server-card--expanded {
		width: 340px;
		padding: 16px 18px;
		gap: 10px;
	}

	.arrow-down {
		text-align: center;
		color: #cfcbc0;
		font-size: 14px;
		line-height: 1;
		margin: -4px 0;
	}

	.loop-container {
		border: 1.5px dashed #c9a227;
		border-radius: 8px;
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.loop-header {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		font-weight: 700;
		color: #1a1a1a;
		text-align: center;
	}

	.substeps-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.substep {
		border: 1.5px solid #cfcbc0;
		border-radius: 6px;
		padding: 8px 10px;
		text-align: center;
		min-width: 80px;
		flex: 1;
		background: #f5f3ec;
	}

	.substep-title {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		font-weight: 700;
		color: #1a1a1a;
		margin-bottom: 4px;
	}

	.substep-desc {
		font-family: 'JetBrains Mono', monospace;
		font-size: 8px;
		color: #cfcbc0;
		line-height: 1.3;
	}

	.substep-arrow {
		color: #cfcbc0;
		font-size: 12px;
		flex-shrink: 0;
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
