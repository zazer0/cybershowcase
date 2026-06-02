import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		// Forward /api/* to the FastAPI dev server (no CORS pain in dev).
		proxy: {
			'/api': 'http://localhost:8000'
		}
	},
	ssr: {
		// Three.js and troika-three-text are ESM-only; bundle them for SSR
		// instead of treating as externals to prevent SvelteKit SSR errors.
		noExternal: ['three', 'troika-three-text']
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
