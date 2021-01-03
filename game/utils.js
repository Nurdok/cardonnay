function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function genTeamAllocation(length) {
    let teamAllocation = []
    for (let i = 0; i < length; i++) {
        if (i < length / 2) {
            teamAllocation.push(0);
        } else {
            teamAllocation.push(1);
        }
    }
    shuffleArray(teamAllocation);
    console.log("\n\n\njkl:", teamAllocation, "\n\n\n")
    return teamAllocation;
}

function sumPoints(cards) {
    let sum = 0;
    cards.forEach(function(card) {
        sum += card.points;
    });
    return sum;
}

module.exports = {
    shuffleArray,
    genTeamAllocation,
    sumPoints,
}


