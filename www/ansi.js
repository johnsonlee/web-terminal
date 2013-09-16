define(function(require, exports, module) {
var Stack = require('www/stack');
    var LinkedList = require('www/linkedlist');
    var StringReader = require('www/stringreader');

    var tokenTypes = {
        'ESC' : 1,
        'CSI' : 2,
    };

    var UnexpectTokenException = function(msg) {

        Object.defineProperty(this, 'class', {
            value : 'UnexpectTokenException',
            writable : false,
        });

        Object.defineProperty(this, 'message', {
            value : msg,
            writable : false,
        });

    };

    /**
     * ANSI escape sequence parser
     */
    var AnsiParser = function() {
        var $stack = new Stack();
        var $tokens = new LinkedList();

        /**
         * Parse ASCI text as tokens
         */
        this.parse = function(text) {
            var token = null;
            var reader = new StringReader(text);

            $tokens.clear();

            try {
                while (reader.available > 0) {
                    token = next.call(this, reader);
                    $tokens.add(token);
                }
            } catch (e) {
                switch (e.class) {
                case 'EOFException':
                    if (!$stack.isEmpty()) {
                        $tokens.add({
                            id : 'TEXT',
                            image : $stack.dump(),
                        });
                    }
                    console.log('Parse finished');
                    break;
                default:
                    console.error(e.stack);
                }
            }

            return $tokens;
        };

        /**
         * Get the next token
         */
        function next(reader) {
            var c = null;

            loop:
            while (true) {
                switch (c = reader.read()) {
                case 7: /* BEL */
                    if ($stack.isEmpty()) {
                        return parseBEL.call(this, reader);
                    }

                    reader.unread();
                    break loop;
                case 8: /* BS */
                    if ($stack.isEmpty()) {
                        return parseBS.call(this, reader);
                    }

                    reader.unread();
                    break;
                case 10: /* \n = LF */
                    if ($stack.isEmpty()) {
                        return parseLF.call(this, reader);
                    }

                    reader.unread();
                    break loop;
                case 13: /* \r = CR */
                    if ($stack.isEmpty()) {
                        return parseCR.call(this, reader);
                    }

                    reader.unread();
                    break loop;
                case 27: /* 1B = ESC */
                    if ($stack.isEmpty()) {
                        $stack.push(String.fromCharCode(c));
                        return parseEscapeSequence.call(this, reader);
                    }

                    reader.unread();
                    break loop;
                default:
                    $stack.push(String.fromCharCode(c));
                    break;
                }
            }

            return {
                id : 'TEXT',
                image : $stack.dump(),
            };
        }

        function parseEscapeSequence(reader) {
            var c = null;
            var image = null;

            try {
                switch (c = reader.read()) {
                case 64: /*@*/
                    break;
                case 65: /*A*/
                    break;
                case 66: /*B*/
                    break;
                case 67: /*C*/
                    break;
                case 68: /*D*/
                    break;
                case 69: /*E*/
                    break;
                case 70: /*F*/
                    break;
                case 71: /*G*/
                    break;
                case 72: /*H*/
                    break;
                case 73: /*I*/
                    break;
                case 74: /*J*/
                    break;
                case 75: /*K*/
                    break;
                case 76: /*L*/
                    break;
                case 77: /*M*/
                    break;
                case 78: /*N*/
                    break;
                case 79: /*O*/
                    break;
                case 80: /*P*/
                    break;
                case 81: /*Q*/
                    break;
                case 82: /*R*/
                    break;
                case 83: /*S*/
                    break;
                case 84: /*T*/
                    break;
                case 85: /*U*/
                    break;
                case 86: /*V*/
                    break;
                case 87: /*W*/
                    break;
                case 88: /*X*/
                    break;
                case 89: /*Y*/
                    break;
                case 90: /*Z*/
                    break;
                case 91: /*[*/
                    $stack.push('[');
                    return parseCSI.call(this, reader);
                case 92: /*\*/
                    break;
                case 93: /*]*/ // OSC (Operating System Command)
                    $stack.push(']');
                    return parseOSC.call(this, reader);
                case 94: /*^*/
                    break;
                case 95: /*_*/
                    break;
                default:
                    reader.unread();

                    return {
                        id : 'ESC',
                        image : String.fromCharCode(c),
                    };
                }
            } catch (e) {
                if ('UnexpectTokenException' == e.class) {
                    reader.unread();
                }

                throw e;
            }
        }

        function parseBEL(reader) {
            return {
                id : 'BEL',
                image : '\u0007',
            };
        }

        function parseBS(reader) {
            return {
                id : 'BS',
                image : '\b',
            };
        }

        function parseCR(reader) {
            switch (reader.read()) {
            case 10:
                return {
                    id : 'CRLF',
                    image : '\r\n',
                };
            default:
                reader.unread();
                break;
            }

            return {
                id : 'CR',
                image : '\n',
            };
        }

        function parseCSI(reader) {
            var c = null;
            var n = null;
            var m = null;
            var token = null;

            switch (c = reader.read()) {
            case 59: /* ; */
                $stack.push(';');

                if (m = readDecimal.call(this, reader)) {
                    $stack.push(m);
                } else {
                    throw new UnexpectTokenException($stack.toString());
                }

                return parsePosition.call(this, reader);
            case 63: /*?*/
                $stack.push('?');
                return parseDECTCEM.call(this, reader);
            case 72: /*H*/
                $stack.push('H');
                return parseCUP.call(this, reader);
            case 109: /*m*/
                $stack.push('m');
                return  parseSGR.call(this, reader);
            case 115: /*s*/
                $stack.push('s');
                return parseSCP.call(this, reader);
            case 117: /*u*/
                $stack.push('u');
                return parseRCP.call(this, reader);
            default:
                reader.unread();

                if (n = readDecimal.call(this, reader)) {
                    switch ([n, reader.peak()].join('')) {
                    case '6n':
                        $stack.push(n);
                        reader.reads(1, $stack);
                        return parseDSR.call(this, reader);
                    case '4l':
                        $stack.push(n);
                        reader.reads(1, $stack);
                        return parseUnknown.call(this, reader);
                    }

                    $stack.push(n);
                }

                switch (reader.read()) {
                case 59: /* ; */
                    $stack.push(';');
                    return parsePosition.call(this, reader);
                case 65: /* A */
                    $stack.push('A');
                    return parseCUU.call(this, reader);
                case 66: /* B */
                    $stack.push('B');
                    return parseCUD.call(this, reader);
                case 67: /* C */
                    $stack.push('C');
                    return parseCUF.call(this, reader);
                case 68: /* D */
                    $stack.push('D');
                    break;
                case 69: /* E */
                    $stack.push('E');
                    break;
                case 70: /* F */
                    $stack.push('F');
                    break;
                case 71: /* G */
                    $stack.push('G');
                    break;
                case 72: /* H */
                    $stack.push('H');
                    break;
                case 74: /* J */
                    $stack.push('J');
                    break;
                case 75: /* K */
                    $stack.push('K');
                    return parseEL.call(this, reader);
                case 83: /* S */
                    $stack.push('S');
                    break;
                case 84: /* T */
                    $stack.push('T');
                    break;
                case 109: /* m */
                    $stack.push('m');
                    return parseSGR.call(this, reader);
                default:
                    throw new UnexpectTokenException($stack.toString());
                }
            }

            return {
                id : 'CSI',
                image : $stack.dump(),
            }
        }

        function parseCUD(reader) {
            return {
                id : 'CUD',
                image : $stack.dump(),
            };
        }

        function parseCUF(reader) {
            return {
                id : 'CUF',
                image : $stack.dump(),
            };
        }

        function parseCUP(reader) {
            var img = $stack.dump();
            var matches = img.match(/^\u001b\[([^H]+)H$/);
            var row = 1;
            var column = 1;

            if (matches) {
                var cursor = matches[1].split(/;/);

                row = Math.max(1, parseInt(cursor[0]));
                column = Math.max(1, parseInt(cursor[1]));
            } 

            return {
                id : 'CUP',
                image : img,
                row : row,
                column : column,
            };
        }

        function parseCUU(reader) {
            return {
                id : 'CUU',
                image : $stack.dump(),
            };
        }

        function parseDECTCEM(reader) {
            var num = readDecimal.call(this, reader);

            if (!num) {
                throw new UnexpectTokenException($stack.toString());
            }

            $stack.push(num);

            switch (reader.read()) {
            case 104: /* h */
            case 108: /* l */
                return {
                    id : 'DECTCEM',
                    image : $stack.dump(),
                };
            }

            reader.unread();
            throw new UnexpectTokenException($stack.toString());

        }

        function parseDSR(reader) {
            return {
                id : 'DSR',
                image : '6n',
            };
        }

        function parseEL(reader) {
            return {
                id : 'EL',
                image : $stack.dump(),
            };
        }

        function parseESC(reader) {
            return {
                id : 'ESC',
                image : '\u001b',
            };
        }

        function parseHVP(reader) {
            return {
                id : 'HVP',
                image : $stack.dump(),
            };
        }

        function parseLF(reader) {
            return {
                id : 'LF',
                image : '\n',
            };
        }

        function parseNumber(reader) {
            throw new UnexpectTokenException('');
        }

        function parseOSC(reader) {
            reader.reads(2, $stack); // assume it is "]0;"

            return {
                id : 'OSC',
                image : $stack.dump(),
            }
        }

        /**
         * Parse CUP/HVP
         */
        function parsePosition(reader) {
            var c = null;
            var m = null;

            if (m = readDecimal.call(this, reader)) {
                $stack.push(m);
            }

            switch (c = reader.read()) {
            case 72: /* H */
                $stack.push('H');
                return parseCUP.call(this, reader);
            case 102: /* f */
                $stack.push('f');
                return parseHVP.call(this, reader);
            case 109: /* m */
                $stack.push('m');
                return parseSGR.call(this, reader);
            case 114: /* r */
                $stack.push('r');
                return parseUnknown.call(this, reader);
            }

            reader.unread();

            if (!m) {
                throw new UnexpectTokenException(String.fromCharCode(c) + ' after ' + $stack.toString());
            }

            reader.unreads(m.image.length);
            $stack.pop();

            // lookahead if it's SGR
            if (/^\d+(;\d+)+?m/.test(reader.peak(20))) {
                return parseSGR.call(this, reader);
            }

            throw new UnexpectTokenException($stack.toString());
        }

        function parseRCP(reader) {
            return {
                id : 'RCP',
                image : $stack.dump(),
            };
        }

        function parseSCP(reader) {
            return {
                id : 'SCP',
                image : $stack.dump(),
            };
        }

        function parseSGR(reader) {
            var c = null;
            var sgr = null;

            if ('m' == $stack.peak()) {
                sgr = $stack.dump();

                return {
                    id : 'SGR',
                    image : sgr,
                    params : parseSGRParams(sgr),
                };
            }

            loop:
            while (true) {
                switch (c = reader.read()) {
                case 109: /* m */
                    $stack.push(String.fromCharCode(c));
                    sgr = $stack.dump();

                    return {
                        id : 'SGR',
                        image : sgr,
                        params : parseSGRParams(sgr),
                    };
                }
            }

            function parseSGRParams(image) {
                var matches = image.match(/\[([^m]+)m$/);

                return matches ? matches[1].split(';') : ['0'];
            }
        }

        function parseUnknown(reader) {
            return {
                id : 'UNKNOWN',
                image : $stack.dump(),
            };
        }

        function readDecimal(reader) {
            var c = null;
            var stack = [];

            loop:
            while (true) {
                switch (c = reader.read()) {
                case 48: /* 0 */
                case 49: /* 1 */
                case 50: /* 2 */
                case 51: /* 3 */
                case 52: /* 4 */
                case 53: /* 5 */
                case 54: /* 6 */
                case 55: /* 7 */
                case 56: /* 8 */
                case 57: /* 9 */
                    stack.push(String.fromCharCode(c));
                    break;
                default:
                    reader.unread();
                    break loop;
                }
            }

            if (stack.length <= 0) {
                return null;
            }

            return stack.join('');
        }

    };

    AnsiParser.isBeginOfSGR = function(token) {
        if (token.params && token.params.length > 0) {
            return '00' != token.params[0];
        }

        return false;
    };

    AnsiParser.isEndOfSGR = function(token) {
        if (token.params && token.params.length > 0) {
            return '0' == token.params[0] || '00' == token.params[0];
        }

        return false;
    };

    module.exports = AnsiParser;

});

