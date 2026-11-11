import { expect, test } from '@playwright/test';

async function createLink(page: import('@playwright/test').Page, amount: string, description: string) {
  await page.getByLabel('Amount (₹)').fill(amount);
  await page.getByLabel('Description').fill(description);
  await page.getByLabel('Email').fill('customer@example.com');
  await page.getByRole('button', { name: 'Create link' }).click();
}

test('create links, mark one as paid, then filter by status', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('No payment links yet')).toBeVisible();

  await createLink(page, '1500', 'First invoice');
  await createLink(page, '2500.50', 'Second invoice');
  await expect(page.getByTestId('link-row')).toHaveCount(2);

  // Newest first
  await expect(page.getByTestId('link-row').first()).toContainText('Second invoice');

  await page.getByRole('button', { name: /Mark as paid: First invoice/ }).click();

  await page.getByRole('button', { name: 'Paid', exact: true }).click();
  await expect(page.getByTestId('link-row')).toHaveCount(1);
  await expect(page.getByTestId('link-row')).toContainText('First invoice');

  await page.getByRole('button', { name: 'Active', exact: true }).click();
  await expect(page.getByTestId('link-row')).toHaveCount(1);
  await expect(page.getByTestId('link-row')).toContainText('Second invoice');

  await page.getByRole('button', { name: 'Expired', exact: true }).click();
  await expect(page.getByText(/no expired links match/i)).toBeVisible();
});
