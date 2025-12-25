const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

const usersFilePath = path.join(__dirname, 'users.json');

// Load existing users from the file
let users = [];
if (fs.existsSync(usersFilePath)) {
    const fileData = fs.readFileSync(usersFilePath, 'utf-8');
    users = JSON.parse(fileData);
}

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

// Registration
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.render('register', { message: 'User already exists!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, email, password: hashedPassword };
    users.push(newUser);

    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing to file:", error);
    }

    res.redirect('/login');
});

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        return res.redirect('/login-success');
    }
    res.render('login', { message: 'Invalid username or password!' });
});

// Success page after login
app.get('/login-success', (req, res) => {
    res.render('login-success');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/');
        res.redirect('/login');
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});