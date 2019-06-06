
//Make connection
var socket = io.connect("http://192.168.0.206:4000");

//Get Variables
var URLParam = new URLSearchParams(window.location.search);
var ownId = URLParam.get("ownId");
var gameId = URLParam.get("gameId");

var question = document.getElementById("question"),
    a1 = document.getElementById("answer1"),
    a2 = document.getElementById("answer2"),
    a3 = document.getElementById("answer3"),
    a4 = document.getElementById("answer4"),
    event = document.getElementById("event");

socket.on("checkIfOnline", function(){
    socket.emit("stillConnected",{
        hostId: ownId
    });
    console.log("All answers: " + allAnswers.length);
});

function startTimer(question){
    totalClientsToDrink = 0;
    alreadyDrunk = 0;
    timerUp = false;
    console.log("StartTimer");
    setTimeout(function(){
        console.log("timer Ended");
        if(question.answer1 == undefined){
            timerEndedVoting(question);
        }else{
            timerEndedQuizz(question);
        }
    }, 15000);
}

var bestIndexes = [];
var worstIndexes = [];

var totalClientsToDrink = 0;

function timerEndedQuizz(question){
    timerUp = true;
    allAnswers.forEach(answer => {
        if(answer.answer != question.correct){
            socket.emit("drink", {
                clientId: answer.clientId,
                type: "drink"
            });
            totalClientsToDrink ++;
            var answerString = "";
            switch(question.correct){
                case 0:
                    answerString = question.answer1;
                    break;
                case 1:
                    answerString = question.answer2;
                    break;
                case 2:
                    answerString = question.answer3;
                    break;
                case 3:
                    answerString = question.answer4;
                    break;
            }
            question.innerHTML = "Die richtige Antwort war: " + answerString;
            drink.innerHTML = answerString;
        }
    });

    if(totalClientsToDrink == 0){
        newQuestion();
    }
}

function timerEndedVoting(question){
    timerUp = true;
    bestIndexes = [];
    worstIndexes = [];
    //Evaluate results
    var answersCount = [];
    for(var i = 0; i < allAnswers.length; i++){
        answersCount.push(0);
    }
    allAnswers.forEach(answer => {
        answersCount[answer.answer] += 1;
    });
    var endText = question.text + "\n";
    
    if(question.drink == "first"){
        var highestCount = -1;

        var i = 0;
        answersCount.forEach(count => {
            if(count > highestCount){
                bestIndexes = [i];
                highestCount = count;
            }else if(count == highestCount){
                bestIndexes.push(i)
            }
            i++;
        });
        bestIndexes.forEach(index => {
            socket.emit("drink", {
                clientId: clients[index].clientId,
                type: "drink"
            });
            totalClientsToDrink ++;
            endText += (clients[index].name + ",");
        });
    }else{
        var lowestCount = answersCount.length + 1;

        i = 0;
        answersCount.forEach(count => {
            if(count < lowestCount){
                worstIndexes = [i];
                lowestCount = count;
            }else if(count == lowestCount){
                worstIndexes.push(i)
            }
            i++;
        });
        worstIndexes.forEach(index => {
            socket.emit("drink", {
                clientId: clients[index].clientId,
                type: "drink"
            });
            endText += (clients[index].name + ",");
            totalClientsToDrink ++;
        });
    }

    drink.innerHTML = endText;
}

//Get a list of all players
var clients = [];

socket.emit("requestPlayers",{
    gameId: gameId
});

socket.on("sendPlayers",function(data){
    clients = data.clients;
    newQuestion();
});

var allAnswers = [];
var timerUp = true;

socket.on("receiveAnswer", function(data){
    if(data.gameId == gameId){
        if(!timerUp){
            var found = false;
            allAnswers.forEach(a => {
                if(data.clientId == a.clientId){
                    a.answer = data.answer;
                    found = true;
                }
            });
        
            if(!found){
                allAnswers.push({
                    clientId: data.clientId,
                    answer: data.answer
                });
            }
        }
    }
});

var alreadyDrunk = 0;

socket.on("newRound",function(data){
    alreadyDrunk ++;
    console.log("receive");
    if(timerUp && alreadyDrunk == totalClientsToDrink){
        if(data.gameId == gameId){
            newQuestion();
        }
    }
});

var newQ;

function newQuestion(){
    setTimeout(function(){
        allAnswers = [];
        drink.innerHTML = "";
        event.innerHTML = "";
        //Event
        if(Math.random() > 0.5){
            totalClientsToDrink = 1;
            alreadyDrunk = 0;
            var newEvent = events[Math.floor(Math.random() * events.length)];
            var possibleClients = shuffle(clients);
            event.innerHTML = newEvent.text.format(possibleClients[0].name, possibleClients[1].name);
            a1.innerText = "";
            a2.innerText = "";
            a3.innerText = "";
            a4.innerHTML = "";
            socket.emit("drink", {
                clientId: possibleClients[0].clientId,
                type: "event"
            });
        }else{
        //No event
        newQ = questions[Math.floor(Math.random() * questions.length)];
        console.log(questions.indexOf(newQ));
        question.innerText = newQ.question;
        //Quizz
        if(newQ.answer1 != undefined){
            a1.innerText = newQ.answer1;
            a2.innerText = newQ.answer2;
            a3.innerText = newQ.answer3;
            a4.innerHTML = newQ.answer4;

            socket.emit("sendOptions", {
                gameId: gameId,
                options: [newQ.answer1, newQ.answer2, newQ.answer3, newQ.answer4]
            });        
            startTimer(newQ);
            }else{
                //Voting
                a1.innerText = "";
                a2.innerText = "";
                a3.innerText = "";
                a4.innerHTML = "";
                var clientNames = [];
                clients.forEach(client => {
                    clientNames.push(client.name);
                });
                socket.emit("sendOptions", {
                    gameId: gameId,
                    options: clientNames
                });
            
                startTimer(newQ);
            }
        }
    }, 500);
}

//Shuffle
function shuffle(input) {
    var array = input;
    array.sort(() => Math.random() - 0.5);
    return array;
}

//Format String
String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

var questions = [{
    question: "Wer hat den kürzesten?",
    text:"Ihr wohl nicht, trinkt!",
    drink:"last"
},{
    question: "Wer ist der dümmste?",
    text:"Ihr seid so dumm ihr müsst erst mal trinken, kann ja eh nichts verloren gehen.",
    drink:"first"
},{
    question: "Was ist eine Lyoner?",
    answer1:"Süßigkeit",
    answer2:"Wurst",
    answer3:"Auto",
    answer4:"Spielzeug",
    correct:1
},{
    question: "Was ist der höchste Berg?",
    answer1:"ME",
    answer2:"Nein",
    answer3:"NEIN2",
    answer4:"NEin 3",
    correct:0
}];

var events = [{
    text: "{0} muss sein/ihr Glas leer trinken! Viel Spaß!"
},{
    text: "{0} muss allen ein Video zeigen. Falls keiner lacht muss er/sie einen Schluck trinken."
}];