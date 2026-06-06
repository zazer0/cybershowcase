<script lang="ts">
	import { onMount } from 'svelte';
	import CycleDiagram3D from './CycleDiagram3D.svelte';
	import StepCard from './StepCard.svelte';

	interface StepData {
		id: string;
		stepTag: string;
		nameTag: string;
		heading: string;
		description: string;
		transcript: string;
		activeNodeId: string;
		activeArcId: string | null;
		isSuccess?: boolean;
		stats?: Array<{ label: string; value: string }>;
	}

	let { steps }: { steps: StepData[] } = $props();

	let activeStepIndex = $state(0);
	let cardVisible = $state<boolean[]>([]);
	let sentinelElements: HTMLDivElement[] = [];
	let mobileCardElements: HTMLDivElement[] = [];

	$effect(() => {
		const len = steps.length;
		cardVisible = Array(len).fill(false);
	});

	let activeNodeId = $derived(steps[activeStepIndex].activeNodeId);
	let activeArcId = $derived(steps[activeStepIndex].activeArcId);
	let stepLabel = $derived(`${steps[activeStepIndex].stepTag} — ${steps[activeStepIndex].nameTag}`);

	onMount(() => {
		const centerObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const index = sentinelElements.indexOf(entry.target as HTMLDivElement);
						if (index !== -1) {
							activeStepIndex = index;
						}
					}
				}
			},
			{
				rootMargin: '-40% 0px -40% 0px',
				threshold: 0
			}
		);

		const fadeObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const index = mobileCardElements.indexOf(entry.target as HTMLDivElement);
						if (index !== -1) {
							cardVisible[index] = true;
						}
					}
				}
			},
			{
				threshold: 0.1
			}
		);

		for (const el of sentinelElements) {
			if (el) {
				centerObserver.observe(el);
			}
		}

		for (const el of mobileCardElements) {
			if (el) {
				fadeObserver.observe(el);
			}
		}

		return () => {
			centerObserver.disconnect();
			fadeObserver.disconnect();
		};
	});
</script>

<section class="scroll-story">
	<div class="grid-layout">
		<!-- Left column: sticky diagram -->
		<div class="left-column">
			<div class="sticky-container">
				<span id="current-step-label" class="step-label">{stepLabel}</span>

				<div class="progress-dots">
					{#each steps as _step, i (i)}
						<span class="dot" class:active={i === activeStepIndex}></span>
					{/each}
				</div>

				<div class="diagram-3d-wrapper">
					<CycleDiagram3D {activeNodeId} {activeArcId} {activeStepIndex} />
				</div>

				<span class="footer-label">System Architecture</span>
			</div>
		</div>

		<!-- Right column: scrolling step cards -->
		<div class="right-column">
			<!-- Mobile: traditional stacked cards with scroll-in fade -->
			<div class="mobile-cards">
				{#each steps as step, i (step.id)}
					<div class="step-wrapper" bind:this={mobileCardElements[i]}>
						<StepCard
							stepTag={step.stepTag}
							nameTag={step.nameTag}
							heading={step.heading}
							description={step.description}
							transcript={step.transcript}
							visible={cardVisible[i]}
							isSuccess={step.isSuccess}
							stats={step.stats}
						/>
					</div>
				{/each}
			</div>

			<!-- Desktop: sentinel-driven sticky single card -->
			<div class="desktop-story">
				<div class="steps-track">
					{#each steps as step, i (step.id)}
						<div class="scroll-sentinel" bind:this={sentinelElements[i]}></div>
					{/each}
				</div>

				<div class="sticky-card-container">
					{#key activeStepIndex}
						<div class="card-animate-wrapper">
							<StepCard
								stepTag={steps[activeStepIndex].stepTag}
								nameTag={steps[activeStepIndex].nameTag}
								heading={steps[activeStepIndex].heading}
								description={steps[activeStepIndex].description}
								transcript={steps[activeStepIndex].transcript}
								visible={true}
								isSuccess={steps[activeStepIndex].isSuccess}
								stats={steps[activeStepIndex].stats}
							/>
						</div>
					{/key}
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.scroll-story {
		width: 100%;
		padding: 0 1.5rem;
	}

	.grid-layout {
		display: block;
	}

	.left-column {
		display: none;
	}

	.mobile-cards {
		display: block;
		padding: 3rem 0;
	}

	.desktop-story {
		display: none;
	}

	.step-wrapper {
		margin-bottom: 5rem;
		max-width: none;
	}

	.step-wrapper:last-child {
		margin-bottom: 0;
	}

	/* Sticky container */
	.sticky-container {
		position: sticky;
		top: 0;
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		padding: 1.5rem 0.5rem 1.5rem 1.5rem;
	}

	/* Step label */
	.step-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-accent, #c9a227);
		text-align: center;
		margin-bottom: 8px;
	}

	/* Progress dots */
	.progress-dots {
		display: flex;
		flex-direction: row;
		gap: 6px;
		justify-content: center;
		margin-bottom: 20px;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-muted, #cfcbc0);
		transition:
			background 450ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1)),
			transform 450ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1));
	}

	.dot.active {
		background: var(--color-accent, #c9a227);
		transform: scale(1.55);
	}

	/* Footer label */
	.footer-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 8px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--color-muted, #cfcbc0);
		margin-top: 14px;
		text-align: center;
	}

	/* Desktop: 2fr/3fr grid — diagram left, single step card right */
	@media (min-width: 1024px) {
		.grid-layout {
			display: grid;
			grid-template-columns: 2fr 3fr;
			gap: 0;
		}

		.left-column {
			display: block;
		}

		.mobile-cards {
			display: none;
		}

		.desktop-story {
			display: grid;
			grid-template-columns: 1fr;
		}

		.steps-track,
		.sticky-card-container {
			grid-column: 1;
			grid-row: 1;
		}

		.scroll-sentinel {
			height: 100vh;
		}

		.scroll-sentinel:last-child {
			height: 50vh;
		}

		.sticky-card-container {
			position: sticky;
			top: 0;
			height: 100vh;
			display: flex;
			align-items: center;
			padding: 0 2rem;
			pointer-events: none;
		}

		.card-animate-wrapper {
			pointer-events: auto;
			width: 100%;
			animation: cardFadeIn 700ms cubic-bezier(0.25, 0.1, 0.25, 1) both;
		}

		@keyframes cardFadeIn {
			from {
				opacity: 0;
				transform: translateY(22px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}

	/* 3D diagram fills remaining flex space in the sticky container */
	.diagram-3d-wrapper {
		flex: 1;
		min-height: 0;
		width: 100%;
	}
</style>
