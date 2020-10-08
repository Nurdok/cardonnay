let Player = require('./player');

function Game(code, onEmpty) {
    this.code = code;
    this.onEmpty = onEmpty;
    this.players = [];
    this.host;
    this.inProgress = false;
    //this.currentRound;

    //this.currentId = 1;
    //this.botCount = 0;
    //this.currentRoundNum = 1;
    this.timeOfLastAction = new Date();

    setTimeout(() => this.deleteGameIfEmpty(), 60 * 1000);
}

Game.prototype.newPlayer = function(name, socket) {
    return new Player(name, socket, this.getNextId());
};

Game.prototype.addPlayer = function(name, socket) {
    var newPlayer = this.newPlayer(name, socket);
    this.initPlayer(newPlayer);
    this.players.push(newPlayer);
    this.sendUpdatedPlayersList();
    return newPlayer;
};

Game.prototype.deleteGameIfEmpty = function() {
    // Handle dev game
    if (this.code === "ffff") return;

    var allPlayersDisconnected = true;
    for (var j = 0; j < this.players.length; j++) {
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
        //newPlayer.makeHost();
    }

    //when this player disconnects, remove them from this game
    var self = this;
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
    var players = [];
    this.players.forEach(function(player) {
        players.push(player.getJson());
    });

    var jsonGame = {
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
    var self = this;
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


module.exports = Game;
