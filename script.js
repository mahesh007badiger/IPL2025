const API_URL = "https://ipl-predictions.onrender.com";

// Registration function
async function registerUser() {
    let name = document.getElementById("reg-name").value;
    let email = document.getElementById("reg-email").value;
    let password = document.getElementById("reg-password").value;

    // Validate inputs
    if (!name || !email || !password) {
        alert("All fields are required for registration!");
        return;
    }

    // Submit registration to the back-end
    let response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
    });

    let result = await response.json();

    // Display result message
    alert(result.message);

    // Redirect to login page or prediction page after registration
    if (response.ok) {
        window.location.href = "login.html"; // Redirect to login page
    }
}

// Login function
async function loginUser() {
    let email = document.getElementById("login-email").value;
    let password = document.getElementById("login-password").value;

    // Validate inputs
    if (!email || !password) {
        alert("Email and password are required!");
        return;
    }

    // Submit login to the back-end
    let response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    let result = await response.json();

    // Display result message
    alert(result.message);

    // Redirect to prediction page after successful login
    if (response.ok) {
        localStorage.setItem("userToken", result.token); // Store token for future requests
        window.location.href = "predictions.html"; // Redirect to predictions page
    }
}

// Submit prediction (updated to include user token)
async function submitPrediction() {
    let match = document.getElementById("match").value;
    let winner = document.getElementById("winner").value;
    let token = localStorage.getItem("userToken");

    // Validate inputs
    if (!match || !winner || !token) {
        alert("All fields are required, and you must be logged in!");
        return;
    }

    // Submit prediction to the back-end
    let response = await fetch(`${API_URL}/submit-prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ match, winner }),
    });

    let result = await response.json();

    // Display result message
    alert(result.message);
}

// Fetch leaderboard and display it (updated to include user history)
async function fetchLeaderboard() {
    let token = localStorage.getItem("userToken");

    // Fetch leaderboard data
    let response = await fetch(`${API_URL}/leaderboard`, {
        headers: { "Authorization": `Bearer ${token}` },
    });
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

    // Fetch user history
    let historyResponse = await fetch(`${API_URL}/user-history`, {
        headers: { "Authorization": `Bearer ${token}` },
    });
    let historyData = await historyResponse.json();

    // Display user history
    let historyTable = document.getElementById("user-history");
    historyTable.innerHTML = "<tr><th>Match</th><th>Predicted Winner</th><th>Actual Winner</th><th>Result</th></tr>";

    historyData.forEach(entry => {
        let row = historyTable.insertRow();
        row.insertCell(0).innerText = entry.match;
        row.insertCell(1).innerText = entry.predictedWinner;
        row.insertCell(2).innerText = entry.actualWinner;
        row.insertCell(3).innerText = entry.result;
    });
}

// Refresh leaderboard and user history when the page loads
document.addEventListener("DOMContentLoaded", function () {
    fetchLeaderboard();
});
