const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 4000;

// In-memory storage
const users = [];
const exercises = [];

// Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Root route
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// POST /api/users - Create a new user
app.post("/api/users", (req, res) => {
    const { username } = req.body;
    if (!username) return res.json({ error: "Username is required" });

    const user = {
        username,
        _id: Date.now().toString() // Simple unique ID
    };
    users.push(user);
    res.json(user);
});

// GET /api/users - Get all users
app.get("/api/users", (req, res) => {
    res.json(users);
});

// POST /api/users/:_id/exercises - Add an exercise
app.post("/api/users/:_id/exercises", (req, res) => {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    if (!description || !duration) {
        return res.json({ error: "Description and duration are required" });
    }

    const user = users.find(u => u._id === _id);
    if (!user) return res.json({ error: "User not found" });

    const exerciseDate = date ? new Date(date) : new Date();
    if (isNaN(exerciseDate.getTime())) {
        return res.json({ error: "Invalid date" });
    }

    const exercise = {
        username: user.username,
        description,
        duration: parseInt(duration),
        date: exerciseDate.toDateString(),
        _id: user._id
    };
    exercises.push(exercise);

    res.json({
        ...user,
        description,
        duration: parseInt(duration),
        date: exerciseDate.toDateString()
    });
});

// GET /api/users/:_id/logs - Get user exercise log
app.get("/api/users/:_id/logs", (req, res) => {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = users.find(u => u._id === _id);
    if (!user) return res.json({ error: "User not found" });

    let userExercises = exercises.filter(e => e._id === _id);

    // Filter by date range if provided
    if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) {
            userExercises = userExercises.filter(e => new Date(e.date) >= fromDate);
        }
    }
    if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
            userExercises = userExercises.filter(e => new Date(e.date) <= toDate);
        }
    }

    // Apply limit if provided
    if (limit) {
        const limitNum = parseInt(limit);
        if (!isNaN(limitNum)) {
            userExercises = userExercises.slice(0, limitNum);
        }
    }

    res.json({
        username: user.username,
        _id: user._id,
        count: userExercises.length,
        log: userExercises.map(e => ({
            description: e.description,
            duration: e.duration,
            date: e.date
        }))
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For Vercel