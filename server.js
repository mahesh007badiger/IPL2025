require("dotenv").config(); // Load environment variables
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
const JWT_SECRET = process.env.JWT_SECRET || "default_secret"; // Use .env for security

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(bodyParser.json());

// Connect to MongoDB (use .env for security)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ **Register a New User (Now Hashing Passwords)**
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: "✅ User registered successfully" });
    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ **Login User (Now Secure & Returns JWT)**
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "❌ Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "❌ Invalid credentials" });

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "2h" });
        res.json({ message: "✅ Login successful", token });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ **Protected Middleware (Verifies JWT)**
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "❌ Unauthorized, token missing" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId; // Store userId in request
        next();
    } catch (error) {
        return res.status(401).json({ message: "❌ Invalid token" });
    }
};

// ✅ **Submit a Prediction (Now Protected)**
app.post("/submit-prediction", authenticateUser, async (req, res) => {
    const { match, predictedWinner } = req.body;

    try {
        const prediction = new Prediction({ userId: req.userId, match, predictedWinner });
        await prediction.save();

        await User.findByIdAndUpdate(req.userId, { $push: { predictions: prediction._id } });

        res.json({ message: "✅ Prediction submitted successfully" });
    } catch (error) {
        console.error("❌ Prediction Submission Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ **Fetch Leaderboard (Fixed MongoDB Query)**
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
                                cond: { $eq: ["$$pred.result", "Won"] }, // ✅ Fixed Query
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
        console.error("❌ Leaderboard Fetch Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ **Fetch User's Prediction History (Now Protected)**
app.get("/user-history", authenticateUser, async (req, res) => {
    try {
        const predictions = await Prediction.find({ userId: req.userId });
        res.json(predictions);
    } catch (error) {
        console.error("❌ User History Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ **Start Server**
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
