<script lang="ts">
	interface Props {
		stepTag: string;
		nameTag: string;
		heading: string;
		description: string;
		transcript: string;
		visible: boolean;
		isSuccess?: boolean;
		stats?: Array<{ label: string; value: string }>;
	}

	let {
		stepTag,
		nameTag,
		heading,
		description,
		transcript,
		visible,
		isSuccess = false,
		stats = []
	}: Props = $props();
</script>

<div class="step-card" class:visible>
	<!-- Step header -->
	<div class="step-header">
		<span class="step-tag">{stepTag}</span>
		<hr class="header-rule" />
		<span class="name-tag">{nameTag}</span>
	</div>

	<!-- Card body -->
	<div class="card-body" class:success={isSuccess}>
		<h3 class:italic={isSuccess || stepTag.toLowerCase().includes('step 0')}>
			{heading}
		</h3>

		<div class="description-row">
			<span class="skills-badge">SKILLS ACTIVATE</span>
			<p class="description-text">{description}</p>
		</div>

		<div class="transcript-box" class:success-transcript={isSuccess}>
			{transcript}
		</div>

		{#if isSuccess && stats.length > 0}
			<div class="stats-row">
				{#each stats as stat (stat.label)}
					<div class="stat-item">
						<span class="stat-value">{stat.value}</span>
						<span class="stat-label">{stat.label}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.step-card {
		opacity: 0;
		transform: translateY(22px);
		transition:
			opacity 700ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1)),
			transform 700ms var(--ease-smooth, cubic-bezier(0.25, 0.1, 0.25, 1));
	}

	.step-card.visible {
		opacity: 1;
		transform: translateY(0);
	}

	/* Step header */
	.step-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 18px;
	}

	.step-tag {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.4;
	}

	.header-rule {
		flex: 1;
		height: 1px;
		border: none;
		background: var(--color-muted, #cfcbc0);
	}

	.name-tag {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-accent, #c9a227);
	}

	/* Card body */
	.card-body {
		background: rgba(255, 255, 255, 0.5);
		border: 1px solid #cfcbc0;
		border-radius: 10px;
		padding: 26px 28px;
		box-shadow: 0 2px 10px rgba(26, 26, 26, 0.05);
	}

	.card-body.success {
		background: #1a1a1a;
		border: 2px solid #c9a227;
		box-shadow: 0 4px 28px rgba(201, 162, 39, 0.14);
	}

	/* Heading */
	h3 {
		font-size: 1.25rem;
		font-weight: 700;
		line-height: 1.2;
		margin: 0 0 18px 0;
		color: var(--color-ink, #1a1a1a);
	}

	.card-body.success h3 {
		color: white;
		font-size: 1.5rem;
	}

	h3.italic {
		font-style: italic;
		font-size: 1.5rem;
	}

	/* Description row */
	.description-row {
		display: flex;
		align-items: start;
		gap: 12px;
		margin-bottom: 18px;
	}

	.skills-badge {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: #c9a227;
		color: #1a1a1a;
		padding: 2px 7px;
		border-radius: 3px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.description-text {
		font-size: 0.875rem;
		line-height: 1.625;
		opacity: 0.75;
		margin: 0;
	}

	.card-body.success .description-text {
		color: rgba(255, 255, 255, 0.65);
	}

	/* Transcript box */
	.transcript-box {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		line-height: 1.75;
		background: rgba(26, 26, 26, 0.04);
		border-left: 2.5px solid #c9a227;
		padding: 11px 14px;
		border-radius: 0 4px 4px 0;
		opacity: 0.65;
		margin-bottom: 0;
		white-space: pre-wrap;
	}

	.transcript-box.success-transcript {
		background: rgba(255, 255, 255, 0.05);
		border-left-color: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.5);
	}

	/* Stats row */
	.stats-row {
		display: flex;
		gap: 2rem;
		padding-top: 4px;
		margin-top: 18px;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-weight: 700;
		font-size: 28px;
		color: #c9a227;
		line-height: 1;
	}

	.stat-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 8px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.35);
		margin-top: 4px;
	}
</style>
