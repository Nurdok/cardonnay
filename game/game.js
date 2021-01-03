const csvToJson = require('csvtojson');

let Player = require('./player');
let Team = require('./team');
let Deck = require('./deck');
const utils = require('./utils');
const assert = require('assert').strict;


async function loadCardsFromFile(path) {
    return await csvToJson(
      {colParser:{
        "text":"string",
        "points":"number"}}).fromFile(path);
}

function Game(code, onEmpty) {
    this.code = code;
    this.onEmpty = onEmpty;
    this.players = [];
    this.teams = [];
    this.host = null;
    this.inProgress = false;
    this.deck = [];
    this.roundEndTime = null;

    this.currentPlayerId = 1;
    this.currentRoundNum = 1;
    this.timeOfLastAction = new Date();
    this.currentCorrectCards = [];
    this.turnTimer = null;
    this.timerHandler = null;
    this.currentTeam = null;
    this.currentTeamIndex = null;

    setTimeout(() => this.deleteGameIfEmpty(), 60 * 1000);
}

Game.prototype.newPlayer = function(name, socket) {
    return new Player(name, socket, this.getNextId());
};

Game.prototype.addPlayer = function(name, socket) {
    let newPlayer = this.newPlayer(name, socket);
    this.initPlayer(newPlayer);
    this.players.push(newPlayer);
    this.sendUpdatedPlayersList();
    return newPlayer;
};

Game.prototype.getPlayerIndexById = function(id) {
    for (let i = 0; i < this.players.length; ++i) {
        if (this.players[i].id === id) {
            return i;
        }
    }
    console.log('Player with id ' + id + ' not found')
    return null;
};

Game.prototype.removePlayer = function(id) {
    let playerIndex = this.getPlayerIndexById(id);
    if (playerIndex !== null) {
        this.players.splice(playerIndex, 1);
    }

    if (this.players.length === 0) {
        this.onEmpty();
    }
};

Game.prototype.deleteGameIfEmpty = function() {
    // Handle dev game
    if (this.code === "ffff") return;

    let allPlayersDisconnected = true;
    for (let j = 0; j < this.players.length; j++) {
        if (this.players[j].isConnected) {
            allPlayersDisconnected = false;
            break;
        }
    }
    if (allPlayersDisconnected) {
        this.onEmpty();
    }
};

Game.prototype.initPlayer = function(newPlayer) {
    //if this is the first user, make them host
    if (this.players.length === 0) {
        this.host = newPlayer;
        newPlayer.makeHost();
    }

    //when this player disconnects, remove them from this game
    let self = this;
    console.log('registering disconnect msg')
    newPlayer.socket.on("disconnect", function() {
        newPlayer.isConnected = false;
        /*
        if (self.inProgress) {
            self.currentRound.findReplacementFor(newPlayer);
        } else {
        */
        self.removePlayer(newPlayer.id);
        self.onPlayerDisconnect(newPlayer);
        self.sendUpdatedPlayersList();
    });

    /*
    newPlayer.socket.on("viewPreviousResults", function() {
        if (self.currentRound && self.currentRound.canViewLastRoundResults) {
            newPlayer.send("viewResults", {
                chains: self.currentRound.getAllChains(),
                isViewPreviousResults: true
            });
        }
    });
     */
};

Game.prototype.onPlayerDisconnect = function(oldPlayer) {
    const noHost = !this.host;
    const playerWasHost = this.host && oldPlayer.id === this.host.id;

    if (playerWasHost || noHost) {
        this.host = undefined;
        //find the first connected player to be host
        for (var i = 0; i < this.players.length; i++) {
            var thisPlayer = this.players[i];
            if (thisPlayer.isConnected) {
                this.host = thisPlayer;
                thisPlayer.makeHost();
                break;
            }
        }
    }

    this.deleteGameIfEmpty();
};


Game.prototype.getNextId = function() {
    return this.currentPlayerId++;
};

Game.prototype.getJson = function() {
    let players = [];
    this.players.forEach(function(player) {
        players.push(player.getJson());
    });

    let teams = [];
    this.teams.forEach(function(team) {
        teams.push(team.getJson());
    });

    let jsonGame = {
        code: this.code,
        players,
        teams,
        inProgress: this.inProgress,
    };
    return jsonGame;
};


Game.prototype.sendUpdatedPlayersList = function() {
    this.sendToAll("updatePlayerList", {
        players: this.getJson().players
    });
};

Game.prototype.sendToAll = function(event, data) {
    let self = this;
    this.players.forEach(function(player) {
        player.socket.emit(event, {
            success: true,
            event: event,
            gameCode: self.code,
            player: player.getJson(),
            game: self.getJson(),
            data
        });
    });
};

Game.prototype.getTeamById = function(id) {
    let retTeam = null;
    this.teams.forEach(function(team) {
        if (team.id == id) {
            retTeam = team;
        }
    });
    return retTeam;
}

Game.prototype.allocatePlayersToTeams = function() {
    let teamAllocation = utils.genTeamAllocation(this.players.length);
    console.log('teamAllocation: ' + teamAllocation);
    for (let i = 0; i < this.players.length; i++) {
        let id = teamAllocation[i];
        let team = this.getTeamById(id);
        if (team == null) {
            console.log('Creating Team(' + id + ')');
            team = new Team(id);
            this.teams.push(team);
        }
        this.players[i].team = id;
        team.addPlayer(this.players[i])
    }
}

Game.prototype.startGame = async function() {
    this.inProgress = true;
    this.currentRoundNum = 1;
    let card_list = await loadCardsFromFile('cards.csv');
    this.deck = new Deck(card_list);
    this.allocatePlayersToTeams();
    this.startRound();
}

Game.prototype.startRound = function() {
    this.sendToAll('startRound', {round: this.currentRoundNum});
    this.setStartingTeamInRound();
    this.startTurn();
}

Game.prototype.setStartingTeamInRound = function() {
    let minScore = 0;
    let minTeamIndex = 0;
    for (let i = 0; i < this.teams.length; i++) {
        const team = this.teams[i];
        if (team.score < minScore) {
            minScore = team.score;
            minTeamIndex = i;
        }
    }
    this.currentTeamIndex = minTeamIndex;
    this.currentTeam = this.teams[this.currentTeamIndex];
}

Game.prototype.setNextTeam = function() {
    assert.ok(this.teams.length > 0, 'team list is empty');
    this.currentTeamIndex = (this.currentTeamIndex + 1) % this.teams.length;
    this.currentTeam = this.teams[this.currentTeamIndex];
}

Game.prototype.startTurn = function() {
    this.currentPlayer = this.currentTeam.nextPlayer();

    this.sendToAll('startTurn',
        {currentTeamId: this.currentTeam.id,
            currentPlayerId: this.currentPlayer.id,
        currentPlayerName: this.currentPlayer.name});
    this.sendToAll('updateCurrentTurnScore',
        {score: utils.sumPoints(this.currentCorrectCards)})
    this.drawNewCard();

    this.turnTimer = new Date().getTime() + 1000 * 60;
    let self = this;
    this.timerHandler = setInterval(function() {
        let now = new Date().getTime();
        let timeLeft = self.turnTimer - now;
        if (timeLeft < 0) {
            self.endTurn();
        } else {
            self.sendToAll('updateTurnTimer', {timeLeft: timeLeft})
        }
    }, 250);
}

Game.prototype.endTurn = function() {
    if (this.timerHandler != null) {
        clearInterval(this.timerHandler);
        this.timerHandler = null;
    }
    this.sendToAll('endTurn');
    this.currentTeam.cards.push(...this.currentCorrectCards);
    this.currentCorrectCards = [];
    this.deck.reset();
    if (this.deck.isEmpty()) {
        this.endRound();
    } else {
        this.turn++;
        this.setNextTeam();
        this.startTurn();
    }
}

Game.prototype.drawNewCard = function() {
    this.currentCard = this.deck.draw();
    let self = this;

    this.currentPlayer.sendThen(
        'newCard',
        {currentCard: this.currentCard},
        'cardEvent',
        function(event) {
            if (event === 'skip') {
                self.deck.discard(self.currentCard);
            } else if (event === 'correct') {
                self.currentCorrectCards.push(self.currentCard);
                self.sendToAll('updateCurrentTurnScore',
                    {score: utils.sumPoints(self.currentCorrectCards)})
            }
            if (self.deck.isEmpty()) {
                self.endTurn();
            } else {
                self.drawNewCard();
            }
        }
    );
}

Game.prototype.endRound = function() {
    this.sendToAll('endRound');
    let self = this;
    this.teams.forEach(function(team) {
       team.score += utils.sumPoints(team.cards);
       team.cards.forEach(function(card) {
           self.deck.discard(card);
       });
    });
    this.deck.reset();
    this.currentRoundNum++;
    if (this.currentRoundNum <= 3) {
        this.startRound();
    } else {
        this.endGame();
    }
}

Game.prototype.endGame = function() {
    this.sendToAll('endGame');
}

module.exports = Game;
