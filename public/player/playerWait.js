var socket = io.connect("http://localhost:4000");

//Get Variables
var URLParam = new URLSearchParams(window.location.search);
var ownId = URLParam.get("ownId");
var gameId = URLParam.get("gameId");
var clientName = URLParam.get("clientName");

socket.on("continueToGame", function(data){
    //Check if current client is in game
    if(gameId == data.gameId){
        data.clients.forEach(client => {
            if(client.clientId == ownId){
                console.log(clientName + " joins game: " + data.gameId);
            }
        });
    }
});