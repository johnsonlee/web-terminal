define(function(require, exports, module) {

    var Graphics = require('www/graphics');
    var AnsiParser = require('www/ansi');

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
        var $cursor = document.createElement('DIV');
        var $terminal = document.createElement('DIV');
        var $container = document.createElement('DIV');
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
            '23' : function(event) {
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
                console.log('\u0007');
            },
            'ED'   : function() {
                while ($terminal.firstChild) {
                    $terminal.removeChild($terminal.firstChild);
                }

                $row = 0;
                $col = 0;
            },
            'LF'   : function() {
                $col = 0;

                if (++$row > $rows) {
                    newLine.call(this);
                }

                updateUI.call(this);
            },
            'CR'   : function(token) {
                $col = 0;
                updateUI.call(this);
            },
            'EL'   : function(token) {
                var line = $terminal.childNodes[$row];

                if (line.lastChild) {
                    line.removeChild(line.lastChild);
                }

                $col--;
                updateUI.call(this);
            },
            'OSC'  : function(token) {
                document.title = token.title;
            },
            'SGR'  : function(token) {
                var ctx = $contexts[token.type];

                if (!ctx) {
                    ctx = [];
                    $contexts['SGR'] = ctx;
                }

                if (token.values[0]) {
                    ctx.push(token);
                } else {
                    ctx.pop();
                }
            },
            'TEXT' : function(token) {
                var styles = [];
                var len = token.image.length;
                var text = document.createTextNode(token.image);
                var line = $terminal.childNodes[$row] || newLine.call(this);
                var sgrctx = $contexts['SGR'];

                if (sgrctx && sgrctx.length) {
                    var sgr = sgrctx[sgrctx.length - 1];

                    for (var i = 0; i < sgr.values.length; i++) {
                        switch (sgr.values[i]) {
                        case 1:
                            styles.push('font-style:bold');
                            break;
                        case 4:
                            styles.push('border-bottom:1px');
                            break;
                        case 30:
                            styles.push('color:black');
                            break;
                        case 31:
                            styles.push('color:red');
                            break;
                        case 32:
                            styles.push('color:green');
                            break;
                        case 33:
                            styles.push('color:yellow');
                            break;
                        case 34:
                            styles.push('color:blue');
                            break;
                        case 35:
                            styles.push('color:magenta');
                            break;
                        case 36:
                            styles.push('color:cyan');
                            break;
                        case 37:
                            styles.push('color:white');
                            break;
                        case 40:
                            styles.push('background-color:black');
                            break;
                        case 41:
                            styles.push('background-color:red');
                            break;
                        case 42:
                            styles.push('background-color:green');
                            break;
                        case 43:
                            styles.push('background-color:yellow');
                            break;
                        case 44:
                            styles.push('background-color:blue');
                            break;
                        case 45:
                            styles.push('background-color:magenta');
                            break;
                        case 46:
                            styles.push('background-color:cyan');
                            break;
                        case 47:
                            styles.push('background-color:white');
                            break;
                        }
                    }
                }

                if (styles.length) {
                    var span = document.createElement('SPAN');
                    line.appendChild(span);
                    span.appendChild(text);
                    span.setAttribute('style', styles.join(';'));
                } else {
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
                $contexts = {};
                console.log(JSON.stringify(data));
                $parser.parse(data.message, function(token) {
                    console.log(JSON.stringify(token));
                    var renderer = $renderers[token.type];

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
            updateCursor.call(this);
        }

        window.onresize = function() {
            resize.call($this);
        };
    };

    module.exports = WebTerminal;
});

