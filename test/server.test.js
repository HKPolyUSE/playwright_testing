const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../server');

let server;
let baseUrl;
let sessionCookie;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (sessionCookie) {
    headers.Cookie = sessionCookie;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    redirect: 'manual'
  });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }
  return response;
}

// Runs the route scenarios in sequence while carrying one authenticated session.
test('supports login, todo management, authorization, and logout', async (t) => {
  // Test1: First, a visitor who is not logged in opens the home page. The app should
  // send them to /login. Then the test opens /login and checks that the login page loads.
  await t.test('redirects unauthenticated visitors and serves the login page', async () => {
    const rootResponse = await request('/');
    assert.equal(rootResponse.status, 302);
    assert.equal(rootResponse.headers.get('location'), '/login');

    const loginPage = await request('/login');
    assert.equal(loginPage.status, 200);
    assert.match(await loginPage.text(), /<html/i);
  });

  // Test2: First, the test sends an incorrect username and password to /login and
  // checks that the app returns an error. Then it sends the demo account details and
  // checks that the app reports success and starts a logged-in session.
  await t.test('rejects invalid credentials and accepts the demo account', async () => {
    const invalidResponse = await request('/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'wrong' })
    });
    assert.deepEqual(await invalidResponse.json(), {
      success: false,
      message: 'Invalid username or password'
    });

    const validResponse = await request('/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: '123' })
    });
    assert.deepEqual(await validResponse.json(), { success: true });
    assert.ok(sessionCookie);
  });

  // Test3: First, the test opens the todos page and checks that the list is empty.
  // Then it adds a todo and checks its text and default values, edits it and checks
  // the changes, and removes it and checks the list is empty again. Finally, it tries
  // to edit and remove a todo that does not exist and checks for a not-found response.
  await t.test('creates, reads, updates, and deletes todos', async () => {
    const todosPage = await request('/todos');
    assert.equal(todosPage.status, 200);
    assert.match(await todosPage.text(), /<html/i);

    const initialTodos = await request('/api/todos');
    assert.deepEqual(await initialTodos.json(), []);

    const createResponse = await request('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Write tests' })
    });
    const createdTodo = await createResponse.json();
    assert.equal(createdTodo.text, 'Write tests');
    assert.equal(createdTodo.completed, false);
    assert.equal(typeof createdTodo.id, 'number');
    assert.ok(createdTodo.createdAt);

    const updateResponse = await request(`/api/todos/${createdTodo.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Tests written', completed: true })
    });
    assert.deepEqual(await updateResponse.json(), {
      ...createdTodo,
      text: 'Tests written',
      completed: true
    });

    const missingUpdate = await request('/api/todos/0', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true })
    });
    assert.equal(missingUpdate.status, 404);
    assert.deepEqual(await missingUpdate.json(), { error: 'Todo not found' });

    const deleteResponse = await request(`/api/todos/${createdTodo.id}`, {
      method: 'DELETE'
    });
    assert.deepEqual(await deleteResponse.json(), { success: true });
    assert.deepEqual(await (await request('/api/todos')).json(), []);

    const missingDelete = await request(`/api/todos/${createdTodo.id}`, {
      method: 'DELETE'
    });
    assert.equal(missingDelete.status, 404);
  });

  // Test4: First, the test visits /logout and checks that the app sends the user to
  // /login. Then it requests the todo list without a session and checks that the app
  // sends the user to /login again because they are no longer logged in.
  await t.test('protects todo routes and ends the session on logout', async () => {
    const logoutResponse = await request('/logout');
    assert.equal(logoutResponse.status, 302);
    assert.equal(logoutResponse.headers.get('location'), '/login');

    sessionCookie = undefined;
    const todosResponse = await request('/api/todos');
    assert.equal(todosResponse.status, 302);
    assert.equal(todosResponse.headers.get('location'), '/login');
  });
});