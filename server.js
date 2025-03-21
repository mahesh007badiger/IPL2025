require('dotenv').config();
const express = require("express");
const fs = require("fs");
const cors = require("cors");
// const dotenv = require('dotenv').config();


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = "data.json";

// Read data.json or create an empty one if it doesn’t exist
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ predictions: [], results: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

// Save data to JSON
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/**
 * Submit a match prediction
 */
app.post("/submit-prediction", (req, res) => {
    const { name, match, winner } = req.body;
    if (!name || !match || !winner) return res.status(400).json({ error: "Missing fields" });

    let data = readData();
    data.predictions.push({ name, match, winner });
    writeData(data);

    res.json({ success: true, message: "Prediction saved!" });
});

/**
 * Fetch all predictions
 */
app.get("/get-predictions", (req, res) => {
    const data = readData();
    res.json(data.predictions);
});

/**
 * Submit match results
 */
app.post("/submit-result", (req, res) => {
    const { match, winner } = req.body;
    if (!match || !winner) return res.status(400).json({ error: "Missing fields" });

    let data = readData();
    data.results.push({ match, winner });
    writeData(data);

    res.json({ success: true, message: "Match result saved!" });
});

/**
 * Fetch leaderboard
 */
app.get("/leaderboard", (req, res) => {
    let data = readData();
    let leaderboard = {};

    data.predictions.forEach(({ name, match, winner }) => {
        if (!leaderboard[name]) leaderboard[name] = { played: 0, won: 0 };
        leaderboard[name].played++;

        let actualResult = data.results.find(r => r.match === match);
        if (actualResult && actualResult.winner === winner) {
            leaderboard[name].won++;
        }
    });

    let leaderboardArray = Object.entries(leaderboard).map(([name, stats]) => ({
        name,
        played: stats.played,
        won: stats.won,
        percentage: stats.played ? ((stats.won / stats.played) * 100).toFixed(2) : 0,
    }));

    res.json(leaderboardArray);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
