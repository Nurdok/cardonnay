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

    function setUsername(name) {
        myUsername = name;
        socket.emit('new user', myUsername);
    }

    function getUsernameFromUrl() {
        const url = new URL(window.location.href);
        const name = url.searchParams.get("name");
        console.log('Name from URL: ' + name);
        return name;
    }

    if (getUsernameFromUrl() != null) {
        $('#usernameForm').hide();
        setUsername(getUsernameFromUrl());
    }

    $('#usernameForm').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        console.log('emitting new user msg');
        let usernameElement = $('#username');
        setUsername(usernameElement.val());
        myUsername = usernameElement.val();
        $('#welcome').text('Hi, ' + myUsername + '!');
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

    function updateTeams(teams, currentTeamId, currentPlayerId) {
        $('#connectedUsers').hide();
        let teamList = $('#teamList');
        teamList.empty();
        teams.forEach(team => {
            let teamItem = $('<li>');
            teamItem.text('Team ' + team.id + ' (score: ' + team.score + ')');
            if (currentTeamId === team.id) {
                teamItem.wrapInner('<b />')
            }
            let playerList = $('<ul>');
            team.players.forEach(player => {
                let playerItem = $('<li>').text(player.name);
                if (currentPlayerId === player.id) {
                    playerItem.wrapInner('<b />')
                }
                playerList.append(playerItem);
            });
            teamItem.append(playerList);
            teamList.append(teamItem);
        })
    }

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

        $('#welcome').text('Hi, ' + myUsername + '!');
        updateTeams(data.game.teams, data.data.currentTeamId, data.data.currentPlayerId);
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
    
    socket.on('newCard', function(data) {
        console.log("fkjsdflkjsd");
        console.log(data);
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