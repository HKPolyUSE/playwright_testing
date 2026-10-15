
## Run the app

1. Install the dependencies:

	```bash
	npm install
	```

2. Start the server:

	```bash
	npm start
	```

3. Open [http://localhost:8008](http://localhost:8008) in your browser.

Sign in with the demo account `alice` and password `123`.

For development with automatic restarts, run `npm run dev` instead.

## Run the tests

Run the server route tests with:

```bash
npm test
```

The tests use Node.js's built-in test runner and start the Express app on a temporary local port. They check login success and failure, login and authentication redirects, and todo creation, listing, updating, and deletion, including not-found responses. 


# Sample prompt 1

After installing and starting the playwright MCP server, you can try the following prompt in your coding agent.

## Prompt 1
start this app. Navigate to the app, login and add three items to the todolist.

## Prompt 2
test the various functions of the todo app.
write a test report with screenshots of the app for each test cases and document your findings.

Write playwright test cases based on this testing session.



# Reference

https://code.visualstudio.com/docs/copilot/customization/mcp-servers
