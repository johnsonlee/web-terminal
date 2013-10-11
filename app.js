
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , cookie = require('cookie')
  , connect = require('connect')
  , pty = require('pty.js')
  , socket = require('socket.io')
  , routes = require('./routes')
  , terminal = require('./routes/terminal');

var app = express();

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.cookieParser());
    app.use(express.session({
        secret : 'secret',
        key    : 'express.sid',
    }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, '.')));
    app.use(express.static(path.join(__dirname, 'public')));
}).configure('development', function() {
    app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/terminal', terminal.index);

var httpServer = http.createServer(app);
var socketManager = socket.listen(httpServer);

socketManager.set('authorization', function(data, accept) {
    if (data.headers.cookie) {
        data.cookie = cookie.parse(data.headers.cookie);
        data.sessionId = connect.utils.parseSignedCookie(
                data.cookie['express.sid'], 'secret');

        for (var i in data.cookie) {
            console.log('Cookie[' + i + '] = ' + data.cookie[i]);
        }

        if (data.cookie['express.sid'] == data.sessionId) {
            return accept('Cookie is invalid.', false);
        }

        return accept(null, true);
    }

    return accept('No cookie transmitted.', false);
});

socketManager.sockets.on('connection', function(socket) {
    socket.on('terminal.open', function(data) {
        var bash = pty.spawn('bash', [], {
            name : 'xterm-color',
            cols : data.cols,
            rows : data.rows,
            cwd  : process.env.HOME,
            env  : process.env,
        });

        bash.on('exit', function(data) {
            socket.emit('terminal.exit');
        });

        bash.on('data', function(data) {
            console.log(JSON.stringify(data));

            socket.emit('terminal.output', {
                message : data,
            });
        });

        socket.on('terminal.close', function() {
            console.log('closing terminal......');
            bash.kill('SIGKILL');
        });

        socket.on('terminal.resize', function(data) {
            bash.resize(data.cols, data.rows);
        });

        socket.on('terminal.input', function(data) {
            console.log('received data: ' + JSON.stringify(data));
            bash.write(data.message);
        });
    });
});

httpServer.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

