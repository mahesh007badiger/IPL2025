const API_URL = "http://localhost:5000"; // Update when deploying

async function submitPrediction() {
    let name = document.getElementById("name").value;
    let match = document.getElementById("match").value;
    let winner = document.getElementById("winner").value;

    if (!name || !match || !winner) {
        alert("All fields are required!");
        return;
    }

    let response = await fetch(`${API_URL}/submit-prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, match, winner }),
    });

    let result = await response.json();
    alert(result.message);
}

async function fetchLeaderboard() {
    let response = await fetch(`${API_URL}/leaderboard`);
    let data = await response.json();

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

// Fetch leaderboard when the page loads
fetchLeaderboard();
