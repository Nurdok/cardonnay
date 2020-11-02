function Deck(cards) {
    this.drawPile = cards;
    this.discardPile = [];
}

Deck.prototype.shuffleRemaining = function() {
    shuffleArray(this.drawPile);
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

module.exports = Deck;