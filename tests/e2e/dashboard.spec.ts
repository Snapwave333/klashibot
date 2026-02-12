import { test, expect } from '@playwright/test';

test.describe('Kalashi Dashboard E2E', () => {
    
    test.beforeEach(async ({ page }) => {
        // Listen for console errors
        page.on('console', msg => {
            if (msg.type() === 'error')
              console.log(`PAGE ERROR: ${msg.text()}`);
        });

        // Fail test on any JS error
        page.on('pageerror', exception => {
            console.log(`UNCAUGHT EXCEPTION: "${exception}"`);
            throw exception; // Fail the test
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should load the dashboard and show title', async ({ page }) => {
        await expect(page).toHaveTitle(/Kalshi/i);
    });

    test('should verify Aura logo visibility (rendering check)', async ({ page }) => {
        // Strict check for the visual logo
        const logo = page.locator('img[alt="Aura Logo"]');
        await expect(logo).toBeVisible();
        
        // Ensure it's not a broken image (naturalWidth > 0)
        const isLoaded = await logo.evaluate((img: HTMLImageElement) => img.naturalWidth > 0);
        expect(isLoaded).toBeTruthy();
    });

    test('should render /ai-brain route correctly', async ({ page }) => {
        await page.goto('/ai-brain');
        await page.waitForLoadState('networkidle');
        
        // Check for specific content on this page
        // "AI MIND" is the tab label, but let's check for some content specific to the page
        // If blank, this will fail
        const topBar = page.locator('header'); 
        await expect(topBar).toBeVisible();
        
        const mainContent = page.locator('main, div.container, div.flex-1'); 
        // Just checking ensure something is laid out
        await expect(mainContent.first()).toBeVisible();
    });

    test('should show settings and profit chime toggle', async ({ page }) => {
        const settingsButton = page.locator('button[aria-label="Settings"]');
        await expect(settingsButton).toBeVisible();
        await settingsButton.click();
        const profitChime = page.locator('text="Profit Chime"');
        await expect(profitChime).toBeVisible();
    });

    test('should verify self-healing worker status API', async ({ request }) => {
        // Check if the backend proxies this or if we need to hit port 8002 directly.
        // Docker compose maps 8002:8002.
        const status = await request.get('http://localhost:8002/api/v1/status');
        expect(status.ok()).toBeTruthy();
        
        const json = await status.json();
        expect(json).toHaveProperty('components');
        expect(json.components).toHaveProperty('redis');
        expect(json.components).toHaveProperty('backend');
    });

    test('backend health check', async ({ request }) => {
         const backendHealth = await request.get('http://localhost:8001/health');
         // If backend doesn't have /health, checking root or assuming status from worker test
         // But let's verify connectivity
         expect(backendHealth.status()).toBeLessThan(500);
    });
});
