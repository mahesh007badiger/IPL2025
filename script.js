const API_URL = "https://ipl-predictions.onrender.com";


// Submit prediction
async function submitPrediction() {
    let name = document.getElementById("name").value;
    let match = document.getElementById("match").value;
    let winner = document.getElementById("winner").value;

    // Validate inputs
    if (!name || !match || !winner) {
        alert("All fields are required!");
        return;
    }

    // Submit prediction to the back-end
    let response = await fetch(`${API_URL}/submit-prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, match, winner }),
    });

    let result = await response.json();

    // Display result message
    alert(result.message);
}

// Fetch leaderboard and display it
async function fetchLeaderboard() {
    let response = await fetch(`${API_URL}/leaderboard`);
    let data = await response.json();

    // Get the table element and populate it with leaderboard data
    let table = document.getElementById("leaderboard");
    table.innerHTML = "<tr><th>Name</th><th>Matches Played</th><th>Matches Won</th><th>Winning %</th></tr>";

    data.forEach(player => {
        let row = table.insertRow();
        row.insertCell(0).innerText = player.name;
        row.insertCell(1).innerText = player.played;
        row.insertCell(2).innerText = player.won;
        row.insertCell(3).innerText = player.percentage + "%";
    });
}

// Refresh leaderboard when the page loads
document.addEventListener("DOMContentLoaded", function () {
    fetchLeaderboard();
});
