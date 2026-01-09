import { test, expect } from '@playwright/test';
import { signUp, login, createProject, generateTestUser } from './helpers';

test.describe('Project Management', () => {
  let user: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    user = generateTestUser();
    await signUp(page, user);
  });

  test('should create a new project', async ({ page }) => {
    const projectTitle = `Test Project ${Date.now()}`;
    
    await createProject(page, {
      title: projectTitle,
      description: 'E2E test project',
    });
    
    // Should see project in list
    await expect(page.locator(`text=${projectTitle}`)).toBeVisible();
  });

  test('should view project details', async ({ page }) => {
    const projectTitle = `Detail Test ${Date.now()}`;
    
    await createProject(page, {
      title: projectTitle,
      description: 'Test description',
    });
    
    // Click on project
    await page.click(`text=${projectTitle}`);
    
    // Should see project details
    await expect(page.locator(`text=${projectTitle}`)).toBeVisible();
    await expect(page.locator('text=/Test description/i')).toBeVisible();
  });

  test('should update project', async ({ page }) => {
    const originalTitle = `Original ${Date.now()}`;
    const updatedTitle = `Updated ${Date.now()}`;
    
    await createProject(page, { title: originalTitle });
    
    // Open project
    await page.click(`text=${originalTitle}`);
    
    // Edit project (adjust selectors based on your UI)
    await page.click('text=/Edit|Update/i');
    await page.fill('input[name="title"]', updatedTitle);
    await page.click('button[type="submit"]');
    
    // Should see updated title
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
  });

  test('should delete project', async ({ page }) => {
    const projectTitle = `Delete Test ${Date.now()}`;
    
    await createProject(page, { title: projectTitle });
    
    // Open project
    await page.click(`text=${projectTitle}`);
    
    // Delete project (adjust selector)
    await page.click('text=/Delete|Remove/i');
    
    // Confirm deletion if modal appears
    const confirmButton = page.locator('text=/Confirm|Yes|Delete/i').last();
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Should not see project anymore
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${projectTitle}`)).not.toBeVisible();
  });
});
