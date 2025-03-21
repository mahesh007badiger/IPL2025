async function loadData() {
    let response = await fetch("data.json");
    return response.json();
}

async function submitPrediction() {
    let name = document.getElementById("name").value;
    let match = document.getElementById("match").value;
    let winner = document.getElementById("winner").value;

    if (!name) {
        alert("Enter your name!");
        return;
    }

    let data = await loadData();
    
    data.predictions.push({ name, match, winner });
    
    saveData(data);
}

function saveData(data) {
    let dataStr = JSON.stringify(data, null, 4);
    let blob = new Blob([dataStr], { type: "application/json" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.json";
    a.click();
}

async function updateLeaderboard() {
    let data = await loadData();
    
    let leaderboard = {};
    data.predictions.forEach(prediction => {
        if (!leaderboard[prediction.name]) {
            leaderboard[prediction.name] = { played: 0, won: 0 };
        }
        leaderboard[prediction.name].played++;
        if (data.results[prediction.match] === prediction.winner) {
            leaderboard[prediction.name].won++;
        }
    });

    let table = document.getElementById("leaderboard");
    table.innerHTML = "<tr><th>Name</th><th>Matches Played</th><th>Matches Won</th><th>Winning %</th></tr>";

    for (let player in leaderboard) {
        let row = table.insertRow();
        let played = leaderboard[player].played;
        let won = leaderboard[player].won;
        let percentage = played ? ((won / played) * 100).toFixed(2) : 0;
        
        row.insertCell(0).innerText = player;
        row.insertCell(1).innerText = played;
        row.insertCell(2).innerText = won;
        row.insertCell(3).innerText = percentage + "%";
    }
}

// Auto-load leaderboard on page load
updateLeaderboard();
