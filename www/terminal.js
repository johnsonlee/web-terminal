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

    var DEFAULT_PAINT = {
        'reverse-video'    : false,
        'color'            : THEMES.tango.white,
        'background-color' : THEMES.tango.black,
        'font-size'        : '11pt',
        'font-family'      : 'Courier, Courier New',
        'font-weight'      : 'normal',
    };

    /**
     * Web Terminal
     */
    var WebTerminal = function() {
        var $this = this;
        var $col = 1;
        var $row = 1;
        var $theme = 'tango';
        var $paint = new Paint(DEFAULT_PAINT);
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
            'IL'   : function(token) {
                $canvas.insertLine($row - 1, token.value);
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
                    var attr = null;
                    var value = token.values[i];

                    switch (value) {
                    case 0:
                        $paint.reset();
                        break;
                    case 1:
                        $paint['font-weight'] = 'bold';
                        break;
                    case 7:
                        $paint['reverse-video'] = true;
                        break;
                    case 30:
                    case 31:
                    case 32:
                    case 33:
                    case 34:
                    case 35:
                    case 36:
                    case 37:
                        $paint['color'] = THEMES[$theme][Object.keys(THEMES[$theme])[value - 30]];
                        break;
                    case 38:
                        break;
                    case 39:
                        $paint.reset('color');
                        break;
                    case 40:
                    case 41:
                    case 42:
                    case 43:
                    case 44:
                    case 45:
                    case 46:
                    case 47:
                        $paint['background-color'] = THEMES[$theme][Object.keys(THEMES[$theme])[value - 40]];
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
            'DECSTBM' : function(token) {
                moveCursorTo.call(this, 1, 1);
                $canvas.setVerticalMargin(token.values[0], token.values[1]);
            },
            'DECSLRM' : function(token) {
                moveCursorTo.call(this, 1, 1);
                $canvas.setHorizontalMargin(token.values[0], token.values[1]);
            },
            'DECLRMM' : function(token) {
                // TODO
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
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_TAB:
                    $connection.emit('send', { message : '\t' });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_RETURN:
                    $connection.emit('send', { message : '\n' });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_ESCAPE:
                    $connection.emit('send', { message : '\x1b' });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_UP:
                    $connection.emit('send', { message : '\x1bOA' });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_DOWN:
                    $connection.emit('send', { message : '\x1bOB' });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_RIGHT:
                    $connection.emit('send', { message : '\x1bOC' });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_LEFT:
                    $connection.emit('send', { message : '\x1bOD' });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F1:
                    $connection.emit('send', {
                        message : '\x1bOP',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F2:
                    $connection.emit('send', {
                        message : '\x1bOQ',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F3:
                    $connection.emit('send', {
                        message : '\x1bOR',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F4:
                    $connection.emit('send', {
                        message : '\x1bOS',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F5:
                    $connection.emit('send', {
                        message : '\x1b[15~',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F6:
                    $connection.emit('send', {
                        message : '\x1b[17~',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F7:
                    $connection.emit('send', {
                        message : '\x1b[18~',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F8:
                    $connection.emit('send', {
                        message : '\x1b[19~',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F9:
                    $connection.emit('send', {
                        message : '\x1b[20~',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F10:
                    $connection.emit('send', {
                        message : '\x1b[21~',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F11:
                    $connection.emit('send', {
                        message : '\x1b[23~',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                case VirtualKey.VK_F12:
                    $connection.emit('send', {
                        message : '\x1b[24~',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                default:
                    if (0x40 <= event.keyCode && event.keyCode <= 0x5F) {
                        if (event.ctrlKey) {
                            $connection.emit('send', {
                                message : String.fromCharCode(event.keyCode - 0x40),
                            });
                            event.preventDefault();
                            event.stopPropagation();
                            break;
                        }
                    }
                    break;
                }
            };

            $terminal.onkeypress = function(event) {
                $connection.emit('send', {
                    message : String.fromCharCode(event.keyCode)
                });
            };

            $terminal.onmousewheel = function(event) {
                var fm = $paint.measureText(' ');
                var lines = Math.floor(event.wheelDelta / fm.height);

                if (Math.abs(lines) > 0) {
                    $connection.emit('send', {
                        message : '\x1b[' + Math.abs(lines) + (lines > 0 ? 'T' : 'S'),
                    });
                }
            };

            $terminal.onscroll = function(event) {
                // updateCursor.call(this);
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

