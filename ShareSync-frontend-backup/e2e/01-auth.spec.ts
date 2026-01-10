import { test, expect } from '@playwright/test';
import { signUp, login, generateTestUser } from './helpers';

test.describe('Authentication Flow', () => {
  test('should complete full signup and login flow', async ({ page }) => {
    const user = generateTestUser();
    
    // Sign up
    await signUp(page, user);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*home/);
    
    // Should see user name
    await expect(page.locator('text=/Good (morning|afternoon|evening)/i')).toBeVisible();
    
    // Log out
    await page.click('text=/Log.*out|Sign.*out/i');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    
    // Log back in
    await login(page, user.email, user.password);
    
    // Should be back on dashboard
    await expect(page).toHaveURL(/.*home/);
  });

  test('should reject invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/Invalid|incorrect|wrong/i')).toBeVisible();
  });

  test('should validate required fields on signup', async ({ page }) => {
    await page.goto('/signup');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors (adjust selector based on your UI)
    const errorCount = await page.locator('text=/required|must/i').count();
    expect(errorCount).toBeGreaterThan(0);
  });
});
