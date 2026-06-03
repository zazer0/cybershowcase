<script lang="ts">
	import { onMount } from 'svelte';
	import CycleDiagram from './CycleDiagram.svelte';
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
	let cardElements: HTMLDivElement[] = [];

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
						const index = cardElements.indexOf(entry.target as HTMLDivElement);
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
						const index = cardElements.indexOf(entry.target as HTMLDivElement);
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

		for (const el of cardElements) {
			if (el) {
				centerObserver.observe(el);
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
					{#each steps as _, i (i)}
						<span
							class="dot"
							class:active={i === activeStepIndex}
						></span>
					{/each}
				</div>

				<CycleDiagram {activeNodeId} {activeArcId} />

				<span class="footer-label">System Architecture</span>
			</div>
		</div>

		<!-- Right column: scrolling step cards -->
		<div class="right-column">
			{#each steps as step, i (step.id)}
				<div class="step-wrapper" bind:this={cardElements[i]}>
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
	</div>
</section>

<style>
	.scroll-story {
		max-width: 960px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.grid-layout {
		display: block;
	}

	.left-column {
		display: none;
	}

	.right-column {
		padding: 3rem 0;
	}

	.step-wrapper {
		margin-bottom: 5rem;
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
		align-items: center;
		justify-content: center;
		padding: 1.5rem 0.5rem 1.5rem 0;
	}

	/* Step label */
	.step-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-accent, #C9A227);
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
		background: var(--color-muted, #CFCBC0);
		transition:
			background 450ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1)),
			transform 450ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1));
	}

	.dot.active {
		background: var(--color-accent, #C9A227);
		transform: scale(1.55);
	}

	/* Footer label */
	.footer-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 8px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--color-muted, #CFCBC0);
		margin-top: 14px;
		text-align: center;
	}

	/* Desktop: 2-column grid */
	@media (min-width: 1024px) {
		.grid-layout {
			display: grid;
			grid-template-columns: 4fr 8fr;
			gap: 0;
		}

		.left-column {
			display: block;
		}
	}
</style>
