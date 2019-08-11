//Make connection
var socket = io.connect("192.168.0.123:4000");

var newGame = document.getElementById("newGame");
var joinGameInput = document.getElementById("joinGameInput");
var joinGame = document.getElementById("joinGame");
var clientName = document.getElementById("clientName");
var content = document.getElementById("content");

var ownId = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;

var isHost = false;

newGame.addEventListener("click", function(){
    window.location.href = ("/newGame.html?ownId=" + ownId); //&gameId=gameId
});

joinGame.addEventListener("click", function(){
    console.log("name is: " + clientName.value);
    if(clientName.value != ""){
        var requestedId = joinGameInput.value;
        console.log(requestedId);
        socket.emit("joinRequest", {
            clientId: ownId,
            gameId: requestedId,
            clientName: clientName.value
        });
        console.log(ownId);
    }else{
        console.log("Namen eingeben");
    }
});

socket.on("makeHost", function(data){
    if(data.clientId == ownId){
        console.log("I'm the host");
        isHost = true;
    }
});

//Response from server wether the client is allowed to join
socket.on("response", function(data){
    if(data.clientId == ownId){
        if(data.canJoin == true){
             //Joined successfully, proceed to game
             console.log("game joined successfully: " + data.gameId + " clientId: " + data.clientId);
             var gameId = data.gameId;
             window.location.href = ("/player/playerWait.html?ownId=" + ownId + "&gameId=" + gameId + "&clientName=" + clientName.value + "&host=" + isHost);
        }else{
            //Name already in use
            console.log("Name in use, Error");
        }
           
    }
});