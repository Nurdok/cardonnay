function Team(id) {
    this.id = id;
    this.score = 0;
    this.players = [];
    this.cards = [];
    this.turn = -1;
}

Team.prototype.addPlayer = function (player) {
    this.players.push(player);
}

Team.prototype.nextPlayer = function () {
    this.turn = (this.turn + 1) % this.players.length;
    return this.players[this.turn];
}


module.exports = Team;