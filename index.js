var express = require("express");
var socket = require("socket.io");

//App setup
var app = express()
var server = app.listen(4000, function(){
    console.log("Listening to port 4000");
});

//Static files
app.use(express.static("public"));

//track current games 
var allGames = [];

//Socket setup
var io = socket(server);

//Track current connections
var currentHosts = []
var stillConnectedHosts = [];
//Check what connections are still there, delete games if host is disconnected
//use setInterval(function, 3000) and setTimeout(function, 3000)

setInterval(function(){
    stillConnectedHosts = [];
    io.sockets.emit("checkIfOnline");
    setTimeout(function(){  
        console.log("connected hosts: " + currentHosts + "\nreally: " + stillConnectedHosts);
        currentHosts.forEach(host => {
            if(stillConnectedHosts.indexOf(host) == -1){
                console.log("Game closed with hostId: " + host);
                allGames.forEach(game => {
                    if(game.hostId == host){
                        io.sockets.emit("closeGame", {
                            gameId: game.gameId
                        });
                        allGames.splice(allGames.indexOf(game), 1);
                    }
                });
            }
        });
        console.log(allGames);
        currentHosts = stillConnectedHosts;

    }, 200);
}, 20000);

io.on("connection", function(socket){
    //console.log("made connection to " + socket.id);

    socket.on("stillConnected", function(data){
        stillConnectedHosts.push(data.hostId);
    });
    //Receive data and create a new game
    socket.on("newGame", function(data){
        currentHosts.push(data.hostId);
        allGames.push({
            gameId: data.gameId,
            hostId: data.hostId,
            clients: []
        });
    });

    //Join request for game
    socket.on("joinRequest", function(data){
        console.log(data.gameId);
        //Check if game exists with given gameId
        allGames.forEach(game => {
            if(game.gameId == data.gameId){
                var newPlayer = true;

                game.clients.forEach(client => {
                    if(client.name == data.clientName){
                        newPlayer = false;
                    }
                });

                if(newPlayer){         
                    //Game exists and name is not already given, add client to game
                    //console.log("Id found game id:" + game.gameId + " client to join: " + data.clientId);
                    //game.clientIds.push(data.clientId);
                    game.clients.push({
                        clientId: data.clientId,
                        name: data.clientName
                    });

                    //Respond to client, in this case the client can join
                    io.sockets.emit("response", {
                        canJoin: true,
                        clientId: data.clientId,
                        gameId: data.gameId
                    });

                    //Update player list
                    io.sockets.emit("updatePlayers", {
                        newClients: game.clients,
                        gameId: data.gameId
                    });
                }else{
                    //Respond to client, in this case the client can not join because the name is already given
                    io.sockets.emit("response", {
                        canJoin: false,
                        clientId: data.clientId,
                        gameId: data.gameId
                    });
                }
            }
        });
        //socket.disconnect();
    });

    //Start a new game
    socket.on("startGame", function(data){
        var allClients;

        allGames.forEach(game => {
            if(game.gameId == data.gameId){
                allClients = game.clients;
            }
        });

        io.sockets.emit("continueToGame", {
            gameId: data.gameId,
            clients: allClients
        });
    });

    socket.on("isOnline", function(data){
        allClients.push(data.clientId);
    });
    //Send / Emit data to every client !!!!! Different from socket.emit
    //io.sockets.emit("test", data);
});

var game = {
    gameId: 0,
    hostId: 0,
    clients: {
        clientId: 0,
        name: ""
    }
};