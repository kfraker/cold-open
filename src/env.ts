// The app's settings. SvelteKit checks each one when the app starts, and stops it with a clear
// message if one is missing or wrong. The checks themselves are in src/lib/server/settings.ts;
// src/hooks.server.ts then checks that the settings agree with each other.
import { defineEnvVars } from '@sveltejs/kit/env';
import { parseAppEnv, parseDatabaseUrl } from '#lib/server/settings.ts';

export const variables = defineEnvVars({
	APP_ENV: {
		description: 'sandbox (local, the dev preview and CI) or production (the live site).',
		schema: parseAppEnv
	},
	DATABASE_URL: {
		description:
			'Postgres connection string. A secret: never print it. Locally, set it with `npm run db:paste-url`.',
		schema: (value) => {
			parseDatabaseUrl(value);
			return value;
		}
	},
	VERCEL_ENV: {
		description: 'Set by Vercel: production, preview or development. Unset elsewhere.',
		schema: (value) => value
	}
});
