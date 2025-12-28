
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

// Helper to get users
const getUsers = () => {
    if (!fs.existsSync(USERS_FILE)) return [];
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

// Helper to save users
const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// API Routes
app.post('/api/register', (req, res) => {
    try {
        const { firstName, email, password } = req.body;

        if (!firstName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const users = getUsers();
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const newUser = {
            id: Date.now().toString(),
            firstName,
            email,
            password, // Storing hash from client
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        res.status(201).json({
            id: newUser.id,
            firstName: newUser.firstName,
            email: newUser.email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            id: user.id,
            firstName: user.firstName,
            email: user.email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
