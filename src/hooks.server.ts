import type { ServerInit } from '@sveltejs/kit/hooks';
import { APP_ENV, DATABASE_URL, VERCEL_ENV } from '$app/env/private';
import { assertSettings } from '#lib/server/settings.ts';

// Each setting was already checked on its own (src/env.ts). This checks they agree: a sandbox
// app must use the sandbox database, and a Vercel preview must be a sandbox. If not, the app
// doesn't start, so it can never fall back to the wrong database.
export const init: ServerInit = () => {
	assertSettings({ appEnv: APP_ENV, databaseUrl: DATABASE_URL, vercelEnv: VERCEL_ENV });
};
