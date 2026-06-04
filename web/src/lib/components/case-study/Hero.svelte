<script lang="ts">
	let {
		tagline,
		title,
		subtitle,
		features,
		scrollHint
	}: {
		tagline: string;
		title: string;
		subtitle: string;
		features: string[];
		scrollHint: string;
	} = $props();
</script>

<section class="hero">
	<p class="tagline">{tagline}</p>

	<h1 class="title">
		{title}<br />
		<span class="subtitle">{subtitle}</span>
	</h1>

	<ul class="features">
		{#each features as feature (feature)}
			<li class="feature-item">{feature}</li>
		{/each}
	</ul>

	<p class="scroll-hint">{scrollHint}</p>
</section>

<style>
	.hero {
		min-height: 50vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1.5rem;
		border-bottom: 1px solid var(--color-muted);
		text-align: center;
		gap: 1.5rem;
	}

	.tagline {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--color-accent);
		opacity: 0.7;
		margin: 0;
	}

	.title {
		font-weight: 700;
		font-size: 3rem;
		line-height: 1.1;
		letter-spacing: -0.02em;
		color: var(--color-ink);
		margin: 0;
	}

	.subtitle {
		color: var(--color-accent);
	}

	.features {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.625rem 2rem;
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 0;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		opacity: 0.65;
	}

	.feature-item::before {
		content: '';
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background-color: var(--color-accent);
		flex-shrink: 0;
	}

	.scroll-hint {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		opacity: 0.3;
		margin: 0;
	}

	@media (max-width: 480px) {
		.title {
			font-size: 2.25rem;
		}

		.features {
			grid-template-columns: 1fr;
		}
	}
</style>
