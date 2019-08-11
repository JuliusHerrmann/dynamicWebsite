//Make connection
var socket = io.connect("https://partystartergame.herokuapp.com/");

//Get Variables
var URLParam = new URLSearchParams(window.location.search);
var ownId = URLParam.get("ownId");
var gameId = URLParam.get("gameId");
var clientName = URLParam.get("clientName");
var isHost = URLParam.get("host");

var question = document.getElementById("question"),
    options = document.getElementById("options"),
    accept = document.getElementById("accept"),
    acceptBtn = document.getElementById("acceptBtn"),
    acceptChallenge = document.getElementById("challenge"),
    acceptChallengeBtn = document.getElementById("acceptChallengeBtn");
    playerCount = 0,
    skip = document.getElementById("skip");

accept.style.visibility = "hidden";
acceptChallenge.style.visibility = "hidden";
skip.style.visibility = "hidden";

if(isHost == "true"){
    skip.style.visibility = "visible";
}

socket.on("receiveOptions", function(data){
    if(data.gameId == gameId){
        allOptions = data.options;
        options.innerHTML = "";
        //Populate answers
        var n = 0;
        allButtons = [];
        allOptions.forEach(oneOption => {
            options.innerHTML += "<button id=" + n + " class='optionButton'>" + oneOption + "</button>";
            n++;
        });
    
        for(var i = 0; i < n; i++){
            var button = document.getElementById(i);
            const value = button.id;
            button.addEventListener("click", function(){
                console.log("emitting answer: " + value);
                socket.emit("sendAnswer", {
                    gameId: gameId,
                    clientId: ownId,
                    answer: value
                });
            });
        }
    }
});

socket.on("drink", function(data){
    if(data.clientId == ownId){
        if(data.type == "drink"){
            console.log("I have to drink");
            accept.style.visibility = "visible";
        }else{
            console.log("I am the subject of an event!");
            acceptChallenge.style.visibility = "visible";
        }
    }
});

acceptBtn.addEventListener("click", function(){
    accept.style.visibility = "hidden";
    socket.emit("newRound", {
        gameId: gameId,
        clientId: ownId
    });
});

acceptChallengeBtn.addEventListener("click", function(){
    acceptChallenge.style.visibility = "hidden";
    socket.emit("newRound", {
        gameId: gameId,
        clientId: ownId
    });
});

skip.addEventListener("click", function(){
    socket.emit("skip",{
        gameId: gameId
    });
});

//skipQuestion
socket.on("skip", function(data){
    if(data.gameId == gameId){
        accept.style.visibility = "hidden";
        acceptChallenge.style.visibility = "hidden";
    }
});