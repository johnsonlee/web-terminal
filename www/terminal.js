define(function(require, exports, module) {

    var Paint = require('www/paint');
    var Matrix = require('www/matrix');
    var Canvas = require('www/canvas');
    var AnsiParser = require('www/ansi');

    var COLORS = [
        'black',
        'red',
        'green',
        'yello',
        'blue',
        'magenta',
        'cyan',
        'white',
    ]

    /**
     * Web Terminal
     */
    var WebTerminal = function() {
        var $this = this;
        var $col = 1;
        var $row = 1;
        var $paint = new Paint();
        var $parser = new AnsiParser();
        var $cursor = document.createElement('DIV');
        var $terminal = document.createElement('DIV');
        var $container = document.createElement('DIV');
        var $canvas = new Canvas($terminal);
        var $connection = null;
        var $handlers = {
            /**
             * BACKSPACE
             */
            '8'  : function(event) {
                $connection.emit('send', { message : '\b' });
                return false;
            },

            '9'  : function(event) {
                $connection.emit('send', { message : '\t' });
                return false;
            },

            /**
             * ENTER
             */
            '13' : function(event) {
                $connection.emit('send', { message : '\r' });
                updateUI.call(this);
                $terminal.scrollByLines(1);
                return false;
            },

            /**
             * ESC
             */
            '27' : function(event) {
                $connection.emit('send', { message : String.fromCharCode(27) });
                return false;
            },

            /**
             * SPACE
             */
            '32' : function(event) {
                $connection.emit('send', { message : ' ' });
                return false;
            },

            /**
             * END
             */
            '35' : function(event) {
            },

            /**
             * HOME
             */
            '36' : function(event) {
            },

            /**
             * LEFT
             */
            '37' : function(event) {
            },

            /**
             * UP
             */
            '38' : function(event) {
            },

            /**
             * RIGHT
             */
            '39' : function(event) {
            },

            /**
             * DOWN
             */
            '40' : function(event) {
            },

            /**
             * DELETE
             */
            '46' : function(event) {
            },
        };
        var $contexts = {};
        var $renderers = {
            'BEL'  : function(token) {
                // console.log('\u0007');
            },
            'BS'   : function(token) {
                moveCursorTo.call(this, $row, $col - 1);
            },
            'CUU'  : function(token) {
                moveCursorTo.call(this, $row - token.value, $col);
            },
            'CUD'  : function(token) {
                moveCursorTo.call(this, $row + token.value, $col);
            },
            'CUF'  : function(token) {
                moveCursorTo.call(this, $row, $col + token.value);
            },
            'CUB'  : function(token) {
                moveCursorTo.call(this, $row, $col - token.value);
            },
            'CNL'  : function(token) {
                moveCursorTo.call(this, $row + token.value, 1);
            },
            'CPL'  : function(token) {
                moveCursorTo.call(this, $row - token.value, 1);
            },
            'CHA'  : function(token) {
                moveCursorTo.call(this, $row, token.value);
            },
            'CUP'  : function(token) {
                moveCursorTo.call(this, token.values[0], token.values[1]);
            },
            'ED'   : function(token) {
                switch (token.value) {
                case 0:
                    break;
                case 1:
                    break;
                case 2:
                    $row = 1;
                    $col = 1;
                    $canvas.clearRegion(0, 0, $canvas.width, $canvas.height);
                    break;
                }
            },
            'LF'   : function() {
                moveCursorTo.call(this, $row + 1, 1);
                updateUI.call(this);
            },
            'CR'   : function(token) {
                moveCursorTo.call(this, $row, 1);
                updateUI.call(this);
            },
            'EL'   : function(token) {
                switch (token.value) {
                case 0:
                    $canvas.clearRegion($col - 1, $row - 1, $canvas.width, $row);
                    break;
                case 1:
                    $canvas.clearRegion(0, $row - 1, $col - 1, $row);
                    break;
                case 2:
                    $canvas.clearRegion(0, $row - 1, $canvas.width, $row);
                    break;
                }
                updateUI.call(this);
            },
            'OSC'  : function(token) {
                this.title = token.image;
            },
            'SGR'  : function(token) {
            },
            'TEXT' : function(token) {
                $canvas.drawText(token.image, $col - 1, $row - 1);
                $col += token.image.length;
            },
        };

        Object.defineProperty(this, 'width', {
            get : function() {
                return $terminal.offsetParent.offsetWidth;
            },
        });

        Object.defineProperty(this, 'height', {
            get : function() {
                return $terminal.offsetParent.offsetHeight;
            },
        });

        Object.defineProperty(this, 'title', {
            get : function() {
                return document.title;
            },
            set : function(title) {
                document.title = title;
            }
        });

        /**
         * Start this web terminal
         * 
         * @param url {@link String}
         *           Connection URL
         * @param container {@link HTMLElement}
         *           DOM container of this terminal
         */
        this.start = function(url, container) {
            var $this = this;

            $connection = io.connect(url);
            $connection.on('output', function(data) {
                console.log(JSON.stringify(data));
                $parser.parse(data.message, function(token) {
                    var renderer = $renderers[token.type];

                    console.log(JSON.stringify(token));
                    renderer && renderer(token);
                });
                updateUI.call($this);
            });

            $cursor.setAttribute('class', 'cursor');
            $terminal.setAttribute('class', 'terminal');
            $terminal.setAttribute('tabindex', '-1');
            $container.setAttribute('class', 'terminal-container');

            $terminal.onkeydown = function(event) {
                var handler = $handlers[event.keyCode];

                if ('function' === typeof handler) {
                    return handler.call($this, event);
                }
            };

            $terminal.onkeypress = function(event) {
                $connection.emit('send', {
                    message : String.fromCharCode(event.keyCode)
                });
            };

            $terminal.onscroll = function(event) {
                updateCursor.call(this);
            };

            $container.appendChild($cursor);
            $container.appendChild($terminal);
            container.appendChild($container);
            $terminal.focus();
            resize.call(this);

            window.setInterval(function() {
                var className = $cursor.getAttribute('class');

                if (/blink/.test(className)) {
                    className = className.replace(/\s*blink/g, '');
                    $cursor.setAttribute('class', className);
                } else {
                    className += ' blink';
                    $cursor.setAttribute('class', className);
                }
            }, 500);
        };

        function resize() {
            var fm = $paint.measureText(' ');

            $container.style.width = $container.offsetParent.clientWidth;
            $container.style.height = $container.offsetParent.clientHeight;

            $cursor.style.width = fm.width + 'px';
            $cursor.style.height = fm.height + 'px';
            $terminal.style.width = this.width + 'px';
            $terminal.style.height = this.height + 'px';

            $canvas.resize(
                Math.floor(this.width / fm.width),
                Math.floor(this.height / fm.height)
            );
            $canvas.clearRegion(0, 0, $canvas.width, $canvas.height);

            $connection.emit('resize', {
                cols : $canvas.width,
                rows : $canvas.height,
            });

            updateUI.call(this);
        };

        function moveCursorTo(row, column) {
            $row = row;
            $col = column;
            updateCursor.call(this);
        }

        function updateCursor() {
            var fm = $paint.measureText(' ');

            $cursor.style.top = (($row - 1) * fm.height - $terminal.scrollTop) + 'px';
            $cursor.style.left = (($col - 1) * fm.width) + 'px';
        }

        function updateUI() {
            var n = $terminal.childNodes.length;

            updateCursor.call(this);
        }

        /*window.onresize = function() {
            resize.call($this);
        };*/
    };

    module.exports = WebTerminal;
});

