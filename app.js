
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
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

socketManager.sockets.on('connection', function(socket) {
    socket.on('resize', function(data) {
        console.log('resize pty: ' + data.cols + 'x' + data.rows);
    });

    socket.on('send', function(data) {
        console.log('received data: ' + JSON.stringify(data));
    });
});

httpServer.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

