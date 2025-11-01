const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: 'todo-app-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Sample user data
const users = {
  'alice': '123'
};

// In-memory todo storage (per user)
const userTodos = {
  'alice': []
};

// Test cleanup endpoint
app.post('/__test__/cleanup', (req, res) => {
  console.log('Cleaning up todos for all users...');
  if (process.env.NODE_ENV === 'test') {
    console.log('Resetting user todos...');
    for (let user in userTodos) {
      userTodos[user] = [];
    }
    res.json({ success: true });
  } else {
    res.status(404).end();
  }
});

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/todos');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/todos');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (users[username] && users[username] === password) {
    req.session.user = username;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid username or password' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/todos', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'todos.html'));
});

// API routes for todos
app.get('/api/todos', isAuthenticated, (req, res) => {
  const username = req.session.user;
  res.json(userTodos[username] || []);
});

app.post('/api/todos', isAuthenticated, (req, res) => {
  const username = req.session.user;
  const { text } = req.body;
  
  if (!userTodos[username]) {
    userTodos[username] = [];
  }
  
  const newTodo = {
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  userTodos[username].push(newTodo);
  res.json(newTodo);
});

app.put('/api/todos/:id', isAuthenticated, (req, res) => {
  const username = req.session.user;
  const todoId = parseInt(req.params.id);
  const { completed, text } = req.body;
  
  const todo = userTodos[username].find(t => t.id === todoId);
  
  if (todo) {
    if (completed !== undefined) {
      todo.completed = completed;
    }
    if (text !== undefined) {
      todo.text = text;
    }
    res.json(todo);
  } else {
    res.status(404).json({ error: 'Todo not found' });
  }
});

app.delete('/api/todos/:id', isAuthenticated, (req, res) => {
  const username = req.session.user;
  const todoId = parseInt(req.params.id);
  
  const index = userTodos[username].findIndex(t => t.id === todoId);
  
  if (index !== -1) {
    userTodos[username].splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Todo not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
