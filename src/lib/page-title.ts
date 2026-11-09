export const APP_NAME = 'Cold Open';

/** The browser tab title for a page: the page name first, then the app name. */
export function pageTitle(page?: string): string {
	const name = page?.trim();
	return name ? `${name} · ${APP_NAME}` : APP_NAME;
}
