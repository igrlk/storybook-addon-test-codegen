import { expect, test } from '@playwright/test';

test('Submit multi-step form', async ({ page }) => {
	await page.goto(
		'http://localhost:6006/?path=/story/stories-multistepform--default',
	);
	await page.getByRole('tab', { name: 'Interaction Recorder' }).click();

	// Initial load doesn't allow to start the recording until the storybook is properly loaded
	while (true) {
		await page
			.getByRole('button', { name: 'Start recording Stop recording' })
			.click();

		await new Promise((resolve) => setTimeout(resolve, 1000));

		if (await page.getByText('Recording is in progress...').isVisible()) {
			break;
		}
	}

	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByRole('textbox', { name: 'Name' })
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByRole('textbox', { name: 'Name' })
		.fill('john doe');
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByRole('textbox', { name: 'Email' })
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByRole('textbox', { name: 'Email' })
		.fill('johndoe@gmail.com');
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByRole('button', { name: 'Submit' })
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByRole('textbox', { name: 'Phone' })
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByRole('textbox', { name: 'Phone' })
		.fill('12345');
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByRole('textbox', { name: 'Address' })
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByRole('textbox', { name: 'Address' })
		.fill('42 avenue');
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByRole('button', { name: 'Submit' })
		.click();
	await page.getByRole('button', { name: 'Add assertion' }).click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByText('email: johndoe@gmail.com')
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByText('to be visible')
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByText('phone:')
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByText('to be visible')
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByText('phone:')
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByText('to be visible')
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByText('address: 42 avenue')
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByText('to be visible')
		.click();
	await page
		.locator('iframe[title="storybook-preview-iframe"]')
		.contentFrame()
		.getByText('name: john doe')
		.click();

	await page.waitForTimeout(1000);
	const element = page.getByText('Play Functionplay: async ({');
	expect(await element.textContent()).toMatchSnapshot('addon.txt');
});
