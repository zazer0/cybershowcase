<script lang="ts">
	import { onMount } from 'svelte';

	let status = $state('checking…');

	onMount(async () => {
		try {
			const res = await fetch('/api/health');
			const data = await res.json();
			status = data.ok ? 'API connected ✓' : 'API responded';
		} catch {
			status = 'API offline — start the FastAPI server';
		}
	});
</script>

<main class="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
	<h1 class="text-3xl font-semibold tracking-tight">hwverify</h1>
	<p class="text-gray-600">Svelte 5 + SvelteKit + Tailwind v4 — scaffolding ready.</p>
	<p class="font-mono text-sm">{status}</p>
</main>
