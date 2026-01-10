// e2e/auth.spec.ts
/**
 * THEKEY AI - Authentication E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Clear any existing tokens
        await page.evaluate(() => {
            localStorage.clear();
        });
    });

    test('should show login page for unauthenticated users', async ({ page }) => {
        await page.goto('/');

        // Should display login form
        await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
        await expect(page.getByPlaceholder('Mật khẩu')).toBeVisible();
        await expect(page.getByRole('button', { name: /Đăng nhập/i })).toBeVisible();
    });

    test('should show signup page when clicking register', async ({ page }) => {
        await page.goto('/');

        // Click on signup link
        await page.getByText('Đăng ký').click();

        // Should display signup form
        await expect(page.getByText('Tạo tài khoản')).toBeVisible();
        await expect(page.getByPlaceholder('Xác nhận mật khẩu')).toBeVisible();
    });

    test('should show password strength indicator', async ({ page }) => {
        await page.goto('/');
        await page.getByText('Đăng ký').click();

        // Type a weak password
        const passwordInput = page.getByPlaceholder('Ít nhất 8 ký tự');
        await passwordInput.fill('abc');

        // Password requirements should be shown
        await expect(page.getByText('○ Ít nhất 8 ký tự')).toBeVisible();

        // Type a strong password
        await passwordInput.fill('StrongPass123');

        // All requirements should be checked
        await expect(page.getByText('✓ Ít nhất 8 ký tự')).toBeVisible();
        await expect(page.getByText('✓ Có chữ hoa (A-Z)')).toBeVisible();
        await expect(page.getByText('✓ Có chữ thường (a-z)')).toBeVisible();
        await expect(page.getByText('✓ Có số (0-9)')).toBeVisible();
    });

    test('should show validation error for weak password on signup', async ({ page }) => {
        await page.goto('/');
        await page.getByText('Đăng ký').click();

        // Fill form with weak password
        await page.getByPlaceholder('your@email.com').fill('test@example.com');
        await page.getByPlaceholder('Ít nhất 8 ký tự').fill('weak');
        await page.getByPlaceholder('Nhập lại mật khẩu').fill('weak');
        await page.getByRole('checkbox').check();

        // Submit
        await page.getByRole('button', { name: 'Tạo tài khoản' }).click();

        // Should show error
        await expect(page.getByText('Mật khẩu phải có ít nhất 8 ký tự')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/');

        // Fill login form with invalid credentials
        await page.getByPlaceholder('your@email.com').fill('invalid@test.com');
        await page.getByPlaceholder('Mật khẩu').fill('wrongpassword');
        await page.getByRole('button', { name: /Đăng nhập/i }).click();

        // Should show error message
        await expect(page.getByText(/Invalid|không hợp lệ/i)).toBeVisible({ timeout: 5000 });
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.goto('/');

        // Use test credentials (should be set up in test db)
        await page.getByPlaceholder('your@email.com').fill('test@thekey.ai');
        await page.getByPlaceholder('Mật khẩu').fill('TestPass123!');
        await page.getByRole('button', { name: /Đăng nhập/i }).click();

        // Should redirect to dashboard or show mindset sync
        await expect(page.getByText(/SURVIVAL|Mindset Sync/i)).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Protected Routes', () => {

    test('should redirect to login when accessing protected route', async ({ page }) => {
        // Try to access a protected route directly
        await page.goto('/dashboard');

        // Should be redirected to login
        await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    });
});

test.describe('Error Boundary', () => {

    test('should display fallback UI when JavaScript error occurs', async ({ page }) => {
        // Navigate to app
        await page.goto('/');

        // Inject an error (this would require specific implementation)
        // This is a placeholder test structure
        // In real scenarios, you'd test specific error conditions
    });
});
