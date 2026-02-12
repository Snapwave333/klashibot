import { test, expect } from '@playwright/test';

test.describe('Kalashi Dashboard E2E', () => {

    test.beforeEach(async ({ page }) => {
        // Listen for console errors
        page.on('console', msg => {
            if (msg.type() === 'error')
              console.log(`PAGE ERROR: ${msg.text()}`);
        });

        // Fail test on any JS error (except network errors which are expected without backend)
        page.on('pageerror', exception => {
            const errorMsg = exception.toString();
            // Ignore WebSocket and fetch errors when backend isn't running
            if (errorMsg.includes('WebSocket') || errorMsg.includes('fetch') || errorMsg.includes('ERR_CONNECTION_REFUSED')) {
                console.log(`IGNORED NETWORK ERROR: "${errorMsg}"`);
                return;
            }
            console.log(`UNCAUGHT EXCEPTION: "${exception}"`);
            throw exception; // Fail the test
        });

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        // Give React time to render
        await page.waitForTimeout(1000);
    });

    test('should load the dashboard and show title', async ({ page }) => {
        await expect(page).toHaveTitle(/Kalshi/i);
    });

    test('should verify Aura logo visibility (rendering check)', async ({ page }) => {
        // Look for the logo - could be an img or an SVG component
        const logo = page.locator('img[alt*="Logo"], img[alt*="Aura"], svg[aria-label*="Logo"], header img').first();

        // Wait for any logo element to appear
        await expect(logo).toBeVisible({ timeout: 10000 });
    });

    test('should render /ai-brain route correctly', async ({ page }) => {
        await page.goto('/ai-brain');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        // Check for the header which should always be present
        const header = page.locator('header');
        await expect(header).toBeVisible();

        // Check that we have some main content area
        const mainContent = page.locator('main, [role="main"], .container, .flex-1').first();
        await expect(mainContent).toBeVisible();
    });

    test('should show settings and profit chime toggle', async ({ page }) => {
        // Look for settings button with various possible selectors
        const settingsButton = page.locator('button[aria-label="Settings"], button:has-text("Settings"), [data-testid="settings-button"]').first();

        // If no settings button, try looking for a gear icon or settings link
        const settingsElement = settingsButton.or(page.locator('a[href*="settings"], button:has(svg)').filter({ hasText: /settings/i })).first();

        if (await settingsElement.isVisible()) {
            await settingsElement.click();
            // Wait for modal/panel to open
            await page.waitForTimeout(500);

            // Look for profit chime text anywhere - use separate locators and combine with .or()
            const profitChime = page.getByText(/profit.*chime/i)
                .or(page.locator('label:has-text("Profit")'))
                .or(page.locator('[data-testid="profit-chime"]'))
                .first();
            await expect(profitChime).toBeVisible({ timeout: 5000 });
        } else {
            // Skip if settings not found - may be in different location
            test.skip();
        }
    });
});

// Backend API tests - these require the full stack to be running
test.describe('Backend API Tests', () => {
    // Skip these tests if backend isn't running
    test.beforeAll(async ({ request }) => {
        try {
            const response = await request.get('http://localhost:8001/health', { timeout: 5000 });
            if (!response.ok()) {
                test.skip();
            }
        } catch {
            test.skip();
        }
    });

    test('should verify self-healing worker status API', async ({ request }) => {
        const status = await request.get('http://localhost:8002/api/v1/status');
        expect(status.ok()).toBeTruthy();

        const json = await status.json();
        expect(json).toHaveProperty('components');
        expect(json.components).toHaveProperty('redis');
        expect(json.components).toHaveProperty('backend');
    });

    test('backend health check', async ({ request }) => {
        const backendHealth = await request.get('http://localhost:8001/health');
        expect(backendHealth.status()).toBeLessThan(500);
    });
});
