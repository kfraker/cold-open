import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
// Uses the Vercel adapter (installed, so it's pinned) when building on Vercel, and plain
// builds elsewhere. The Vercel adapter can't build on Windows: it needs symbolic links.
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import type { Plugin } from 'vite';
import { assertSettings } from './src/lib/server/settings.ts';

/**
 * On Vercel, a build whose settings disagree (say, a production deployment with APP_ENV=sandbox)
 * fails before it can be deployed. A setting that's missing or invalid on its own already fails
 * any build, at SvelteKit's "Analysing routes" step (checked 2026-11-09). This adds the checks that
 * compare settings, which otherwise only run when the app starts, after Vercel could already have
 * promoted the deployment.
 */
function vercelSettingsCheck(): Plugin {
	return {
		name: 'cold-open-vercel-settings-check',
		apply: 'build',
		buildStart() {
			if (!process.env.VERCEL) return;
			assertSettings({
				appEnv: process.env.APP_ENV,
				databaseUrl: process.env.DATABASE_URL,
				vercelEnv: process.env.VERCEL_ENV
			});
		}
	};
}

export default defineConfig({
	plugins: [
		vercelSettingsCheck(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			// Shared code is unit-tested. Pages and routes are covered by the browser tests.
			include: ['src/lib/**/*.{ts,svelte}'],
			exclude: ['src/lib/**/*.{test,spec}.ts'],
			reporter: ['text', 'json-summary', 'html'],
			// The floor coverage can't drop below. A local run that beats it raises it (rounded down)
			// by rewriting this file, so the change is committed with the work. CI never rewrites it,
			// and lowering the floor is always a visible change here.
			thresholds: {
				autoUpdate: process.env.CI ? false : (value: number) => Math.floor(value),
				lines: 100,
				functions: 100,
				branches: 100,
				statements: 100
			}
		},
		projects: [
			{
				extends: true,
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: true,
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
