# Todo List Application with Playwright Testing

This project is a simple todo list application with user authentication and automated end-to-end testing using Playwright.

## Project Structure

```
├── public/                 # Static files
│   ├── login.html         # Login page
│   └── todos.html         # Todo list page
├── tests/                 # Test files
│   └── todo.spec.js       # End-to-end test specifications
├── package.json          # Project dependencies and scripts
├── server.js            # Express server implementation
└── playwright.config.js # Playwright test configuration
```

## About the Application

This is a simple todo list application with the following features:
- User authentication (login/logout)
- Add, delete, and toggle todo items
- Todo statistics (total, completed, pending)
- Session-based user management
- In-memory data storage

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node server.js
```

The application will be available at `http://localhost:3000`

Default credentials:
- Username: alice
- Password: 123

## Test Implementation

### Test Cases

The test suite (`tests/todo.spec.js`) includes the following test cases:
- TC-002: Invalid login validation
- TC-003: Successful login and empty state verification
- TC-004: Adding multiple todos
- TC-005/006: Toggling todo completion status
- TC-007: Deleting todo with confirmation
- TC-008: Canceling todo deletion

### Test Configuration

The `playwright.config.js` file contains test configuration including:
- Browser settings
- Viewport size
- Base URL configuration
- Timeout settings
- Test reporting options

## About Playwright

Playwright is a modern end-to-end testing framework by Microsoft that allows testing web applications across multiple browser engines (Chromium, Firefox, and WebKit).

### Running Tests

Run tests in headless mode (default):
```bash
npx playwright test
```

Run specific test file:
```bash
npx playwright test tests/todo.spec.js
```

Run tests in headed mode (with browser visible):
```bash
npx playwright test --headed
```

The `--headed` parameter opens the browser window during test execution, which is useful for:
- Debugging test failures
- Visualizing test steps
- Understanding timing issues
- Verifying selectors and element states

### Other Useful Test Commands

Run tests in debug mode:
```bash
npx playwright test --debug
```

Run specific test case:
```bash
npx playwright test -g "test case name"
```

### Test Reports

Playwright generates HTML test reports after each test run. To view the report:

1. Run the tests:
```bash
npx playwright test
```

2. Open the HTML report:
```bash
npx playwright show-report
```

The report includes:
- Test results summary
- Detailed test steps
- Screenshots of failures
- Test duration and timing
- Browser console logs
- Network requests (if any)

## Development Notes

- The application uses in-memory storage, so data is cleared when the server restarts
- Test cases run serially to maintain state consistency
- Each test starts with a clean todo list
- The cleanup endpoint `/__test__/cleanup` is only available in test environment

## References

- [Model Context Protocol Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)