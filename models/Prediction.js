const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    match: { type: String, required: true },
    predictedWinner: { type: String, required: true },
    actualWinner: { type: String, default: "" },
    result: { type: String, default: "Pending" }, // "Won", "Lost", "Pending"
});

module.exports = mongoose.model("Prediction", predictionSchema);
