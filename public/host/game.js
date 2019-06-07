
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
    event = document.getElementById("event"),
    timer = document.getElementById("timer");

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
    changeClock(15, question);
}

function changeClock(seconds, question){
    timer.innerHTML = seconds + "s";
    setTimeout(function(){
        seconds --;
        timer.innerHTML = seconds + "s";
        if(seconds > 0){
            changeClock(seconds, question);
        }else{
            Evaluate(question);
        }
    },1000)
}

function Evaluate(question){
    console.log("timer Ended");
    if(question.answer1 == undefined){
        timerEndedVoting(question);
    }else{
        timerEndedQuizz(question);
    }
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

    if(totalClientsToDrink == 0){
        newQuestion();
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
        timer.innerHTML = "";
        //Event
        if(Math.random() > 0.5){
            totalClientsToDrink = 1;
            alreadyDrunk = 0;
            var newEvent = events[Math.floor(Math.random() * events.length)];
            var possibleClients = shuffle(clients);
            event.innerHTML = newEvent.text.format(possibleClients[0].name, possibleClients[1].name);
            question.innerHTML = "";
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
    question: "Wer kann am schlechtesten singen?",
    text:"Ihr könnt ja nicht mal singen... aber hoffentlich trinken!",
    drink:"first"
},{
    question: "Wer ist der dümmste?",
    text:"Ihr seid so dumm ihr müsst erst mal trinken, kann ja eh nichts verloren gehen.",
    drink:"first"
},{
    question: "Wer ist der größte Mitspieler?",
    text:"Der oder die größten im Raum müssen trinken, da passt ja auch mehr rein!",
    drink:"first"
},{
    question: "Wer ist der dümmste?",
    text:"Ihr seid wohl nicht die dümmsten aber dürft trotzdem trinken!",
    drink:"last"
},{
    question: "Wer sieht am besten aus?",
    text:"Dafür dass du so gut aussiehst musst du trinken!",
    drink:"first"
},{
    question: "Wer ist der schlauste?",
    text:"Nur weil du schlau bist musst du trinken!",
    drink:"first"
},{
    question: "Wer ist der beste in der Schule?",
    text:"Trink, streber!",
    drink:"first"
},{
    question: "Wer ist der stärkste?",
    text:"Alle schwächlinge müssen trinken!",
    drink:"last"
},{
    question: "Wer kann die meisten Sprachen sprechen?",
    text:"Du darfst was trinken, superhirn!",
    drink:"first"
},{
    question: "Wer ist schon am betrunkensten?",
    text:"Zum aufholen müssen alle anderen trinken, langweiler!",
    drink:"last"
},{
    question: "Wer ist der schnellste?",
    text:"Dann kannst du auch schnell mal was trinken!",
    drink:"first"
},{
    question: "Wer sieht am schlechtesten aus?",
    text:"Aus Mitleid trinken jetzt alle anderen!",
    drink:"last"
},{
    question: "Wer ist der erfolgreichste?",
    text:"Hoffentlich bist du auch erfolgreich beim Trinken!",
    drink:"first"
},{
    question: "Wer ist am sportlichsten?",
    text:"Der sportlichste trinkt nicht, denn Alkohol ist nicht gut für sportler!",
    drink:"last"
},{
    question: "Was ist eine Lyoner?",
    answer1:"Süßigkeit",
    answer2:"Wurst",
    answer3:"Spiel",
    answer4:"Spielzeug",
    correct:1
},{
    question: "Was ist der höchste Berg?",
    answer1:"Mount Everest",
    answer2:"Mont Blanc",
    answer3:"Zugspitze",
    answer4:"Großglockner",
    correct:0
},{
    question: "Wer war der erste Präsident der USA?",
    answer1:"James Monroe",
    answer2:"James Madison",
    answer3:"Abraham Lincoln",
    answer4:"George Washington",
    correct:3
},{
    question: "Wer ist der reichste Mensch der Welt?",
    answer1:"Warren Buffet",
    answer2:"Mark Zuckerberg",
    answer3:"Jeff Bezos",
    answer4:"Elon Musk",
    correct:2
},{
    question: "Wer ist der größte Mensch der Welt?",
    answer1:"John William Rogan",
    answer2:"Robert Wadlow",
    answer3:"Leonid Stadnyk",
    answer4:"Ajaz Ahmed",
    correct:1
},{
    question: "Wer war Albert Einstein?",
    answer1:"Mathematiker",
    answer2:"Physiker",
    answer3:"Schriftsteller",
    answer4:"Schauspieler",
    correct:1
},{
    question: "Wo liegt Reims?",
    answer1:"Frankreich",
    answer2:"Deutschland",
    answer3:"England",
    answer4:"Luxembourg",
    correct:0
},{
    question: "Was wird Tee genannt?",
    answer1:"Eine Kampfsportart",
    answer2:"Eine besondere Teekanne",
    answer3:"Stift aus Holz/Plastik",
    answer4:"Ein Buch",
    correct:2
},{
    question: "Was erzeugt beim Auto bei der Fahrt Strom?",
    answer1:"Bremse",
    answer2:"Lenkung",
    answer3:"Lichtmaschine",
    answer4:"Antenne",
    correct:2
},{
    question: "Welche Fabe haben die Schlümpfe?",
    answer1:"Rot",
    answer2:"Blau",
    answer3:"Gelb",
    answer4:"Grün",
    correct:1
},{
    question: "Welchen Sport spielt Steffi Graf?",
    answer1:"Fußball",
    answer2:"Handball",
    answer3:"Golf",
    answer4:"Tennis",
    correct:3
},{
    question: "Wie viele Mainzelmänner gibt es?",
    answer1:"3",
    answer2:"5",
    answer3:"6",
    answer4:"7",
    correct:2
},{
    question: "Wie hoch ist der Mount Everest?",
    answer1:"9.283 meter",
    answer2:"7.234 meter",
    answer3:"8.848 meter",
    answer4:"8.711 meter",
    correct:2
},{
    question: "Wie hoch ist die Zugspitze?",
    answer1:"2.962 meter",
    answer2:"3.162 meter",
    answer3:"2.781 meter",
    answer4:"3.891 meter",
    correct:0
},{
    question: "Welches Land grenzt nicht an Ungarn?",
    answer1:"Polen",
    answer2:"Rumänien",
    answer3:"Slowakei",
    answer4:"Kroatien",
    correct:0
},{
    question: "Wie viele Nachbarländer hat Deutschland?",
    answer1:"7",
    answer2:"8",
    answer3:"9",
    answer4:"10",
    correct:2
},{
    question: "Welches Land grenzt nicht an Deutschland?",
    answer1:"Tschechien",
    answer2:"Belgien",
    answer3:"Ungarn",
    answer4:"Dänemark",
    correct:2
},{
    question: "Wie viele Menschen gibt es?",
    answer1:"7,5 Mrd",
    answer2:"6 Mrd",
    answer3:"9 Mrd",
    answer4:"8,3 Mrd",
    correct:0
}];

var events = [{
    text: "{0} muss sein/ihr Glas leer trinken! Viel Spaß!"
},{
    text: "{0} muss allen ein Video zeigen. Falls keiner lacht muss er/sie einen Schluck trinken."
},{
    text: "{0} muss allen eine peinliche Story erzählen oder trinken."
},{
    text: "{0} muss aus dem Glas von {1} einen Schluck trinken."
},{
    text: "{0} muss sagen auf wen er/sie steht oder trinken."
},{
    text: "{0} muss allen ein Kompliment machen oder trinken."
},{
    text: "{0} muss einen lustigen Text in seine/ihre Story machen oder trinken. {1} darf sich den Text ausdenken."
},{
    text: "{0} darf aussuchen wer trinken muss."
},{
    text: "{0} darf 2 Schlücke verteilen."
},{
    text: "{0} darf 5 Schlücke verteilen."
},{
    text: "{0} darf für die nächsten 5 Runden nicht reden. Beim Verstoß muss getrunken werden."
},{
    text: "{0} darf für 10 Runden keinen Namen mehr sagen. Beim Verstoß muss getrunken werden."
},{
    text: "{0} darf den Namen von {1} für 5 Runden nicht mehr sagen. Beim Verstoß muss getrunken werden."
},{
    text: "{0} muss einen Handstand machen oder trinken."
},{
    text: "{0} darf auswählen wer sein Glas leer trinken muss."
}];