import { Page } from '@playwright/test';

export async function signUp(page: Page, userData: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}) {
  await page.goto('/register');  // ← FIXED: was /signup
  await page.fill('input[name="firstName"]', userData.firstName);
  await page.fill('input[name="lastName"]', userData.lastName);
  await page.fill('input[name="username"]', userData.username);
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);
  await page.click('button[type="submit"]');
  
  // Wait for successful registration (adjust URL if needed)
  await page.waitForURL('**/home');
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard/home
  await page.waitForURL('**/home');
}

export async function createProject(page: Page, projectData: {
  title: string;
  description?: string;
}) {
  // Navigate to create project
  await page.click('text=/Create.*Project/i');
  
  // Fill form
  await page.fill('input[name="title"]', projectData.title);
  if (projectData.description) {
    await page.fill('textarea[name="description"]', projectData.description);
  }
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for success
  await page.waitForTimeout(1000);
}

export async function createTask(page: Page, taskData: {
  title: string;
  description?: string;
}) {
  await page.click('text=/Add.*Task/i');
  await page.fill('input[name="title"]', taskData.title);
  if (taskData.description) {
    await page.fill('textarea[name="description"]', taskData.description);
  }
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
}

export function generateTestUser() {
  const timestamp = Date.now();
  return {
    firstName: 'Test',
    lastName: 'User',
    username: `testuser${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123!',
  };
}
