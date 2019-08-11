var socket = io.connect("https://partystartergame.herokuapp.com/");

//Get Variables
var URLParam = new URLSearchParams(window.location.search);
var ownId = URLParam.get("ownId");
var gameId = URLParam.get("gameId");
var clientName = URLParam.get("clientName");

var isHost = URLParam.get("host");

var nextButton = document.getElementById("start"),
    text = document.getElementById("host");

host.style.visibility = "hidden";
nextButton.style.visibility = "hidden";    

if(isHost == "true"){
    host.style.visibility = "visible";
    nextButton.style.visibility = "visible";
}
socket.on("continueToGame", function(data){
    //Check if current client is in game
    if(gameId == data.gameId){
        data.clients.forEach(client => {
            if(client.clientId == ownId){
                console.log(clientName + " joins game: " + data.gameId);
                window.location.href = ("/player/chooseAnswer.html?ownId=" + ownId + "&gameId=" + gameId + "&clientName=" + clientName) + "&host=" + isHost;
            }
        });
    }
});


socket.on("closeGame", function(data){
    if(data.gameId == gameId){
        console.log("game closed");
    }
});

nextButton.addEventListener("click", function(){
    socket.emit("requestStart", {
        gameId: gameId
    });
});


