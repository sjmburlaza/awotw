import { expect, test } from '@playwright/test';

test.describe('Architectural Wonders app', () => {
  test('loads the home page with primary navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('ARCHITECTURAL WONDERS OF THE WORLD')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Map View' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Timeline View' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Charts' })).toBeVisible();
    await expect(page.getByText('Style')).toHaveClass(/selected-mode/);
  });

  test('searches for wonders from the header', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Search...').fill('taj');

    await expect(page).toHaveURL(/\/search\?q=taj$/);
    await expect(page.getByText('Your search results...')).toBeVisible();
    await expect(page.getByRole('link', { name: /Taj Mahal/i })).toBeVisible();
  });

  test('opens the quiz flow from the header', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Quiz Me!!' }).click();

    await expect(page).toHaveURL(/\/quiz$/);
    await expect(page.locator('app-quiz').getByText('Quiz Me!!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'What is the name?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Where is it located?' })).toBeVisible();
  });
});
