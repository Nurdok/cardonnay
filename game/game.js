let Player = require('./player');

const CARDS = [
    {text: 'Sean Connery', points: 1},
    {text: 'Sliders', points: 2},
    {text: 'Internet Explorer', points: 2},
    {text: 'Noise Cancelling Headphones', points: 2},
    {text: 'Netflix and Chill', points: 3},
    {text: 'Debate Club', points: 2},
    {text: 'George Carlin', points: 2},
    {text: 'Getting Things Done™', points: 4},
    {text: 'Keying Your Ex-Wife\'s Car', points: 4},
    {text: 'Harrison Ford', points: 1},
    {text: 'The Star Wars Prequels', points: 2},
    {text: 'Warm Apple Pie', points: 2},
    {text: 'The Mission Impossible Theme', points: 3},
    {text: '64K Modem', points: 2},
    {text: 'Donald J. Trump', points: 1},
    {text: 'Trying To Get Your Team To Guess Your Card', points: 4},
    {text: 'Koreans Playing StarCraft', points: 4},
    {text: 'How I Met Your Mother', points: 1},
    {text: 'Rocky\'s Horror Picture Show', points: 2},
    {text: 'Lightning Rod', points: 2},
    {text: 'Watching Paint Dry', points: 2},
    {text: 'Mechanical Keyboard', points: 3},
    {text: 'Joseph Gordon-Levitt', points: 2},
    {text: 'Zooey Deschanel', points: 2},
    {text: 'Linus Torvalds', points: 2},
    {text: 'Guido Van Rossum', points: 3},
    {text: 'Halloween', points: 1},
    {text: 'Mel Brooks', points: 2},
    {text: 'Libertarianism', points: 2},
    {text: 'Ayn Rand', points: 3},
];

function Game(code, onEmpty) {
    this.code = code;
    this.onEmpty = onEmpty;
    this.players = [];
    this.host;
    this.inProgress = false;
    this.deck = [];
    //this.currentRound;

    //this.currentId = 1;
    //this.botCount = 0;
    this.currentRoundNum = 1;
    this.timeOfLastAction = new Date();

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
    /*
    newPlayer.socket.on("disconnect", function() {
        newPlayer.isConnected = false;
        if (self.inProgress) {
            self.currentRound.findReplacementFor(newPlayer);
        } else {
            self.removePlayer(newPlayer.id);
        }
        self.onPlayerDisconnect(newPlayer);
        self.sendUpdatedPlayersList();
    });
    */

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

Game.prototype.getNextId = function() {
    return this.currentId++;
};

Game.prototype.getJsonGame = function() {
    let players = [];
    this.players.forEach(function(player) {
        players.push(player.getJson());
    });

    let jsonGame = {
        code: this.code,
        players,
        inProgress: this.inProgress,
    };
    return jsonGame;
};


Game.prototype.sendUpdatedPlayersList = function() {
    this.sendToAll("updatePlayerList", {
        players: this.getJsonGame().players
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
            data
        });
    });
};

Game.prototype.startGame = function() {
    this.inProgress = true;
    this.currentRoundNum = 1;
    this.deck = CARDS;
    for (let i = 0; i < this.players.length; i++) {
        this.players[i].team = i % 2
    }
    this.sendToAll('startRound', {round: 1});
}


module.exports = Game;
