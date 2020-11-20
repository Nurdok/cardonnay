let utils = require('./utils');

function Deck(cards) {
    this.drawPile = cards;
    this.discardPile = [];
}

Deck.prototype.shuffleRemaining = function() {
    utils.shuffleArray(this.drawPile);
}

Deck.prototype.reset = function() {
    this.drawPile.push(...this.discard);
    this.shuffleRemaining();
}

Deck.prototype.draw = function() {
    return this.drawPile.pop();
}

Deck.prototype.discard = function(card) {
    return this.discardPile.push(card);
}

module.exports = Deck;