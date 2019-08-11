//Make connection
var socket = io.connect("https://partystartergame.herokuapp.com/");

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
    timer = document.getElementById("timer"),
    names = document.getElementById("names");

timer.classList.add('notransition');
timer.style.backgroundColor = "lightgreen";
timer.offsetHeight;
timer.classList.remove('notransition');

var answerCol = a1.style.backgroundColor;

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
    timer.style.width = "93.4%";
    timer.style.backgroundColor = "red";
    setTimeout(function(){
        seconds --;
        var startWidthTimer = timer.style.width;
        if(seconds > 0){
            changeClock(seconds, question);
            var w = 6.6 * (seconds - 1);
            timer.style.width = w.toString() + "%";
        }else{
            Evaluate(question);
            timer.style.width = "0%";
            timer.classList.add('notransition');
            timer.style.backgroundColor = "lightgreen";
            timer.offsetHeight;
            timer.classList.remove('notransition');
        }
    },1000);
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
            document.getElementById(answer.clientId).style.backgroundColor = "red";
            totalClientsToDrink ++;
        }
    });
    switch(question.correct){
        case 0:
            a1.style.backgroundColor = "green";
            break;
        case 1:
            a2.style.backgroundColor = "green";
            break;
        case 2:
            a3.style.backgroundColor = "green";
            break;
        case 3:
            a4.style.backgroundColor = "green";
            break;
    }

    if(totalClientsToDrink == 0){
        newQuestion();
    }
}

function timerEndedVoting(question){
    drink.innerHTML = question.text;
    drink.style.visibility = "visible";
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
            document.getElementById(clients[index].clientId).style.backgroundColor = "red";
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
            totalClientsToDrink ++;
            document.getElementById(clients[index].clientId).style.backgroundColor = "red";
        });
    }

    if(totalClientsToDrink == 0){
        newQuestion();
    }
}

//Get a list of all players
var clients = [];

socket.emit("requestPlayers",{
    gameId: gameId
});

var playerNames = [];

socket.on("sendPlayers",function(data){
    clients = data.clients;
    newQuestion();
    clients.forEach(client => {
        names.innerHTML += "<li id='" + client.clientId + "' class='playerName'>" + client.name + "</li>";
        playerNames.push(document.getElementById(client.clientId));
    });
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
    console.log(data.clientId);
    document.getElementById(data.clientId).style.background = "none";
    console.log("receive");
    if(timerUp && alreadyDrunk == totalClientsToDrink){
        if(data.gameId == gameId){
            newQuestion();
        }
    }
});

var newQ;
var first = true;

var questionsCopy;

function newQuestion(){
    setTimeout(function(){
        timer.style.width = "100%";
        allAnswers = [];
        drink.innerHTML = "";
        event.innerHTML = "";
        timer.innerHTML = "";
        drink.style.visibility = "hidden";
        a1.style.backgroundColor = answerCol;
        a2.style.backgroundColor = answerCol;
        a3.style.backgroundColor = answerCol;
        a4.style.backgroundColor = answerCol;

        if(first){
            questionsCopy = questions;
            //Event
            totalClientsToDrink = 1;
            alreadyDrunk = 0;
            var newEvent = ekelglas[0];
            var possibleClients = shuffle(clients);
            question.innerHTML = newEvent.text.format(possibleClients[0].name, possibleClients[1].name);
            //question.innerHTML = "";
            a1.style.visibility = "hidden";
            a2.style.visibility = "hidden";
            a3.style.visibility = "hidden";
            a4.style.visibility = "hidden";
            socket.emit("drink", {
                clientId: possibleClients[0].clientId,
                type: "event"
            });
            first = false;
            return;
        }
        var randomVal = Math.random();
        if(randomVal > 0.6){
            totalClientsToDrink = 1;
            alreadyDrunk = 0;
            var newEvent;
            if(randomVal > 0.90){
                //Ekelglas
                newEvent = ekelglas[1];
            }else{
                //Event
                newEvent = events[Math.floor(Math.random() * events.length)]
            }
            var possibleClients = shuffle(clients);
            question.innerHTML = newEvent.text.format(possibleClients[0].name, possibleClients[1].name);
            //question.innerHTML = "";
            a1.style.visibility = "hidden";
            a2.style.visibility = "hidden";
            a3.style.visibility = "hidden";
            a4.style.visibility = "hidden";
            socket.emit("drink", {
                clientId: possibleClients[0].clientId,
                type: "event"
            });
        }else{
        //No event
        var rand = Math.floor(Math.random() * questionsCopy.length);
        newQ = questionsCopy[rand];
        console.log(questions.indexOf(newQ));
        question.innerText = newQ.question;
        //Quizz
        if(newQ.answer1 != undefined){
            a1.innerText = newQ.answer1;
            a2.innerText = newQ.answer2;
            a3.innerText = newQ.answer3;
            a4.innerHTML = newQ.answer4;
            a1.style.visibility = "visible";
            a2.style.visibility = "visible";
            a3.style.visibility = "visible";
            a4.style.visibility = "visible";

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
                a1.style.visibility = "hidden";
                a2.style.visibility = "hidden";
                a3.style.visibility = "hidden";
                a4.style.visibility = "hidden";
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
            //Remove question from possible questions
            questionsCopy.splice(rand, 1);
        }
    }, 500);
}

//skipQuestion
socket.on("skip", function(data){
    if(gameId == data.gameId){
        alreadyDrunk = totalClientsToDrink;
        playerNames.forEach(player => {
            player.style.background = "none";            
        });
        newQuestion();
    }
});

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

var ekelglas = [{
    text: "Das Ekelglas wird in der Mitte der Runde eingeführt. {0} und {1} fangen jeweils an ein Bisschen eines Alkohols ihrer Wahl hinzuzugeben. Trinkt jemand es leer darf derjenige es auffüllen."
},{
    text: "{0} darf ein bisschen von einem beliebigen Getränk in das Ekelglas geben. Ist es schon voll muss zuerst ein bisschen daraus getrunken werden."
}];

var questions = [{
    question: "Wer kann am schlechtesten singen?",
    text:"Ihr könnt ja nicht mal singen... aber hoffentlich trinken!",
    drink:"first"
},{
    question: "Wer ist der Dümmste?",
    text:"Ihr seid so dumm, ihr müsst erst mal trinken. Kann ja eh nichts verloren gehen.",
    drink:"first"
},{
    question: "Wer ist der größte Mitspieler?",
    text:"Der oder die Größten im Raum müssen trinken, da passt ja auch mehr rein!",
    drink:"first"
},{
    question: "Wer ist der Dümmste?",
    text:"Ihr seid wohl nicht die Dümmsten aber dürft trotzdem trinken!",
    drink:"last"
},{
    question: "Wer sieht am besten aus?",
    text:"Dafür, dass du so gut aussiehst, musst du trinken!",
    drink:"first"
},{
    question: "Wer ist der Schlauste?",
    text:"Nur, weil du schlau bist, musst du trinken!",
    drink:"first"
},{
    question: "Wer ist der Beste in der Schule?",
    text:"Trink, Streber!",
    drink:"first"
},{
    question: "Wer ist der Stärkste?",
    text:"Alle Schwächlinge müssen trinken!",
    drink:"last"
},{
    question: "Wer kann die meisten Sprachen sprechen?",
    text:"Du darfst was trinken, Superhirn!",
    drink:"first"
},{
    question: "Wer ist schon am betrunkensten?",
    text:"Zum Aufholen müssen alle Anderen trinken, Langweiler!",
    drink:"last"
},{
    question: "Wer ist der Schnellste?",
    text:"Dann kannst du auch schnell mal was trinken!",
    drink:"first"
},{
    question: "Wer sieht am schlechtesten aus?",
    text:"Aus Mitleid trinken jetzt alle anderen!",
    drink:"last"
},{
    question: "Wer ist der Erfolgreichste?",
    text:"Hoffentlich bist du auch erfolgreich beim Trinken!",
    drink:"first"
},{
    question: "Wer ist am sportlichsten?",
    text:"Der Sportlichste trinkt nicht, denn Alkohol ist nicht gut für Sportler!",
    drink:"last"
},{
    question: "Wer isst am meisten??",
    text:"Hoffentlich kannst du auch viel trinken.",
    drink:"first"
},{
    question: "Wer ist am hässlichsten?",
    text:"Du bist wohl echt hässlich, vielleicht hilft ja trinken!",
    drink:"first"
},{
    question: "Wer ist am Dicksten?",
    text:"In dicke Leute passt auch mehr rein ...Hoffentlich...!",
    drink:"first"
},{
    question: "Wer ist am nervigsten?",
    text:"Vielleicht nervst du ja weniger wenn du betrunken bist!",
    drink:"first"
},{
    question: "Wer jammert am meisten?",
    text:"Nicht jammern, TRINKEN!",
    drink:"first"
},{
    question: "Wer macht die schlechtesten Witze?",
    text:"Willst du auch noch einen Witz darüber machen dass du trinken musst?",
    drink:"first"
},{
    question: "Wer macht die besten Witze?",
    text:"Tja trinken ist noch lustiger!",
    drink:"first"
},{
    question: "Wer sollte definitiv noch mehr trinken?",
    text:"Tja, hier wird nicht halb lang gemacht!",
    drink:"first"
},{
    question: "Wer hat noch zu wenig getrunken?",
    text:"Auf geht's, 3 Schlücke TRINKEN!",
    drink:"first"
},{
    question: "Wer verträgt am wenigsten?",
    text:"Naja wir verschonen diese unglücklichen Leute mal. Die anderen trinken!",
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
    answer1:"Bill Gates",
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
    answer3:"Ein Stift aus Plastik",
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
    question: "Welche Farbe haben die Schlümpfe?",
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
},{
    question: "Nach wie vielen gegessenen Bananen darf man aufgrund des Alkohols kein auto mehr fahren?",
    answer1:"100",
    answer2:"60",
    answer3:"20",
    answer4:"6",
    correct:2
},{
    question: "Wie viele Kuna sind in etwa 1 Euro?",
    answer1:"5",
    answer2:"7",
    answer3:"10",
    answer4:"3",
    correct:1
},{
    question: "Woraus wird französischer Cidre gemacht?",
    answer1:"Birnen",
    answer2:"Zitronen",
    answer3:"Äpfel",
    answer4:"Bananen",
    correct:2
},{
    question: "Was findet man auf einer Pizza Tonno?",
    answer1:"Thunfisch",
    answer2:"Ananas",
    answer3:"Paprika",
    answer4:"Hackfleisch",
    correct:0
},{
    question: "In welchen Sprachen sind die Straßenschilder in Helsinki?",
    answer1:"Finnisch, Schwedisch",
    answer2:"Finnisch, Englisch",
    answer3:"Finnisch, Russisch",
    answer4:"Finnisch, Polnisch",
    correct:0
},{
    question: "In welcher Stadt gibt es Sachsenhausen?",
    answer1:"Berlin",
    answer2:"München",
    answer3:"Stuttgart",
    answer4:"Frankfurt",
    correct:3
},{
    question: "Was ist ein Hokkaido?",
    answer1:"Pilz",
    answer2:"Kürbis",
    answer3:"Melone",
    answer4:"Brot",
    correct:1
},{
    question: "Aus welchem Material besteht die Freiheitsstaue?",
    answer1:"Eisen",
    answer2:"Kupfer",
    answer3:"Messing",
    answer4:"Blech",
    correct:1
},{
    question: "Wie heißt das Stadion des Fc Liverpool?",
    answer1:"Anfield",
    answer2:"Old Trafford",
    answer3:"Stamford Bridge",
    answer4:"Goodison Park",
    correct:0
}];

var events = [{
    text: "{0} muss sein/ihr Glas leer trinken! Viel Spaß!"
},{
    text: "{0} muss allen ein Video zeigen. Falls keiner lacht muss er/sie einen Schluck trinken."
},{
    text: "{0} muss allen eine peinliche Story erzählen oder aus dem Ekelglas trinken."
},{
    text: "{0} muss aus dem Glas von {1} einen Schluck trinken."
},{
    text: "{0} muss sagen auf wen er/sie steht oder trinken."
},{
    text: "{0} muss allen ein Kompliment machen oder trinken."
},{
    text: "{0} muss einen lustigen Text in seine/ihre Story machen oder trinken. {1} darf sich den Text ausdenken."
},{
    text: "{0} darf aussuchen wer einen Schluck trinken muss."
},{
    text: "{0} darf 2 Schlücke verteilen."
},{
    text: "{0} darf 5 Schlücke verteilen."
},,{
    text: "{0} darf 2 Schlücke verteilen."
},{
    text: "{0} darf 5 Schlücke verteilen."
},,{
    text: "{0} darf 2 Schlücke verteilen."
},{
    text: "{0} darf 5 Schlücke verteilen."
},{
    text: "{0} darf für die nächsten 5 Runden nicht reden. Beim Verstoß muss getrunken werden."
},{
    text: "{0} darf für 5 Runden keinen Namen mehr sagen. Beim Verstoß muss getrunken werden."
},{
    text: "Jeder darf den Namen von {0} für 5 Runden nicht mehr sagen. Beim Verstoß muss getrunken werden."
},{
    text: "{0} muss einen Handstand machen oder trinken."
},{
    text: "{0} darf auswählen wer sein Glas leer trinken muss."
},{
    text: "{0} darf das Glas von {1} auffüllen."
},{
    text: "{0} muss ein Lied singen oder trinken."
},{
    text: "{0} muss mit {1} einen Walzer tanzen oder aus dem Ekelglas trinken."
},{
    text: "{0} muss ein Lied singen oder aus dem Ekelglas trinken."
},{
    text: "{0} muss ein Rad machen oder trinken."
},{
    text: "{0} muss das Glas von {1} leer trinken."
},{
    text: "{0} darf das Glas von {1} auffüllen."
},{
    text: "{0} darf für die nächsten 5 Runden jeweils einen Schluck verteilen."
},{
    text: "Alle müssen einen Schluck trinken, {0} muss es überprüfen."
},{
    text: "{0} muss 10 Liegestützen machen oder 3 Schlücke trinken."
},{
    text: "{0} muss jeweils 1 Schluck aus dem Glas von jedem trinken."
},{
    text: "{0} muss einen Hampelmann machen oder 2 Schlücke trinken."
},{
    text: "{0} muss sich an die Nase fassen. Wenn er/sie es nicht schafft muss getrunken werden."
},{
    text: "Jeder, der in einer Beziehung ist muss trinken. {0} bestätigt."
},{
    text: "{0} verteilt 2 Schlücke an die Person, die er/sie am hübschesten findet."
},{
    text: "{0} muss eine Grimasse schneiden oder trinken."
},{
    text: "{0} darf 2 Schlücke an eine Person die dicker ist als er/sie selbst. Gibt es keine Person, muss er/sie selbst trinken."
},{
    text: "{0} muss seinen/ihren Namen tanzen oder 2 Schlücke aus dem Ekelglas trinken."
},{
    text: "{0} ist für 5 Runden der Sklave von {1} und muss dessen/ihre Schlücke trinken."
},{
    text: "{0} und {1} müssen Armdrücken machen. Der Verlierer trinkt."
},{
    text: "{0} muss einen Schluck aus dem Ekelglas trinken."
},{
    text: "Jeder muss einen Schluck aus dem Ekelglas trinken. {0} fängt an. Ist das Glas leer, füllt der Nächste es mit 3 Getränken auf."
},{
    text: "{0} darf 2 Schlücke aus dem Ekelglas verteilen."
}];