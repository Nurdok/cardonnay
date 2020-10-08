$(function () {
    let socket = io();

    console.log('starting client.js');

    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        console.log('emitting new user msg');
        socket.emit('new user', $('#username').val());
        $('#username').val('');
        return false;
    });

    socket.on('new user', function (username) {
        console.log('got a new user message');
        $('#userList').append($('<li>').text(username));
    });
});