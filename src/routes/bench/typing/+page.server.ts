import { error } from '@sveltejs/kit';
import { APP_ENV } from '$app/env/private';
import type { PageServerLoad } from './$types';

// The typing benchmark's test page (story 0.9). Only the sandbox serves it (local, the `dev`
// preview and CI). The live site answers "not found", the same as a page that doesn't exist.
export const load: PageServerLoad = () => {
	if (APP_ENV !== 'sandbox') error(404, 'Not found');
};
