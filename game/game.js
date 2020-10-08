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
