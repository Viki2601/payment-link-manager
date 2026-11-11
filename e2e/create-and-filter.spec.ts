import { expect, test } from '@playwright/test';

async function createLink(
  page: import('@playwright/test').Page,
  amount: string,
  description: string,
  minimumFirstPayment?: string,
) {
  await page.getByLabel('Amount (₹)', { exact: true }).fill(amount);
  await page.getByLabel('Description').fill(description);
  await page.getByLabel('Email').fill('customer@example.com');
  if (minimumFirstPayment) {
    await page.getByLabel('Allow partial payments').check();
    await page.getByLabel('Minimum first payment (₹)').fill(minimumFirstPayment);
  }
  await page.getByRole('button', { name: 'Create link' }).click();
}

test('create a partial link, record a payment, filter, and persist after reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('No payment links yet')).toBeVisible();

  await createLink(page, '150', 'First invoice', '20');
  await createLink(page, '2500.50', 'Second invoice');
  await expect(page.getByTestId('link-row')).toHaveCount(2);

  // Newest first
  await expect(page.getByTestId('link-row').first()).toContainText('Second invoice');

  const firstInvoice = page.getByTestId('link-row').filter({ hasText: 'First invoice' });
  await firstInvoice.getByLabel('Payment amount (₹)').fill('30');
  await firstInvoice.getByRole('button', { name: 'Record payment: First invoice' }).click();
  await expect(firstInvoice).toContainText('Partially paid');
  await expect(firstInvoice).toContainText('Paid ₹30.00 · Due ₹120.00');

  await page.getByRole('button', { name: 'Partially paid', exact: true }).click();
  await expect(page.getByTestId('link-row')).toHaveCount(1);
  await expect(page.getByTestId('link-row')).toContainText('First invoice');

  await page.reload();
  await page.getByRole('button', { name: 'Partially paid', exact: true }).click();
  await expect(page.getByTestId('link-row')).toHaveCount(1);
  await expect(page.getByTestId('link-row')).toContainText('Paid ₹30.00 · Due ₹120.00');
});
