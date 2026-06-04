<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { HTML } from '@threlte/extras';
	import type { EntityDef } from './diagramData.js';
	import { AUTOMATE_LOOP_STAGES } from './diagramData.js';

	let {
		entity,
		isActive,
		activeRegionId,
		isZoomed
	}: {
		entity: EntityDef;
		isActive: boolean;
		activeRegionId: string | null;
		isZoomed: boolean;
	} = $props();

	const COLOR_GOLD = '#C9A227';
	const COLOR_MUTED = '#CFCBC0';
	const COLOR_DEPTH_SIDE = '#DDD9CD';
	const COLOR_DEPTH_TOP = '#EDE9DD';
	const COLOR_CREAM = '#F5F3EC';

	const SPRING = 8;

	// Spring-animated emissive intensity
	let targetEmissive = $derived(isActive ? 0.3 : 0);
	let currentEmissive = $state(0);

	// Spring-animated roughness
	let targetRoughness = $derived(isActive ? 0.35 : 0.7);
	let currentRoughness = $state(0.7);

	// Pulse direction for badge
	let badgePulseTime = $state(0);
	let badgePulseOpacity = $derived(
		activeRegionId === 'success-badge' ? 0.7 + 0.3 * Math.sin(badgePulseTime * 3) : 0
	);

	// Sequential stage lighting for automate_loop expanded view
	let stageHighlightTime = $state(0);
	const STAGE_DURATION = 1.2; // seconds per stage
	const STAGE_COUNT = AUTOMATE_LOOP_STAGES.length;
	let activeStageIndex = $derived(
		isZoomed ? Math.floor(stageHighlightTime / STAGE_DURATION) % STAGE_COUNT : -1
	);

	// Reset stage highlight time when leaving zoomed view
	$effect(() => {
		if (!isZoomed) {
			stageHighlightTime = 0;
		}
	});

	useTask((delta) => {
		const dt = Math.min(delta, 0.1);
		currentEmissive += (targetEmissive - currentEmissive) * SPRING * dt;
		currentRoughness += (targetRoughness - currentRoughness) * SPRING * dt;
		if (activeRegionId === 'success-badge') {
			badgePulseTime += dt;
		} else {
			badgePulseTime = 0;
		}
		// Increment stage highlight timer when zoomed
		if (isZoomed) {
			stageHighlightTime += dt;
		}
	});

	// Derived sizes
	let boxW = $derived(entity.size[0]);
	let boxH = $derived(entity.size[1]);
	let boxD = $derived(entity.size[2]);

	// Depth edge dimensions
	let depthThickness = $derived(boxD * 0.15);

	// HTML overlay position — on front face
	let htmlZ = $derived(boxD / 2 + 0.01);

	// HTML overlay pixel dimensions (scale factor for entity → px)
	const overlayWidth = 220;
	const overlayHeight = 280;

	function isRegionActive(regionId: string): boolean {
		return activeRegionId === regionId;
	}
</script>

<T.Group position={entity.position}>
	<!-- Main box -->
	<T.Mesh>
		<T.BoxGeometry args={[boxW, boxH, boxD]} />
		<T.MeshPhysicalMaterial
			color={isActive ? COLOR_CREAM : COLOR_MUTED}
			emissive={isActive ? COLOR_GOLD : '#000000'}
			emissiveIntensity={currentEmissive}
			roughness={currentRoughness}
			metalness={0.08}
			clearcoat={0.1}
			clearcoatRoughness={0.6}
		/>
	</T.Mesh>

	<!-- Depth edge: right side face -->
	<T.Mesh position={[boxW / 2 + depthThickness / 2, 0, -depthThickness / 2]}>
		<T.BoxGeometry args={[depthThickness, boxH, boxD - depthThickness]} />
		<T.MeshStandardMaterial color={COLOR_DEPTH_SIDE} roughness={0.6} metalness={0.05} />
	</T.Mesh>

	<!-- Depth edge: top face -->
	<T.Mesh position={[0, boxH / 2 + depthThickness / 2, -depthThickness / 2]}>
		<T.BoxGeometry args={[boxW + depthThickness, depthThickness, boxD - depthThickness]} />
		<T.MeshStandardMaterial color={COLOR_DEPTH_TOP} roughness={0.6} metalness={0.05} />
	</T.Mesh>

	<!-- HTML overlay on front face -->
	<HTML pointerEvents="none" position={[0, 0, htmlZ]} transform scale={0.008}>
		<div class="vm-overlay" style:width="{overlayWidth}px" style:height="{overlayHeight}px">
			<!-- Header -->
			<div class="vm-header">DEV VM</div>

			<!-- CLI Agent sub-region -->
			<div class="sub-region" class:region-active={isRegionActive('cli-agent')}>
				<span class="region-label">CLI Agent</span>
			</div>

			<!-- automate_loop.sh -->
			<div
				class="sub-region loop-region"
				class:region-active={isRegionActive('automate-loop')}
				class:expanded={isZoomed}
			>
				<span class="region-label">automate_loop.sh</span>

				<!-- Collapsed: just the label with dashed border (visible when NOT zoomed) -->
				<!-- Expanded: stage detail (visible when zoomed) -->
				<div class="loop-expanded" class:visible={isZoomed}>
					<div class="stages-row">
						{#each AUTOMATE_LOOP_STAGES as stage, i (stage.id)}
							<div class="stage-box" class:stage-active={activeStageIndex === i}>
								<span class="stage-label">{stage.label}</span>
								<span class="stage-desc">{stage.description}</span>
							</div>
							{#if i < AUTOMATE_LOOP_STAGES.length - 1}
								<span class="stage-arrow">&rarr;</span>
							{/if}
						{/each}
					</div>

					<!-- Retry arrow hint -->
					<div class="retry-arrow">&#8635; retry</div>

					<!-- Validator inside expanded loop -->
					<div class="sub-region validator-inner" class:region-active={isRegionActive('validator')}>
						<span class="region-label">solution.sh &bull; validate progress</span>
					</div>
				</div>
			</div>

			<!-- solution.sh (shown when NOT zoomed — when zoomed it's inside the loop) -->
			{#if !isZoomed}
				<div class="sub-region" class:region-active={isRegionActive('validator')}>
					<span class="region-label">solution.sh</span>
				</div>
			{/if}

			<!-- Success badge -->
			{#if activeRegionId === 'success-badge'}
				<div class="success-badge" style:opacity={badgePulseOpacity}>13/13 PASS</div>
			{/if}
		</div>
	</HTML>
</T.Group>

<style>
	.vm-overlay {
		font-family: 'JetBrains Mono', monospace;
		color: #1a1a1a;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px;
		box-sizing: border-box;
	}

	.vm-header {
		font-size: 13px;
		font-weight: 700;
		color: #cfcbc0;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		text-align: center;
		margin-bottom: 4px;
	}

	.sub-region {
		border: 1px dashed #cfcbc0;
		border-radius: 4px;
		padding: 6px 8px;
		transition:
			border-color 300ms ease,
			background-color 300ms ease;
	}

	.sub-region.region-active {
		border-color: #c9a227;
		border-style: solid;
		background-color: rgba(201, 162, 39, 0.08);
	}

	.region-label {
		font-size: 10px;
		font-weight: 600;
		color: #1a1a1a;
		white-space: nowrap;
	}

	.loop-region {
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow: hidden;
		transition:
			border-color 300ms ease,
			background-color 300ms ease,
			max-height 300ms ease;
	}

	.loop-region.expanded {
		border-style: solid;
		border-color: #cfcbc0;
	}

	.loop-expanded {
		opacity: 0;
		max-height: 0;
		overflow: hidden;
		transition:
			opacity 300ms ease,
			max-height 300ms ease;
	}

	.loop-expanded.visible {
		opacity: 1;
		max-height: 200px;
	}

	.stages-row {
		display: flex;
		align-items: center;
		gap: 3px;
		margin-top: 4px;
	}

	.stage-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		border: 1px solid #cfcbc0;
		border-radius: 3px;
		padding: 3px 4px;
		flex: 1;
		min-width: 0;
	}

	.stage-box.stage-active {
		border-color: #c9a227;
		background-color: rgba(201, 162, 39, 0.12);
		transition:
			border-color 200ms ease,
			background-color 200ms ease;
	}

	.stage-box.stage-active .stage-label {
		color: #c9a227;
	}

	.stage-label {
		font-size: 7px;
		font-weight: 700;
		color: #1a1a1a;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: color 200ms ease;
	}

	.stage-desc {
		font-size: 6px;
		color: #777;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.stage-arrow {
		font-size: 10px;
		color: #cfcbc0;
		flex-shrink: 0;
	}

	.retry-arrow {
		font-size: 7px;
		color: #cfcbc088;
		text-align: center;
		margin-top: 2px;
	}

	.validator-inner {
		margin-top: 4px;
		font-size: 9px;
	}

	.success-badge {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		font-weight: 700;
		color: #1a1a1a;
		background-color: #c9a227;
		border-radius: 4px;
		padding: 4px 10px;
		text-align: center;
		margin-top: 4px;
		transition: opacity 300ms ease;
	}
</style>
