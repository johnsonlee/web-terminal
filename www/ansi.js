define(function(require, exports, module) {

    var LinkedList = require('www/linkedlist');
    var StringReader = require('www/stringreader');

    var tokenTypes = {
        'ESC' : 1,
        'CSI' : 2,
    };

    /**
     * ANSI escape sequence parser
     */
    var AnsiParser = function() {
        var $stack = [];
        var $tokens = new LinkedList();

        /**
         * Parse ASCI text as tokens
         */
        this.parse = function(text) {
            var reader = new StringReader(text);

            try {
                while (reader.available > 0) {
                    $tokens.add(next.call(this, reader));
                }
            } catch (e) {
                switch (e.class) {
                case 'EOFException':
                    break;
                default:
                    throw e;
                }
            }

            return $tokens;
        };

        /**
         * Get the next token
         */
        function next(reader) {
            var c = null;
            var stack = [];

            while (true) {
                switch (c = reader.read()) {
                case 10:
                    return {
                        id : 'LF',
                        image : '\n',
                    };
                case 13:
                    switch (c = reader.read()) {
                    case 10:
                        return {
                            id : 'CRLF',
                            image : '\r\n',
                        };
                    }

                    reader.unread();

                    return {
                        id : 'CR',
                        image : '\r',
                    };
                case 27:
                    if (stack.length <= 0) {
                        return {
                            id : 'ESC',
                            image : '\u001b',
                        };
                    }

                    reader.unread();

                    return {
                        id : 'TEXT',
                        image : stack.join(''),
                    };
                default:
                    stack.push(String.fromCharCode(c));
                }
            }
        }
    };

    module.exports = AnsiParser;

});

