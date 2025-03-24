const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");

const User = require("./models/User");
const Prediction = require("./models/Prediction");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = "your_jwt_secret_key"; // Use a secure key in production

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/ipl-predictions", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Register a new user
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create new user
        const user = new User({ name, email, password });
        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Login user
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Submit a prediction (protected route)
app.post("/submit-prediction", async (req, res) => {
    const { match, predictedWinner } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Create new prediction
        const prediction = new Prediction({ userId, match, predictedWinner });
        await prediction.save();

        // Add prediction to user's predictions array
        await User.findByIdAndUpdate(userId, { $push: { predictions: prediction._id } });

        res.json({ message: "Prediction submitted successfully" });
    } catch (error) {
        res.status(401).json({ message: "Unauthorized or invalid token" });
    }
});

// Fetch leaderboard
app.get("/leaderboard", async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: "predictions",
                    localField: "predictions",
                    foreignField: "_id",
                    as: "predictions",
                },
            },
            {
                $project: {
                    name: 1,
                    played: { $size: "$predictions" },
                    won: {
                        $size: {
                            $filter: {
                                input: "$predictions",
                                as: "pred",
                                cond: { $eq: ["$$pred.result", "Won"] },
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    percentage: {
                        $cond: {
                            if: { $eq: ["$played", 0] },
                            then: 0,
                            else: { $multiply: [{ $divide: ["$won", "$played"] }, 100] },
                        },
                    },
                },
            },
        ]);

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Fetch user history (protected route)
app.get("/user-history", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Fetch user's predictions
        const predictions = await Prediction.find({ userId });
        res.json(predictions);
    } catch (error) {
        res.status(401).json({ message: "Unauthorized or invalid token" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
