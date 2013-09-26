define(function(require, exports, module) {

    var Paint = require('www/paint');
    var Matrix = require('www/matrix');
    var Canvas = require('www/canvas');
    var AnsiParser = require('www/ansi');
    var VirtualKey = require('www/vkcode');

    var THEMES = {
        tango : {
            black   : ['#000000', '#555753'],
            red     : ['#cc0000', '#ef2929'],
            green   : ['#4e9a06', '#8ae234'],
            yellow  : ['#c4a000', '#fce94f'],
            blue    : ['#3465a4', '#729fcf'],
            magenta : ['#75507b', '#ad7fa8'],
            cyan    : ['#06989a', '#34e2e2'],
            white   : ['#d3d7cf', '#ffffff'],
        }
    }

    /**
     * Web Terminal
     */
    var WebTerminal = function() {
        var $this = this;
        var $col = 1;
        var $row = 1;
        var $theme = 'tango';
        var $paint = new Paint();
        var $parser = new AnsiParser();
        var $cursor = document.createElement('DIV');
        var $terminal = document.createElement('DIV');
        var $container = document.createElement('DIV');
        var $canvas = new Canvas($terminal);
        var $connection = null;
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
                this.title = token.title;
            },
            'SGR'  : function(token) {
                for (var i = 0; i < token.values.length; i++) {
                    var value = token.values[i];

                    switch (value) {
                    case 0:
                        $paint.reset();
                        break;
                    case 1:
                        $paint['font-weight'] = 'bold';
                        break;
                    case 7:
                        var fgcolor = $paint['color'];
                        var bgcolor = $paint['background-color'];

                        $paint['color'] = bgcolor;
                        $paint['background-color'] = fgcolor;
                        break;
                    case 30:
                        $paint['color'] = THEMES[$theme].black;
                        break;
                    case 31:
                        $paint['color'] = THEMES[$theme].red;
                        break;
                    case 32:
                        $paint['color'] = THEMES[$theme].green;
                        break;
                    case 33:
                        $paint['color'] = THEMES[$theme].yellow;
                        break;
                    case 34:
                        $paint['color'] = THEMES[$theme].blue;
                        break;
                    case 35:
                        $paint['color'] = THEMES[$theme].magenta;
                        break;
                    case 36:
                        $paint['color'] = THEMES[$theme].cyan;
                        break;
                    case 37:
                        $paint['color'] = THEMES[$theme].white;
                        break;
                    case 38:
                        break;
                    case 39:
                        $paint.reset('color');
                        break;
                    case 40:
                        $paint['background-color'] = THEMES[$theme].black;
                        break;
                    case 41:
                        $paint['background-color'] = THEMES[$theme].red;
                        break;
                    case 42:
                        $paint['background-color'] = THEMES[$theme].green;
                        break;
                    case 43:
                        $paint['background-color'] = THEMES[$theme].yellow;
                        break;
                    case 44:
                        $paint['background-color'] = THEMES[$theme].blue;
                        break;
                    case 45:
                        $paint['background-color'] = THEMES[$theme].magenta;
                        break;
                    case 46:
                        $paint['background-color'] = THEMES[$theme].cyan;
                        break;
                    case 47:
                        $paint['background-color'] = THEMES[$theme].white;
                        break;
                    case 48:
                        break;
                    case 49:
                        $paint.reset('background-color');
                        break;
                    }
                }
            },
            'TEXT' : function(token) {
                $canvas.drawText(token.image, $col - 1, $row - 1, $paint.isDefault() ? null : $paint);
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
                    renderer && renderer.call($this, token);
                });
                updateUI.call($this);
            });

            $cursor.setAttribute('class', 'cursor');
            $terminal.setAttribute('class', 'terminal');
            $terminal.setAttribute('tabindex', '-1');
            $container.setAttribute('class', 'terminal-container');

            $terminal.onkeydown = function(event) {
                switch (event.keyCode) {
                case VirtualKey.VK_BACK:
                    $connection.emit('send', { message : '\b' });
                    return false;
                case VirtualKey.VK_TAB:
                    $connection.emit('send', { message : '\t' });
                    return false;
                case VirtualKey.VK_RETURN:
                    $connection.emit('send', { message : '\n' });
                    return false;
                case VirtualKey.VK_ESCAPE:
                    $connection.emit('send', { message : '\u001b' });
                    return false;
                case VirtualKey.VK_LEFT:
                case VirtualKey.VK_UP:
                case VirtualKey.VK_RIGHT:
                case VirtualKey.VK_DOWN:
                    $connection.emit('send', { message : String.fromCharCode(event.keyCode) });
                    return false;
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

        function isFunctionKey(keyCode) {
            return (keyCode >= 0x70 && keyCode <= 0x7B);
        }

        /*window.onresize = function() {
            resize.call($this);
        };*/
    };

    module.exports = WebTerminal;
});

