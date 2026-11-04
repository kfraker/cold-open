import { describe, expect, it } from 'vitest';
import { APP_NAME, pageTitle } from './page-title';

describe('pageTitle', () => {
	it('is the app name on its own when there is no page name', () => {
		expect(pageTitle()).toBe(APP_NAME);
		expect(pageTitle('   ')).toBe(APP_NAME);
	});

	it('puts the page name before the app name', () => {
		expect(pageTitle('Projects')).toBe('Projects · Cold Open');
	});
});
