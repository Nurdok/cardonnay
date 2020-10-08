console.log('io loaded');

function setupIo (io) {
    io.on('connection', (socket) => {
        console.log('a user connected');

        socket.on('disconnect', () => {
            console.log('a user disconnected');
        });

        socket.on('new user', (username) => {
            console.log('new user: ', username)
            io.emit('new user', username);
        });
    });
};

module.exports = setupIo;