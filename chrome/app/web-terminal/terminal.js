/**
 * Web Terminal
 */
define(function(require, exports, module) {

    var Socket = require('./socket');

    /**
     * Class WebTerminal
     */
    var WebTerminal = function(options) {
        var $this = this;
        var $socket = new Socket();

        Object.defineProperty(this, 'options', {
            value : options,
            writable : false,
        });

        Object.defineProperty(this, 'socket', {
            value : $socket,
            writable : false,
        });
    };

    /**
     * Startup this terminal
     */
    WebTerminal.prototype.run = function() {
        this.socket.connect(this.options.host, this.options.port, function(result) {
            // TODO
        });
    };

    /**
     * Exit this terminal
     */
    WebTerminal.prototype.exit = function() {
    };

    module.exports = WebTerminal;

});

