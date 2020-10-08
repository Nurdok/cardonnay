const Game = require("./game");

function GameList(devModeEnabled) {
    this.games = [];
    this.locked = false;
    this.minutesUntilRestart;

    // Add the dev game
    if (devModeEnabled) {
        this.newGame("ffff");
    }
}

GameList.prototype.newGame = function(forceCode) {
    if (this.locked) return false;

    let newCode;
    if (forceCode) {
        newCode = forceCode;
    } else {
        newCode = this.generateCode();
    }

    let self = this;
    let newGame = new Game(newCode, function() {
        //will be ran when this game has 0 players left
        self.removeGame(newCode);
    });
    this.games.push(newGame);
    console.log(newCode + " created");
    return newGame;
};

GameList.prototype.findGame = function(code) {
    if (!code || code.length !== 4) return false;

    for (let i = 0; i < this.games.length; i++) {
        if (this.games[i].code === code.toLowerCase()) {
            return this.games[i];
        }
    }
    return false;
};

GameList.prototype.generateCode = function() {
    let code;
    do {
        //generate 4 letter code
        code = "";
        let possible = "abcdefghijklmnopqrstuvwxyz";
        for (let i = 0; i < 4; i++) {
            code += possible.charAt(
                Math.floor(Math.random() * possible.length)
            );
        }
        //make sure the code is not already in use
    } while (this.findGame(code));
    return code;
};

GameList.prototype.removeGame = function(code) {
    let game = this.findGame(code);

    let index = this.games.indexOf(game);
    if (index > -1) {
        this.games.splice(index, 1);
        console.log(code + " removed");
    }
};

GameList.prototype.lock = function() {
    this.locked = true;

    this.minutesUntilRestart = 16;

    const interval = setInterval(() => {
        this.minutesUntilRestart--;
        if (this.minutesUntilRestart <= 0) {
            clearInterval(interval);
        }
    }, 1000 * 60); // every minute
};

module.exports = GameList;