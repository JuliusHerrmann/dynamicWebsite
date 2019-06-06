//Make connection
var socket = io.connect("http://192.168.0.206:4000");

//Get Variables
var URLParam = new URLSearchParams(window.location.search);
var ownId = URLParam.get("ownId");
var gameId = URLParam.get("gameId");
var clientName = URLParam.get("clientName");

var question = document.getElementById("question"),
    options = document.getElementById("options"),
    accept = document.getElementById("accept");
    playerCount = 0;

accept.style.visibility = "hidden";

socket.on("receiveOptions", function(data){
    if(data.gameId == gameId){
        allOptions = data.options;
        options.innerHTML = "";
        //Populate answers
        var n = 0;
        allOptions.forEach(oneOption => {
            options.innerHTML += "<button id=" + n + ">" + oneOption + "</button>";
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
        accept.style.visibility = "visible";
        if(data.type == "drink"){
            console.log("I have to drink");
        }else{
            console.log("I am the subject of an event!");
        }
    }
});

accept.addEventListener("click", function(){
    accept.style.visibility = "hidden";
    socket.emit("newRound", {
        gameId: gameId
    });
});