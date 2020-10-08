let GameList = require('./game/game-list');

module.exports = function(io) {
    let gameList = new GameList(true);
    let game = gameList.findGame('ffff');

    io.on('connection', (socket) => {
        console.log('a user connected');

        socket.on('disconnect', () => {
            console.log('a user disconnected');
        });

        socket.on('new user', (username) => {
            console.log('new user:', username)
            game.addPlayer(username, socket);
            io.emit('new user', username);
        });
    });
};
