define(function(require, exports, module) {

    var WebTerminal = require('./terminal');

    /*
     * Run web terminal
     */
    window.setTimeout(function() {
        var term = new WebTerminal({
            host : 'localhost',
            port : 8000,
        });

        term.run();
    }, 100);

});

