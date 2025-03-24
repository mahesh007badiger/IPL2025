const API_URL = "https://ipl-predictions.onrender.com";

// Toggle between login and register forms
function toggleAuth() {
    document.getElementById("login-section").style.display = 
        document.getElementById("login-section").style.display === "none" ? "block" : "none";
    document.getElementById("register-section").style.display = 
        document.getElementById("register-section").style.display === "none" ? "block" : "none";
}

// Register User
async function register() {
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    alert(data.message);
}

// Login User
async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.token) {
        localStorage.setItem("token", data.token);
        loadDashboard();
    } else {
        alert(data.message);
    }
}

// Load Dashboard after Login
async function loadDashboard() {
    const token = localStorage.getItem("token");
    if (!token) return;

    document.getElementById("auth-container").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    // Fetch Leaderboard
    const leaderboardRes = await fetch(`${API_BASE}/leaderboard`);
    const leaderboardData = await leaderboardRes.json();
    document.getElementById("leaderboard").querySelector("tbody").innerHTML = leaderboardData.map(
        user => `<tr><td>${user.name}</td><td>${user.won}</td><td>${user.percentage.toFixed(2)}%</td></tr>`
    ).join("");

    // Fetch User History
    const historyRes = await fetch(`${API_BASE}/user-history`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const historyData = await historyRes.json();
    document.getElementById("user-history").innerHTML = historyData.map(
        pred => `<li>${pred.match} - ${pred.predictedWinner} (${pred.result})</li>`
    ).join("");

    // Fetch IPL Schedule & Show Today’s Match
    const scheduleRes = await fetch(`${API_BASE}/schedule`);
    const scheduleData = await scheduleRes.json();
    const todayMatch = scheduleData.find(match => match.date === new Date().toISOString().split("T")[0]);

    if (todayMatch) {
        document.getElementById("match-info").innerText = `${todayMatch.team1} vs ${todayMatch.team2}`;
        document.getElementById("team-selection").innerHTML = `
            <option value="${todayMatch.team1}">${todayMatch.team1}</option>
            <option value="${todayMatch.team2}">${todayMatch.team2}</option>
        `;
    } else {
        document.getElementById("match-info").innerText = "No match today!";
    }
}

// Submit Prediction
async function submitPrediction() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const match = document.getElementById("match-info").innerText;
    const predictedWinner = document.getElementById("team-selection").value;

    const res = await fetch(`${API_BASE}/submit-prediction`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ match, predictedWinner })
    });

    const data = await res.json();
    alert(data.message);
}

// Logout
function logout() {
    localStorage.removeItem("token");
    window.location.reload();
}

// Auto Load Dashboard if Logged In
if (localStorage.getItem("token")) loadDashboard();
