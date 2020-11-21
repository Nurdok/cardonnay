const assert = require('assert').strict;

function Team(id) {
    this.id = id;
    this.score = 0;
    this.players = [];
    this.cards = [];
    this.turn = -1;
}

Team.prototype.getJson = function() {
    let players = [];
    this.players.forEach(function(player) {
        players.push(player.getJson());
    });

    return {
        id: this.id,
        score: this.score,
        players,
    };
};

Team.prototype.addPlayer = function (player) {
    this.players.push(player);
}

Team.prototype.nextPlayer = function () {
    assert.ok(this.players.length > 0,
        "empty player list in team " + this.id);
    this.turn = (this.turn + 1) % this.players.length;
    console.log('Next player is: ' + this.players[this.turn].name);
    return this.players[this.turn];
}


module.exports = Team;