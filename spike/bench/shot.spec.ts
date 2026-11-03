import { test } from '@playwright/test';
test('screenshot of a split speech', async ({ page }) => {
	await page.goto('/?pages=150&debounce=1');
	await page.evaluate(() => (window as any).__spike.load(150));
	const pb = page.locator('.pb-inline').first();
	await pb.scrollIntoViewIfNeeded();
	const box = (await pb.boundingBox())!;
	await page.screenshot({ path: 'results/split-speech.png', clip: { x: box.x - 160, y: box.y - 140, width: 820, height: box.height + 300 } });
	const first = page.locator('.pb').first();
	await first.scrollIntoViewIfNeeded();
	const b2 = (await first.boundingBox())!;
	await page.screenshot({ path: 'results/page-break.png', clip: { x: b2.x - 160, y: b2.y - 120, width: 820, height: b2.height + 240 } });
});
