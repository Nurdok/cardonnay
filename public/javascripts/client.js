$(function () {
    let socket = io();
    let myUsername = ''

    console.log('starting client.js');

    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        console.log('emitting new user msg');
        let usernameElement = $('#username');
        myUsername = usernameElement.val();
        $('#welcome').text('Hi, ' + myUsername + '!');
        socket.emit('new user', myUsername);
        $('form').hide();
        return false;
    });

    /*
    socket.on('new user', function (username) {
        console.log('got a new user message');
        $('#userList').append($('<li>').text(username));
    });
     */

    socket.on('updatePlayerList', function (data) {
        console.log('got an updatePlayerList message:' + data);
        $('#userList').empty();
        data.data.players.forEach(player =>
        $('#userList').append($('<li>').text(player.name)));
    });

});