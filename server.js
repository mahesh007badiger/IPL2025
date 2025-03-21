require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const dbURI = process.env.MONGO_URI || "mongodb://localhost:27017/ipl_predictions"; // Replace with MongoDB Atlas URI
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB connection error:", err));

// Define Prediction Schema
const predictionSchema = new mongoose.Schema({
  name: String,
  match: String,
  winner: String
});

// Define Result Schema
const resultSchema = new mongoose.Schema({
  match: String,
  winner: String
});

// Define Leaderboard Schema
const leaderboardSchema = new mongoose.Schema({
  name: String,
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 }
});

// Models
const Prediction = mongoose.model("Prediction", predictionSchema);
const Result = mongoose.model("Result", resultSchema);
const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);

// Routes

// Submit a match prediction
app.post("/submit-prediction", async (req, res) => {
  const { name, match, winner } = req.body;
  if (!name || !match || !winner) return res.status(400).json({ error: "Missing fields" });

  try {
    const newPrediction = new Prediction({ name, match, winner });
    await newPrediction.save();
    res.json({ success: true, message: "Prediction saved!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save prediction" });
  }
});

// Submit match result (no admin authentication)
app.post("/submit-result", async (req, res) => {
  const { match, winner } = req.body;

  // Validate match and winner
  if (!match || !winner) return res.status(400).json({ error: "Missing fields" });

  try {
    // Save match result
    const newResult = new Result({ match, winner });
    await newResult.save();

    // Update leaderboard based on predictions
    const predictions = await Prediction.find({ match });

    predictions.forEach(async (prediction) => {
      if (prediction.winner === winner) {
        await Leaderboard.findOneAndUpdate(
          { name: prediction.name },
          { $inc: { played: 1, won: 1 } },
          { upsert: true }
        );
      } else {
        await Leaderboard.findOneAndUpdate(
          { name: prediction.name },
          { $inc: { played: 1 } },
          { upsert: true }
        );
      }
    });

    res.json({ success: true, message: "Match result saved!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save result" });
  }
});

// Get leaderboard
app.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find().sort({ percentage: -1 });

    // Calculate winning percentage
    leaderboard.forEach(player => {
      player.percentage = player.played ? ((player.won / player.played) * 100).toFixed(2) : 0;
    });

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
