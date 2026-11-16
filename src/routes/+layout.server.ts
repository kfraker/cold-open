import { APP_ENV } from '$app/env/private';
import type { LayoutServerLoad } from './$types';

// Passed from the server, not declared public in src/env.ts: SvelteKit checks a public setting
// whenever its tools load (Vitest included), so unit tests would need settings too. Epic 1's
// sign-in adds its own data to this load anyway.
export const load: LayoutServerLoad = () => ({ sandbox: APP_ENV === 'sandbox' });
