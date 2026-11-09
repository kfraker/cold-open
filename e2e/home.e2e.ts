import { expect, test } from './fixtures';

test('the home page shows the app name', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle('Cold Open');
	await expect(page.getByRole('heading', { level: 1, name: 'Cold Open' })).toBeVisible();
});
