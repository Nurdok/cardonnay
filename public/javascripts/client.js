$(function () {
    let socket = io();
    let myUsername = ''
    let myTeamId = null;

    console.log('starting client.js');

    let startGameButton = $('#startGameButton');
    startGameButton.hide();

    let skipButton = $('#skipButton');
    skipButton.hide();

    let correctButton = $('#correctButton');
    correctButton.hide();

    let clock = $('#clock');
    clock.hide();

    let cardDiv = $('#cardDiv');
    cardDiv.hide();
    let cardText = $('#cardText');
    let cardPoints = $('#cardPoints');

    let currentTurnScore = $('#currentTurnScore');
    currentTurnScore.hide();

    let currentRoundNum = $('#currentRoundNum');

    let currentTimerEnd = null;
    let updateTimer = null;

    $('#usernameForm').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        console.log('emitting new user msg');
        let usernameElement = $('#username');
        myUsername = usernameElement.val();
        $('#welcome').text('Hi, ' + myUsername + '!');
        socket.emit('new user', myUsername);
        $('#usernameForm').hide();
        return false;
    });

    /*
    socket.on('new user', function (username) {
        console.log('got a new user message');
        $('#userList').append($('<li>').text(username));
    });
     */

    socket.on('updatePlayerList', function (data) {
        console.log('got an updatePlayerList message:' + data);
        let userList = $('#userList');
        userList.empty();
        data.data.players.forEach(player =>
        userList.append($('<li>').text(player.name)));

        if (data.player.isHost) {
            startGameButton.show();
        } else {
            startGameButton.hide();
        }
    });

    startGameButton.click(function() {
       socket.emit('hostStartGame');
    });

    socket.on('startRound', function(data) {
        startGameButton.hide();
        $('#welcome').text('Hi, ' + myUsername +
            '! You\'re on team ' + data.player.team);
        myTeamId = data.player.team;
        currentRoundNum.text(data.data.round)
    });

    socket.on('startTurn', function(data) {
        let team = data.data.team;
        let player = data.data.player;
        let currentCard = data.data.currentCard;

        let text = 'Hi, ' + myUsername + '!\n';
        if (data.data.currentPlayerId == data.player.id) {
            text += "You're the current player!";
        } else if (data.data.currentTeamId == myTeamId) {
            text += "Your team member (" + data.data.currentPlayerName + ") is up, guess away!";
        } else {
            text += "The other team is playing (" + data.data.currentPlayerName + " is up), don't interrupt";
        }

        $('#welcome').text(text);
    });

    function checkTime(i) {
        if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
        return i;
    }

    socket.on('updateTurnTimer', function(data) {
        clock.show();
        currentTimerEnd = new Date().getTime() + data.data.timeLeft;
        if (updateTimer != null) {
            clearInterval(updateTimer);
        }
        updateTimer = setInterval(function() {
            let now = new Date().getTime();
            let timeLeftMsec = currentTimerEnd - now;
            let seconds = Math.floor(timeLeftMsec / 1000) % 60;
            let minutes = Math.floor(timeLeftMsec / 1000 / 60);
            let s = checkTime(seconds);
            let m = checkTime(minutes);
            let clockText = m + ":" + s;
            clock.text("Time remaining: " + clockText);
            if (timeLeftMsec > 0) {
                clearInterval(updateTimer);
            }
        }, 25);
    });

    socket.on('newCard', function(data) {
        cardDiv.show();
        skipButton.show();
        correctButton.show();

        let card = data.data.currentCard;
        cardText.text(card.text);
        cardPoints.text('(' + card.points + ')');
    });


    skipButton.click(function() {
        socket.emit('cardEvent', 'skip');
    });

    correctButton.click(function() {
        socket.emit('cardEvent', 'correct');
    });

    socket.on('endTurn', function(data) {
        console.log('got an endTurn message:' + data);
        if (updateTimer != null) {
            clearInterval(updateTimer);
        }
        clock.hide();
        skipButton.hide();
        correctButton.hide();
        cardDiv.hide();
        currentTurnScore.hide();
    });

    socket.on('endRound', function(data) {

    });

    socket.on('endGame', function(data) {
        $('#welcome').text('GAME OVER');
    });

    socket.on('updateCurrentTurnScore', function(data) {
        currentTurnScore.text('Scored so far: ' + data.data.score + ' points.')
        currentTurnScore.show();
    });
});