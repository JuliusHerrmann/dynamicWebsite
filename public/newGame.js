//Make connection
var socket = io.connect("localhost:4000");

//Get Variables
var URLParam = new URLSearchParams(window.location.search);
var ownId = URLParam.get("ownId");

var newGameId = document.getElementById("newGameId"),
    start = document.getElementById("start"),
    allPlayersList = document.getElementById("allPlayersList")
    playerCount = 0;

//Generate new GameId
var gameId = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
newGameId.innerText = "Neue ID: " + gameId;

//Create a new game on the server
socket.emit("newGame", {
    gameId: gameId,
    hostId: ownId
});

socket.on("checkIfOnline", function(){
    socket.emit("stillConnected",{
        hostId: ownId
    });
});

socket.on("updatePlayers", function(data){
    if(gameId == data.gameId){
        var newList = "";
        data.newClients.forEach(client => {
            newList += "<li class='playerName'>" + client.name + "</li>";
        });
        allPlayersList.innerHTML = newList;
    
        playerCount = data.newClients.length;
    }
});

start.addEventListener("click", function(){
    if(playerCount > 0){
        console.log("Start a new Game with id: " + gameId);
        socket.emit("startGame", {
            gameId: gameId
        });
        window.location.href = ("/host/game.html?ownId=" + ownId + "&gameId=" + gameId);
    }else{
        console.log("not enough players!");
    }
});