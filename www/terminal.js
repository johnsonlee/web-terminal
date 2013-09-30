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
        var $state = {};
        var $theme = 'tango';
        var $paint = new Paint(DEFAULT_PAINT);
        var $parser = new AnsiParser();
        var $cursor = document.createElement('DIV');
        var $terminal = document.createElement('DIV');
        var $container = document.createElement('DIV');
        var $canvas = new Canvas($terminal);
        var $connection = null;
        var $renderers = {
            /*
             * Sounds the bell tone
             */
            'BEL'  : function(token) {
                // console.log('\u0007');
            },

            /*
             * Moves the cursor one character position to the left
             */
            'BS'   : function(token) {
                moveCursorTo.call(this, $row, $col - 1);
            },

            /*
             * Save the following items:
             * - Cursor position
             * - Character attributes (SGR)
             * - GL and GR state
             * - Wrap flag
             * - Origin mode state
             * - Selective erase attribute (DECSCA)
             * - Any single SS2 or SS3 functions sent
             */
            'DECSC' : function(token) {
                $state.col = $col;
                $state.row = $row;
                $state.paint = $paint;
                $state.scrollTop = $terminal.scrollTop;
                $col = $row = 1;
                $paint = new Paint(DEFAULT_PAINT);
            },

            /*
             * Restores the terminal to the state saved by
             * the save cursor (DECSC) function.
             */
            'DECRC' : function(token) {
                $col = $state.col;
                $row = $state.row;
                $paint = $state.paint;
                $terminal.scrollTop = $state.scrollTop;
            },

            /*
             * Sets DEC/xterm specific modes.
             */
            'DECSET' : function(token) {
                for (var i = 0; i < token.values.length; i++) {
                    var value = token.values[i];

                    switch (value) {
                    case 1:  // Application cursor keys
                        $state.cursorKeyMode = WebTerminal.APPLICATION_CURSOR_KEY_MODE;
                        break;
                    case 6:  // Enable origin mode
                        $state.originMode = true;
                        break;
                    case 47: // Swith to alternate screen buffer
                        $state.alternateMode = true;
                        $state.canvas = $canvas;
                        $state.norscrn = [];

                        while ($terminal.lastChild) {
                            var line = $terminal.removeChild($terminal.lastChild);
                            $state.norscrn.push(line);
                        }

                        $canvas = new Canvas($terminal);
                        $canvas.resize($state.canvas.width, $state.canvas.height);
                        $canvas.clearRegion(0, 0, $canvas.width, $canvas.height);
                        break;
                    case 1000: // Enable normal mouse tracking
                        $state.mouseTrackable = true;
                        break;
                    }
                }
            },

            /*
             * Resets DEC/xterm specific modes.
             */
            'DECRST' : function(token) {
                for (var i = 0; i < token.values.length; i++) {
                    var value = token.values[i];

                    switch (value) {
                    case 1:  // Normal cursor key
                        $state.cursorKeyMode = WebTerminal.NORMAL_CURSOR_KEY_MODE;
                        break;
                    case 6:  // Disable origin mode
                        $state.originMode = false;
                        break;
                    case 47: // Swith to normal screen buffer
                        $state.alternateMode = false;

                        while ($terminal.lastChild) {
                            $terminal.removeChild($terminal.lastChild);
                        }

                        while ($state.norscrn.length > 0) {
                            $terminal.appendChild($state.norscrn.pop());
                        }

                        $canvas = $state.canvas;
                        break;
                    case 1000: // Disable mouse tracking
                        $state.mouseTrackable = false;
                        break;
                    }
                }
            },

            /*
             * Using application keypad mode
             */
            'DECKPAM' : function(token) {
                $state.keypadMode = WebTerminal.APPLICATION_KEYPAD_MODE;
            },

            /*
             * Using normal keypad mode
             */
            'DECKPNM' : function(token) {
                $state.keypadMode = WebTerminal.NORMAL_KEYPAD_MODE;
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

            /*
             * Erase display
             */
            'ED'   : function(token) {
                switch (token.value) {
                case 0:
                    break;
                case 1:
                    break;
                case 2:
                    if ($state.alternateMode) {
                        $canvas.clearRegion(0, 0, $canvas.width, $canvas.height);
                        $row = 1;
                        $col = 1;
                    } else {
                        $canvas.clear();
                        $row = 1;
                        $col = 1;
                    }
                    break;
                }
            },

            /*
             * Move cursor to first position on next line.
             * If cursor is at bottom margin, then screen
             * performs a scroll-up.
             */
            'LF'   : function() {
                var height = $canvas.height;

                if ($row + 1 > $canvas.height) {
                    $canvas.appendLine();
                    $canvas.scrollOut(height);
                    $terminal.scrollTop = $terminal.scrollHeight;
                }

                moveCursorTo.call(this, Math.min($row + 1, height), 1);

                if ($row > $canvas.marginBottom) {
                    $canvas.scrollUp($row - 1, 1);
                }
            },

            'CR' : function(token) {
                moveCursorTo.call(this, $row, 1);
            },

            /*
             * Inserts on or more blank lines, starting at
             * the cursor.
             * 
             * As lines are inserted, lines below the
             * cursor and in the scrolling region move
             * down. Lines scrolled off the page are lost.
             */
            'IL' : function(token) {
                $canvas.scrollDown($row, token.value);
            },

            /*
             * Deletes specified number of lines in the scrolling region.
             * As lines are deleted, lines below the cursor and in the
             * scrolling region move up. The terminal add blank lines with
             * no visual character attributes at the bottom of scrolling
             * region.
             */
            'DL' : function(token) {
                $canvas.scrollUp($row - 1, token.value);
            },

            /*
             * Delete specified number of characters from
             * the cursor position to the right.
             */
            'DCH' : function(token) {
                $canvas.clearRegion($col - 1, $row - 1, $col + token.value + 1, $row);
            },

            /*
             * Moves the cursor up one line in the same
             * column. If the cursor is at the top margin,
             * the page scrolls down.
             */
            'RI' : function(token) {
                if ($row == $canvas.marginTop) {
                    $canvas.scrollDown($row, 1);
                }

                moveCursorTo.call(this, Math.max(1, $row - 1), $col);
            },

            /*
             * Erase in line
             */
            'EL' : function(token) {
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

            /*
             * Operating system command
             */
            'OSC'  : function(token) {
                this.title = token.title;
            },

            /*
             * Select graphics rendition
             */
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

            /*
             * Set top and bottom margin
             */
            'DECSTBM' : function(token) {
                moveCursorTo.call(this, 1, 1);
                $canvas.marginTop = token.values[0];
                $canvas.marginBottom = token.values[1];
            },

            /*
             * Set left and right margin. It's used for screen scrolling
             */
            'DECSLRM' : function(token) {
                moveCursorTo.call(this, 1, 1);
            },

            /*
             * Set left and right margin mode
             */
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

                    try {
                        renderer && renderer.call($this, token);
                    } catch (e) {
                        console.error(e.stack);
                    }
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
                /*case VirtualKey.VK_F11:
                    $connection.emit('send', {
                        message : '\x1b[23~',
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    break;*/
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

            var cols = Math.floor(this.width / fm.width);
            var rows = Math.floor(this.height / fm.height);
            $cursor.style.width = fm.width + 'px';
            $cursor.style.height = fm.height + 'px';
            $terminal.style.width = this.width + 'px';
            $terminal.style.height = (fm.height * rows) + 'px';
            $terminal.style.paddingBottom = (this.height - fm.height * rows) + 'px';

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

    WebTerminal.NORMAL_KEYPAD_MODE = 0;
    WebTerminal.APPLICATION_KEYPAD_MODE = 1;
    WebTerminal.NORMAL_CURSOR_KEY_MODE = 0;
    WebTerminal.APPLICATION_CURSOR_KEY_MODE = 1;

    module.exports = WebTerminal;
});

