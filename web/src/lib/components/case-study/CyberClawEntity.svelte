<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { HTML, Float } from '@threlte/extras';
	import type { EntityDef } from './diagramData.js';

	let {
		entity,
		isActive,
		activeRegionId
	}: {
		entity: EntityDef;
		isActive: boolean;
		activeRegionId: string | null;
	} = $props();

	const COLOR_ACTIVE = '#C9A227';
	const COLOR_INACTIVE = '#CFCBC0';
	// Colors: ink (#1A1A1A) and cream (#F5F3EC) used in CSS below
	const SPRING = 8;

	// ── Spring-driven animated values ──────────────────────────────────
	let targetEmissive = $derived(isActive ? 0.6 : 0);
	let targetRoughness = $derived(isActive ? 0.18 : 0.45);
	let targetScale = $derived(isActive ? 1.08 : 1.0);

	let currentEmissive = $state(0);
	let currentRoughness = $state(0.45);
	let currentScale = $state(1.0);

	// Eye pulse state
	let eyeScale = $state(1.0);
	let elapsed = $state(0);

	// Orbit ring rotation
	let ringRotation = $state(0);

	useTask((delta) => {
		const dt = Math.min(delta, 0.1);

		// Spring interpolation for box material
		currentEmissive += (targetEmissive - currentEmissive) * SPRING * dt;
		currentRoughness += (targetRoughness - currentRoughness) * SPRING * dt;
		currentScale += (targetScale - currentScale) * SPRING * dt;

		// Orbit ring continuous rotation
		ringRotation += dt * 0.4;

		// Eye pulse when active
		elapsed += dt;
		if (isActive) {
			eyeScale = 1.0 + 0.15 * Math.sin(elapsed * 3.0);
		} else {
			// Spring back to 1.0 when inactive
			eyeScale += (1.0 - eyeScale) * SPRING * dt;
		}
	});

	// ── Derived layout values ──────────────────────────────────────────
	let htmlZ = $derived(entity.size[2] / 2 + 0.01);
	let boxW = $derived(entity.size[0]);
	let boxH = $derived(entity.size[1]);

	// Sub-region pixel dimensions for the HTML overlay
	let overlayWidth = $derived(Math.round(boxW * 120));
	let overlayHeight = $derived(Math.round(boxH * 120));
</script>

<Float floatIntensity={1.2} speed={0.7} rotationIntensity={0.2}>
	<T.Group position={entity.position} scale={currentScale}>
		<!-- Main box body -->
		<T.Mesh>
			<T.BoxGeometry args={entity.size} />
			<T.MeshPhysicalMaterial
				color={isActive ? COLOR_ACTIVE : COLOR_INACTIVE}
				emissive={isActive ? COLOR_ACTIVE : '#000000'}
				emissiveIntensity={currentEmissive}
				roughness={currentRoughness}
				metalness={isActive ? 0.3 : 0.12}
				clearcoat={0.15}
				clearcoatRoughness={0.5}
			/>
		</T.Mesh>

		<!-- Chamfered top accent — hexagonal prism cap -->
		<T.Mesh position={[0, entity.size[1] / 2 + 0.06, 0]}>
			<T.CylinderGeometry args={[0.35, 0.45, 0.12, 6]} />
			<T.MeshPhysicalMaterial
				color={COLOR_ACTIVE}
				emissive={isActive ? COLOR_ACTIVE : '#000000'}
				emissiveIntensity={currentEmissive * 0.5}
				roughness={0.3}
				metalness={0.25}
			/>
		</T.Mesh>

		<!-- "Eye" sphere — floating intelligence indicator -->
		<T.Mesh
			position={[0, entity.size[1] / 2 + 0.35, 0]}
			scale={[eyeScale, eyeScale, eyeScale]}
		>
			<T.SphereGeometry args={[0.08, 24, 24]} />
			<T.MeshPhysicalMaterial
				color={isActive ? '#FFFFFF' : COLOR_INACTIVE}
				emissive={isActive ? COLOR_ACTIVE : '#000000'}
				emissiveIntensity={isActive ? 1.2 : 0}
				roughness={0.1}
				metalness={0.4}
			/>
		</T.Mesh>

		<!-- Orbit ring — slowly rotating torus -->
		<T.Mesh rotation.y={ringRotation} rotation.x={0.3}>
			<T.TorusGeometry args={[0.6, 0.008, 8, 64]} />
			<T.MeshBasicMaterial
				color={COLOR_ACTIVE}
				transparent
				opacity={isActive ? 0.5 : 0.15}
			/>
		</T.Mesh>

		<!-- HTML overlay on front face -->
		<HTML
			sprite
			pointerEvents="none"
			position={[0, 0, htmlZ]}
		>
			<div
				class="entity-overlay"
				style="width: {overlayWidth}px; height: {overlayHeight}px;"
			>
				<div class="entity-header" class:active={isActive}>
					{entity.label}
				</div>

				<div class="sub-regions">
					{#each entity.subRegions as region (region.id)}
						<div
							class="sub-region"
							class:highlighted={activeRegionId === region.id}
						>
							<span class="region-dot" class:active={isActive}></span>
							<span class="region-label">{region.label}</span>
						</div>
					{/each}
				</div>

				<div class="status-bar" class:active={isActive}>
					<span class="status-dots">
						{#each { length: 11 } as _, i (i)}
							<span
								class="dot"
								class:filled={i < 7}
								class:active={isActive}
							></span>
						{/each}
					</span>
					<span class="status-text">7 / 11</span>
				</div>
			</div>
		</HTML>
	</T.Group>
</Float>

<style>
	.entity-overlay {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 8px 10px;
		pointer-events: none;
		user-select: none;
	}

	.entity-header {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		font-weight: 700;
		color: #cfcbc0;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		text-align: center;
		transition: color 550ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.entity-header.active {
		color: #c9a227;
	}

	.sub-regions {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 4px;
	}

	.sub-region {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 3px 6px;
		border: 1px solid transparent;
		border-radius: 3px;
		transition:
			border-color 400ms ease,
			background-color 400ms ease;
	}

	.sub-region.highlighted {
		border-color: #c9a227;
		background-color: rgba(201, 162, 39, 0.08);
	}

	.region-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #cfcbc0;
		flex-shrink: 0;
		transition: background 550ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.region-dot.active {
		background: #c9a227;
	}

	.region-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		font-weight: 500;
		color: #1a1a1a;
		white-space: nowrap;
	}

	.status-bar {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
		padding-top: 4px;
		border-top: 1px solid #e0ddd6;
		opacity: 0.5;
		transition: opacity 550ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.status-bar.active {
		opacity: 1;
	}

	.status-dots {
		display: flex;
		gap: 2px;
	}

	.dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: #e0ddd6;
		transition: background 400ms ease;
	}

	.dot.filled {
		background: #cfcbc0;
	}

	.dot.filled.active {
		background: #c9a227;
	}

	.status-text {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		font-weight: 600;
		color: #cfcbc0;
	}
</style>
