const { test, expect } = require('@playwright/test');

/**
 * End-to-End Test Suite for Todo List Application
 * 
 * This test suite verifies the complete functionality of the todo list application
 * including authentication, todo management, and data persistence.
 * 
 * Test Environment:
 * - Tests run serially to maintain state consistency
 * - Each test starts with a clean todo list
 * - Uses in-memory storage that persists during the test session
 */
test.describe.serial('Todo List App - End to end', () => {
  /**
   * Before Each Test:
   * - Sets the environment to 'test'
   * - Navigates to the application
   * - Cleans up any existing todos via API endpoint
   */
  test.beforeEach(async ({ page }) => {
    console.log('Setting up test environment...');
    // Set test environment
    process.env.NODE_ENV = 'test';
    // Call cleanup endpoint
    await page.goto('/');
    await page.request.post('/__test__/cleanup');
  });

  /**
   * Helper function to perform login
   * Steps:
   * 1. Navigate to home page (redirects to login)
   * 2. Verify redirect to login page
   * 3. Fill in username and password
   * 4. Click login button
   * 5. Verify redirect to todos page
   */
  async function doLogin(page, username, password) {
    await page.goto('/');
    await expect(page).toHaveURL(/login/);
    await page.getByRole('textbox', { name: 'Username' }).fill(username);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/todos/);
  }

  /**
   * Helper function to ensure user is logged in
   * Steps:
   * 1. Try to navigate directly to todos page
   * 2. If redirected to login, perform login with default credentials
   * 3. Ensure we end up on the todos page
   */
  async function ensureLoggedIn(page) {
    await page.goto('/todos');
    // if we get redirected to login, log in
    if (page.url().includes('/login')) {
      await doLogin(page, 'alice', '123');
    }
  }

  /**
   * Helper to add multiple todos in the UI.
   * This makes tests self-contained by creating required items locally.
   */
  async function addTodos(page, items) {
    const addInput = page.getByPlaceholder('Add a new todo...');
    const addBtn = page.getByRole('button', { name: 'Add' });
    for (const text of items) {
      await addInput.fill(text);
      await addBtn.click();
      // small pause to allow UI to update
      await page.waitForTimeout(200);
    }
  }

  /**
   * TC-002: Verify Invalid Login Error Handling
   * 
   * Steps:
   * 1. Navigate to login page
   * 2. Enter incorrect username and password
   * 3. Click login button
   * 4. Verify error message is displayed
   * 
   * Expected Results:
   * - Error message "Invalid username or password" should be displayed
   * - User should remain on login page
   */
  test('TC-002 - invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Username' }).fill('wrong');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrong');
    await page.getByRole('button', { name: 'Login' }).click();
    const error = page.locator('#error-text');
    await expect(error).toHaveText(/Invalid username or password/);
  });

  /**
   * TC-003: Verify Successful Login and Empty State
   * 
   * Steps:
   * 1. Login with valid credentials
   * 2. Verify redirect to todos page
   * 3. Verify empty state message
   * 4. Check all counters are zero
   * 
   * Expected Results:
   * - Successful redirect to todos page
   * - Empty state message visible
   * - All counters (total, completed, pending) show 0
   */
  test('TC-003 - successful login and empty state', async ({ page }) => {
    await doLogin(page, 'alice', '123');
    await expect(page).toHaveURL(/todos/);
    // Verify empty state text
    await expect(page.getByText('No todos yet. Add one to get started!')).toBeVisible();
    // Verify stats are zero
    await expect(page.locator('#total-count')).toHaveText('0');
    await expect(page.locator('#completed-count')).toHaveText('0');
    await expect(page.locator('#pending-count')).toHaveText('0');
  });

  /**
   * TC-004: Add Multiple Todo Items
   * 
   * Steps:
   * 1. Ensure user is logged in
   * 2. Wait for page to load completely
   * 3. Add three different todo items:
   *    - "Buy groceries"
   *    - "Complete project report"
   *    - "Call dentist for appointment"
   * 4. Wait for UI updates after each addition
   * 5. Verify total count and presence of all items
   * 
   * Expected Results:
   * - All three items should be visible in the list
   * - Total count should be 3
   * - Each item should be added successfully with proper UI updates
   */
  test('TC-004 - add multiple todos', async ({ page }) => {
    // ensure we're logged in and on the todos page
    await ensureLoggedIn(page);
    // wait for the page to load completely
    await expect(page.getByText('My Todo List')).toBeVisible();
    
    const addInput = page.getByPlaceholder('Add a new todo...');
    const addBtn = page.getByRole('button', { name: 'Add' });

    await addInput.fill('Buy groceries');
    await addBtn.click();
    await page.waitForTimeout(500); // Wait for UI update
    
    await addInput.fill('Complete project report');
    await addBtn.click();
    await page.waitForTimeout(500); // Wait for UI update
    
    await addInput.fill('Call dentist for appointment');
    await addBtn.click();
    await page.waitForTimeout(500); // Wait for UI update

    // Verify list length and total
    await expect(page.locator('#total-count')).toHaveText('3');
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Complete project report')).toBeVisible();
    await expect(page.locator('text=Call dentist for appointment')).toBeVisible();
  });

  /**
   * TC-005 and TC-006: Toggle Todo Items Complete/Incomplete
   * 
   * Steps:
   * 1. Ensure user is logged in
   * 2. Get all todo checkboxes
   * 3. Check first item and verify counter update
   * 4. Check last item and verify counter update
   * 5. Uncheck first item and verify counter update
   * 
   * Expected Results:
   * - Completed count should increase when items are checked
   * - Completed count should decrease when items are unchecked
   * - Counter should accurately reflect number of completed items
   */
  test('TC-005 and TC-006 - toggle todos completed and unchecked', async ({ page }) => {
    await ensureLoggedIn(page);
    // Create the todos needed for this test so it doesn't rely on other tests
    await addTodos(page, [
      'Buy groceries',
      'Complete project report',
      'Call dentist for appointment'
    ]);
    const checkboxes = page.getByRole('checkbox');
    // mark first and last as complete
    await checkboxes.first().check();
    await expect(page.locator('#completed-count')).toHaveText('1');
    // mark last
    await checkboxes.nth(2).check();
    await expect(page.locator('#completed-count')).toHaveText('2');

    // uncheck first
    await checkboxes.first().uncheck();
    await expect(page.locator('#completed-count')).toHaveText('1');
  });

  /**
   * TC-007: Delete Todo with Confirmation
   * 
   * Steps:
   * 1. Ensure user is logged in
   * 2. Set up confirmation dialog handler to accept
   * 3. Click delete button for middle todo
   * 4. Verify item is removed and counter updated
   * 
   * Expected Results:
   * - Confirmation dialog should appear
   * - Selected todo should be removed after confirmation
   * - Total count should decrease by 1
   * - Deleted item should not be visible
   */
  test('TC-007 - delete todo with confirmation', async ({ page }) => {
    await ensureLoggedIn(page);
    // create todos for this test and then delete the middle one
    await addTodos(page, [
      'Buy groceries',
      'Complete project report',
      'Call dentist for appointment'
    ]);
    // delete the middle todo (Complete project report)
    const deleteBtns = page.getByRole('button', { name: 'Delete' });

    // attach dialog handler to accept
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    await deleteBtns.nth(1).click();
    // after deletion total should be 2
    await expect(page.locator('#total-count')).toHaveText('2');
    await expect(page.locator('text=Complete project report')).not.toBeVisible();
  });

  /**
   * TC-008: Cancel Todo Deletion
   * 
   * Steps:
   * 1. Ensure user is logged in
   * 2. Set up confirmation dialog handler to dismiss
   * 3. Click delete button for first todo
   * 4. Verify item remains in list
   * 
   * Expected Results:
   * - Confirmation dialog should appear
   * - Todo should remain in list after cancellation
   * - No changes to total count
   */
  test('TC-008 - cancel delete preserves todo', async ({ page }) => {
    await ensureLoggedIn(page);
    // prepare todos for this test
    await addTodos(page, [
      'Buy groceries',
      'Complete project report',
      'Call dentist for appointment'
    ]);
    const deleteBtns = page.getByRole('button', { name: 'Delete' });

    // dismiss dialog
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.dismiss();
    });

    // try to delete first todo but cancel
    await deleteBtns.first().click();
    // first todo should still be visible
    await expect(page.locator('text=Buy groceries')).toBeVisible();
  });

  /**
   * TC-010: Verify Data Persistence Across Sessions
   * 
   * Steps:
   * 1. Ensure user is logged in
   * 2. Click logout link
   * 3. Verify redirect to login page
   * 4. Log back in with same credentials
   * 5. Verify todos persist after re-login
   * 
   * Expected Results:
   * - Successfully redirect to login page after logout
   * - Successfully log back in
   * - All existing todos should still be visible
   * - Todo states (complete/incomplete) should be preserved
   */
  test('TC-010 - data persistence after logout/login', async ({ page }) => {
    await ensureLoggedIn(page);
    // create todos that should persist across logout/login
    await addTodos(page, [
      'Buy groceries',
      'Call dentist for appointment'
    ]);
    // logout
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/login/);

    // login again
    await page.getByRole('textbox', { name: 'Username' }).fill('alice');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/todos/);
    // expect remaining todos persisted
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Call dentist for appointment')).toBeVisible();
  });

  /**
   * TC-011: Test Long Text Handling
   * 
   * Steps:
   * 1. Ensure user is logged in
   * 2. Create a todo with very long text
   * 3. Verify the long text is displayed correctly
   * 
   * Expected Results:
   * - Long text should be accepted as input
   * - Entire text should be visible in the todo list
   * - UI should handle text wrapping appropriately
   * - No layout issues or text truncation
   */
  test('TC-011 - long text handling', async ({ page }) => {
    await ensureLoggedIn(page);
    const addInput = page.getByPlaceholder('Add a new todo...');
    const addBtn = page.getByRole('button', { name: 'Add' });
    const longText = 'This is a very long todo item to test how the application handles lengthy text entries that might wrap across multiple lines or cause layout issues in the user interface';
    await addInput.fill(longText);
    await addBtn.click();
    await expect(page.locator(`text=${longText}`)).toBeVisible();
  });
});
