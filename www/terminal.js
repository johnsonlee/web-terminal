define(function(require, exports, module) {

    var Graphics = require('www/graphics');
    var AnsiParser = require('www/ansi');
    var StringBuffer = require('www/stringbuffer');

    var font = {
        style  : 'normal',
        size   : '12pt',
        family : 'Courier, Courier New',
    };

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
        var $col = 0;
        var $row = 0;
        var $cols = 0;
        var $rows = 0;
        var $parser = new AnsiParser();
        var $stdin = new StringBuffer();
        var $stdout = new StringBuffer();
        var $cursor = document.createElement('DIV');
        var $terminal = document.createElement('DIV');
        var $container = document.createElement('DIV');
        var $connection = null;
        var $handlers = {
            /**
             * BACKSPACE
             */
            '8'  : function(event) {
                //var c = $col - 1;

                //$col = ((c + $cols) % $cols) || $cols - 1;
                //$row -= Math.floor(($cols - c) / $cols);
                //updateCursor.call(this);
            },

            /**
             * ENTER
             */
            '13' : function(event) {
                $connection.emit('send', {
                    message : $stdin.data,
                });

                $stdin.clear();
                //$row++;
                updateUI.call(this);
                $terminal.scrollByLines(1);
            },

            /**
             * ESC
             */
            '23' : function(event) {
            },

            /**
             * SPACE
             */
            '32' : function(event) {
                //var c = $col + 1;

                //$col = c % $cols;
                //$row += Math.floor(c / $cols);
                //updateCursor.call(this);
            },

            /**
             * END
             */
            '35' : function(event) {
                //$col = $cols;
                //updateCursor.call(this);
            },

            /**
             * HOME
             */
            '36' : function(event) {
                //$col = 0;
                //updateCursor.call(this);
            },

            /**
             * LEFT
             */
            '37' : function(event) {
                //$col = Math.max(0, $col - 1);
                //updateCursor.call(this);
            },

            /**
             * UP
             */
            '38' : function(event) {
                //$row = Math.max(0, $row - 1);
                //updateCursor.call(this);
            },

            /**
             * RIGHT
             */
            '39' : function(event) {
                //$col = Math.min($cols, $col + 1);
                //updateCursor.call(this);
            },

            /**
             * DOWN
             */
            '40' : function(event) {
                //$row = Math.min($rows, $row + 1);
                //updateCursor.call(this);
            },

            /**
             * DELETE
             */
            '46' : function(event) {
            },
        };
        var $renderers = {
            'CR'   : function(it) {
                $col = 0;

                if (++$row > $rows) {
                    newLine.call(this);
                }
            },
            'CRLF' : function(it) {
                $col = 0;

                if (++$row > $rows) {
                    newLine.call(this);
                }
            },
            'TEXT' : function(it) {
                var token = it.data;
                var len = token.image.length;

                if (it.prev && 'OSC' == it.prev.data.id) {
                    return;
                }

                var line = $terminal.childNodes[$row]
                        || newLine.call(this);

                if (it.prev && AnsiParser.isBeginOfSGR(it.prev.data)
                    && it.next && AnsiParser.isEndOfSGR(it.next.data)) {
                    var span = document.createElement('SPAN');
                    var params = it.prev.data.params;
                    var styles = [];

                    for (var i = 0; i < params.length; i++) {
                        var param = params[i];

                        switch (param) {
                        case '01':
                            styles.push('font-weight:bold');
                            break;
                        case '30':
                        case '31':
                        case '32':
                        case '33':
                        case '34':
                        case '35':
                        case '36':
                        case '37':
                            styles.push('color:' + COLORS[parseInt(param) - 30]);
                            break;
                        }
                    }

                    span.innerText = token.image;
                    span.setAttribute('style', styles.join(';'));
                    line.appendChild(span);
                } else {
                    var text = document.createTextNode(token.image);

                    line.appendChild(text);
                }

                $col += len;
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

        Object.defineProperty(this, 'rows', {
            get : function() {
                return $rows;
            }
        });

        Object.defineProperty(this, 'columns', {
            get : function() {
                return $cols;
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
                $stdout.append(data.message);
                updateUI.call(this);
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
                $stdin.append(String.fromCharCode(event.keyCode));
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
            var fm = Graphics['2d'].getFontMetrics(font);

            $container.style.width = $container.offsetParent.clientWidth;
            $container.style.height = $container.offsetParent.clientHeight;

            $cursor.style.width = fm.width + 'px';
            $cursor.style.height = fm.height + 'px';
            $terminal.style.width = this.width + 'px';
            $terminal.style.height = this.height + 'px';

            $cols = Math.floor(this.width / fm.width);
            $rows = Math.floor(this.height / fm.height);

            $connection.emit('resize', {
                cols : $cols,
                rows : $rows,
            });

            updateUI.call(this);
        };

        function newLine() {
            var line = document.createElement('DIV');

            $terminal.appendChild(line);
            $terminal.scrollByLines(1);

            return line;
        }

        function updateCursor() {
            var fm = Graphics['2d'].getFontMetrics(font);

            $cursor.style.top = ($row * fm.height - $terminal.scrollTop) + 'px';
            $cursor.style.left = ($col * fm.width) + 'px';
        }

        function updateUI() {
            var n = $terminal.childNodes.length;

            $rows = Math.max($rows, $row);

            if ($stdout.length > 0) {
                $parser.parse($stdout.data, function(token) {
                    console.log(token.image);
                });
                $stdout.clear();
            }

            updateCursor.call(this);
        }

        window.onresize = function() {
            resize.call($this);
        };
    };

    module.exports = WebTerminal;
});

