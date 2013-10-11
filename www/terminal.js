define(function(require, exports, module) {

    var Paint = require('./paint');
    var Matrix = require('./matrix');
    var Canvas = require('./canvas');
    var AnsiParser = require('./ansi');
    var VirtualKey = require('./vkcode');

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
        },
    }

    var DEFAULT_PAINT = {
        'reverse-video'    : false,
        'color'            : THEMES.tango.white,
        'background-color' : THEMES.tango.black,
        'font-size'        : '11pt',
        'font-family'      : 'Courier, Courier New',
        'font-weight'      : 'normal',
    };

    var BOX_DRAWING_CHARS = {
        'j' : '┘',
        'k' : '┐',
        'l' : '┌',
        'm' : '└',
        'n' : '┼',
        'q' : '─',
        't' : '├',
        'u' : '┤',
        'v' : '┴',
        'w' : '┬',
        'x' : '│',
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
        var $charset = 0;
        var $charsets = [];
        var $name = null;
        var $interval = null;
        var $connection = null;
        var $resize = window.resize;
        var $cursor = document.createElement('DIV');
        var $terminal = document.createElement('DIV');
        var $container = document.createElement('DIV');
        var $parser = new AnsiParser();
        var $canvas = new Canvas($terminal);
        var $paint = new Paint(DEFAULT_PAINT);
        var $renderers = {
            /*
             * Sounds the bell tone
             */
            'BEL' : function(token) {
                // console.log('\u0007');
            },

            /*
             * Moves the cursor one character position to the left
             */
            'BS' : function(token) {
                this.moveCursorTo($row, $col - 1);
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
                $state.charset = $charset;
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
                $charset = $state.charset;
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
                    case 9: // Enable X10 mouse tracking
                        $state.x10MouseTrackable = true;
                        break;
                    case 1000: // Enable X11 mouse tracking
                        $state.x11MouseTrackable = true;
                        break;
                    case 1002: // Enable button-event mouse tracking
                        $state.buttonEventMouseTrackable = true;
                        break;
                    case 1003: // Enable any-event mouse tracking
                        $state.anyEventMouseTrackable = true;
                        break;
                    case 47: // Swith to alternate screen buffer
                    case 1047:
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
                    case 69: // Enable left and right margin
                        $state.vspmode = true;
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
                    case 9: // Enable X10 mouse tracking
                        $state.x10MouseTrackable = false;
                        break;
                    case 1000: // Enable X11 mouse tracking
                        $state.x11MouseTrackable = false;
                        break;
                    case 1002: // Enable button-event mouse tracking
                        $state.buttonEventMouseTrackable = false;
                        break;
                    case 1003: // Enable any-event mouse tracking
                        $state.anyEventMouseTrackable = false;
                        break;
                    case 47: // Swith to normal screen buffer
                    case 1047:
                        $state.alternateMode = false;

                        while ($terminal.lastChild) {
                            $terminal.removeChild($terminal.lastChild);
                        }

                        while ($state.norscrn.length > 0) {
                            $terminal.appendChild($state.norscrn.pop());
                        }

                        $canvas = $state.canvas;
                        break;
                    case 69: // Disable left and right margin
                        $state.vspmode = false;
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

            'CUU' : function(token) {
                this.moveCursorTo($row - token.value, $col);
            },
            'CUD' : function(token) {
                this.moveCursorTo($row + token.value, $col);
            },
            'CUF' : function(token) {
                this.moveCursorTo($row, $col + token.value);
            },
            'CUB' : function(token) {
                this.moveCursorTo($row, $col - token.value);
            },
            'CNL' : function(token) {
                this.moveCursorTo($row + token.value, 1);
            },
            'CPL' : function(token) {
                this.moveCursorTo($row - token.value, 1);
            },
            'CHA' : function(token) {
                this.moveCursorTo($row, token.value);
            },
            'CUP' : function(token) {
                this.moveCursorTo(token.values[0], token.values[1]);
            },

            /*
             * Erase display
             */
            'ED' : function(token) {
                switch (token.value) {
                case 0:
                    break;
                case 1:
                    break;
                case 2:
                    if ($state.alternateMode) {
                        $canvas.clearRegion(0, 0, $canvas.width, $canvas.height);
                    } else {
                        $canvas.clear();
                    }

                    this.moveCursorTo(1, 1);
                    break;
                }
            },

            /*
             * Move cursor to first position on next line.
             * If cursor is at bottom margin, then screen
             * performs a scroll-up.
             */
            'LF' : function() {
                var height = $canvas.height;

                if ($row + 1 > $canvas.height) {
                    $canvas.appendLine();
                    $canvas.scrollOut(height);
                    $terminal.scrollTop = $terminal.scrollHeight;
                }

                this.moveCursorTo(Math.min($row + 1, height), 1);

                if ($row > $canvas.marginBottom) {
                    $canvas.scrollUp($row - 1, 1);
                }
            },

            'CR' : function(token) {
                this.moveCursorTo($row, 1);
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

                this.moveCursorTo(Math.max(1, $row - 1), $col);
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

                this.updateUI();
            },

            /*
             * Operating system command
             */
            'OSC' : function(token) {
                this.title = token.title;
            },

            /*
             * Select graphics rendition
             */
            'SGR' : function(token) {
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
                var text = token.image;
                var paint = $paint.isDefault() ? null : $paint;

                switch ($charsets[$charset]) {
                case WebTerminal.CHARSET_ASCII:
                    break;
                case WebTerminal.CHARSET_LINEDRAW:
                    for (var i in BOX_DRAWING_CHARS) {
                        text = text.replace(new RegExp(i, 'gm'), BOX_DRAWING_CHARS[i]);
                    }
                    break;
                case WebTerminal.CHARSET_GBCHR:
                    break;
                case WebTerminal.CHARSET_SCOACS:
                    break;
                }

                $canvas.drawText(text, $col - 1, $row - 1, paint);
                $col += token.image.length;
            },

            /*
             * Set top and bottom margin
             * Moves the cursor to column 1, line 1 of the page
             */
            'DECSTBM' : function(token) {
                this.moveCursorTo(1, 1);
                $canvas.marginTop = token.values[0];
                $canvas.marginBottom = token.values[1];
            },

            /*
             * Set left and right margin
             * Moves the cursor to column 1, line 1 of the page
             */
            'DECSLRM' : function(token) {
                if ($state.vspmode) {
                    this.moveCursorTo(1, 1);
                }
            },

            /*
             * Set left and right margin mode
             */
            'DECLRMM' : function(token) {
                $state.vspmode = true;
            },

            /*
             * Map G1 to GL
             */
            'G1D4' : function(token) {
                switch (token.value) {
                case 0x30: /* 0 */
                    $charsets[1] = WebTerminal.CHARSET_LINEDRAW;
                    break;
                case 0x41: /* A */
                    $charsets[1] = WebTerminal.CHARSET_GBCHR;
                    break;
                case 0x42: /* B */
                    $charsets[1] = WebTerminal.CHARSET_ASCII;
                    break;
                case 0x55: /* U */
                    $charsets[1] = WebTerminal.CHARSET_SCOACS;
                    break;
                }
            },

            'GZD4' : function(token) {
                switch (token.value) {
                case 0x30: /* 0 */
                    $charsets[0] = WebTerminal.CHARSET_LINEDRAW;
                    break;
                case 0x41: /* A */
                    $charsets[0] = WebTerminal.CHARSET_GBCHR;
                    break;
                case 0x42: /* B */
                    $charsets[0] = WebTerminal.CHARSET_ASCII;
                    break;
                case 0x55: /* U */
                    $charsets[0] = WebTerminal.CHARSET_SCOACS;
                    break;
                }
            },

            /*
             * Maps G0 character set into GL
             */
            'LS0' : function(token) {
                $charset = 0;
            },

            /*
             * Maps G1 character set into GL
             */
            'LS1' : function(token) {
                $charset = 1;
            },

            /*
             * Maps G2 character set into GL
             */
            'LS2' : function(token) {
                $charset = 1;
            },

            /*
             * Maps G3 character set into GL
             */
            'LS3' : function(token) {
                $charset = 1;
            },

            /*
             * Maps G0 character set into GR
             */
            'LS0R' : function(token) {
                $charset = 0;
            },

            /*
             * Maps G1 character set into GR
             */
            'LS1R' : function(token) {
                $charset = 1;
            },

            /*
             * Maps G2 character set into GR
             */
            'LS2R' : function(token) {
                $charset = 1;
            },

            /*
             * Maps G3 character set into GR
             */
            'LS3R' : function(token) {
                $charset = 1;
            },

            /*
             * Maps G1 character set into GL
             */
            'SO' : function(token) {
                $charset = 1;
            },

            /*
             * Maps G0 character set to GL
             */
            'SI' : function(token) {
                $charset = 0;
            },
        };

        /**
         * @type {link Number}
         * 
         * The number of columns
         */
        Object.defineProperty(this, 'width', {
            get : function() {
                return $terminal.offsetParent.offsetWidth;
            },
        });

        /**
         * @type {link Number}
         * 
         * The number of rows
         */
        Object.defineProperty(this, 'height', {
            get : function() {
                return $terminal.offsetParent.offsetHeight;
            },
        });

        /**
         * @type {@link String}
         * 
         * The title of this terminal
         */
        Object.defineProperty(this, 'title', {
            get : function() {
                return document.title;
            },
            set : function(title) {
                document.title = title;
            }
        });

        Object.defineProperty(this, 'name', {
            get : function() {
                return $name;
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
        this.run = function(url, container) {
            if ($connection) {
                return;
            }

            var $this = this;

            container.appendChild($container);

            $connection = io.connect(url);
            $connection.on('connect', function() {
                $this.active();
            }).on('reconnecting', function() {
                $this.inactive();
            }).on('disconnect', function() {
                $this.inactive();
            }).on('terminal.output', function(data) {
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

                $this.updateUI();
            }).on('terminal.exit', function() {
                $this.inactive();
            });

            $cursor.setAttribute('class', 'cursor');

            $container.appendChild($cursor);
            $container.appendChild($terminal);
            $container.setAttribute('class', 'terminal-container');

            $terminal.setAttribute('class', 'terminal');
            $terminal.setAttribute('tabindex', '-1');

            this.measureLayout(function(cols, rows) {
                $connection.emit('terminal.open', {
                    cols : cols,
                    rows : rows,
                    name : $name,
                }, function(data) {
                    $name = data.name;
                });
            });
        };

        /**
         * Exit this terminal
         */
        this.exit = function() {
            if ($connection) {
                $connection.emit('terminal.close');
            }
        };

        /**
         * Measure the terminal layout
         * 
         * @param callback {@link Function}
         *           A callback function
         */
        this.measureLayout = function(callback) {
            var fm = $paint.measureText(' ');

            $container.style.width = $container.offsetParent.clientWidth + 'px';
            $container.style.height = $container.offsetParent.clientHeight + 'px';

            var cols = Math.floor(this.width / fm.width);
            var rows = Math.floor(this.height / fm.height);

            $cursor.style.width = fm.width + 'px';
            $cursor.style.height = fm.height + 'px';

            $terminal.style.width = this.width + 'px';
            $terminal.style.height = (fm.height * rows) + 'px';
            $terminal.style.paddingBottom = (this.height - fm.height * rows) + 'px';

            $canvas.resize(cols, rows);
            $canvas.clearRegion(0, 0, $canvas.width, $canvas.height);

            this.updateUI();

            if ('function' === typeof callback) {
                callback(cols, rows);
            }
        };

        /**
         * Move cursor the the specified position
         * 
         * @param row {@link Number}
         *           The row number where cursor move to
         * @param column {@link Number}
         *           The column number where cursor move to
         */
        this.moveCursorTo = function(row, column) {
            $row = row;
            $col = column;

            this.updateUI();
        }

        /**
         * Update the terminal UI
         */
        this.updateUI = function() {
            var fm = $paint.measureText(' ');
            var lines = $terminal.childNodes.length;
            var line = lines - $canvas.height + $row;

            $cursor.style.top = ((line - 1) * fm.height - $terminal.scrollTop) + 'px';
            $cursor.style.left = (($col - 1) * fm.width) + 'px';
        }

        /**
         * Inactive this terminal
         */
        this.inactive = function() {
            if ($interval) {
                window.clearInterval($interval);
            }

            $terminal
            .on('blur')
            .on('focus')
            .on('scroll')
            .on('keypress')
            .on('mousewheel');

            window
            .on('unload')
            .on('resize', $resize);

            $cursor.setAttribute('class', 'cursor steady');
        };

        /**
         * Active this terminal
         */
        this.active = function() {
            $terminal.on('keydown', function(event) {
                var seq = [];

                switch (event.keyCode) {
                case VirtualKey.VK_BACK:
                    if (event.shiftKey) {
                        // TODO
                    } else {
                        seq.push('\b');
                    }
                    break;
                case VirtualKey.VK_TAB:
                    if (event.shiftKey) {
                        seq.push('\x1b[Z');
                    } else {
                        seq.push('\t');
                    }
                    break;
                case VirtualKey.VK_RETURN:
                    if (event.altKey) {
                        // TODO toggleFullscreen();
                    } else {
                        seq.push('\n');
                    }
                    break;
                case VirtualKey.VK_ESCAPE:
                    seq.push('\x1b');
                    break;
                case VirtualKey.VK_SPACE:
                    seq.push('\x20');
                    break;
                case VirtualKey.VK_PRIOR:
                    seq.push('\x1b[5~');
                    break;
                case VirtualKey.VK_NEXT:
                    seq.push('\x1b[6~');
                    break;
                case VirtualKey.VK_HOME:
                    seq.push('\x1bOH');
                    break;
                case VirtualKey.VK_END:
                    seq.push('\x1bOF');
                    break;
                case VirtualKey.VK_UP:
                    if (event.altKey) {
                        seq.push('\x1b[1;3A');
                    } else {
                        seq.push('\x1bOA');
                    }
                    break;
                case VirtualKey.VK_DOWN:
                    if (event.altKey) {
                        seq.push('\x1b[1;3B');
                    } else {
                        seq.push('\x1bOB');
                    }
                    break;
                case VirtualKey.VK_RIGHT:
                    if (event.altKey) {
                        seq.push('\x1b[1;3C');
                    } else {
                        seq.push('\x1bOC');
                    }
                    break;
                case VirtualKey.VK_LEFT:
                    if (event.altKey) {
                        seq.push('\x1b[1;3D');
                    } else {
                        seq.push('\x1bOD');
                    }
                    break;
                case VirtualKey.VK_INSERT:
                    seq.push('\x1b[2~');
                    break;
                case VirtualKey.VK_DELETE:
                    seq.push('\x1b[3~');
                    break;
                case VirtualKey.VK_F1:
                    seq.push('\x1bOP');
                    break;
                case VirtualKey.VK_F2:
                    seq.push('\x1bOQ');
                    break;
                case VirtualKey.VK_F3:
                    seq.push('\x1bOR');
                    break;
                case VirtualKey.VK_F4:
                    seq.push('\x1bOS');
                    break;
                case VirtualKey.VK_F5:
                    seq.push('\x1b[15~');
                    break;
                case VirtualKey.VK_F6:
                    seq.push('\x1b[17~');
                    break;
                case VirtualKey.VK_F7:
                    seq.push('\x1b[18~');
                    break;
                case VirtualKey.VK_F8:
                    seq.push('\x1b[19~');
                    break;
                case VirtualKey.VK_F9:
                    seq.push('\x1b[20~');
                    break;
                case VirtualKey.VK_F10:
                    seq.push('\x1b[21~');
                    break;
                case VirtualKey.VK_F11:
                    seq.push('\x1b[23~');
                    break;
                case VirtualKey.VK_F12:
                    seq.push('\x1b[24~');
                    break;
                default:
                    if (0x40 <= event.keyCode && event.keyCode <= 0x5F) {
                        if (event.ctrlKey) {
                            seq.push(String.fromCharCode(event.keyCode - 0x40));
                        }
                    }
                    break;
                }

                if (seq.length) {
                    $connection.emit('terminal.input', {
                        message : seq.join(''),
                    });
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }

                // scroll to the bottom
                $terminal.scrollTop = $terminal.scrollHeight - $terminal.offsetHeight;
            }).on('blur', function(event) {
                if ($interval) {
                    window.clearInterval($interval);
                }

                $cursor.setAttribute('class', 'cursor steady');
            }).on('focus', function(event) {
                if ($interval) {
                    window.clearInterval($interval);
                }

                $cursor.setAttribute('class', 'cursor');
                $interval = window.setInterval(function() {
                    if (!/blink/.test($cursor.className)) {
                        $cursor.setAttribute('class', 'cursor blink');
                    } else {
                        $cursor.setAttribute('class', 'cursor');
                    }
                }, 500);
            }).on('keypress', function(event) {
                $connection.emit('terminal.input', {
                    message : String.fromCharCode(event.keyCode)
                });
            }).on('mousedown', function(event) {
                if ($state.x11MouseTrackable) {
                    // TODO
                }
            }).on('mousemove', function(event) {
                // TODO
            }).on('mouseout', function(event) {
                // TODO
            }).on('mouseover', function(event) {
                // TODO
            }).on('mouseup', function(event) {
                if ($state.x11MouseTrackable) {
                    // TODO
                }
            }).on('mousewheel', function(event) {
                /*
                 * If alternate mode set, then cursor up/down are sent
                 */
                if ($state.alternateMode) {
                    var fm = $paint.measureText(' ');
                    var lines = Math.floor(event.wheelDelta / fm.height);

                    console.log('wheelDelta:' + event.wheelDelta + '; lines:' + lines);

                    if (Math.abs(lines) > 0) {
                        $connection.emit('terminal.input', {
                            message : '\x1bO' + (lines > 0 ? 'A' : 'B'),
                        });
                    }
                }
            }).on('scroll', function(event) {
                $this.updateUI();
            });

            $terminal.focus();

            window.on('beforeunload', function(event) {
                // TODO
            }).on('unload', function(event) {
                $this.exit();
            }).on('resize', function(event) {
                if ('function' === typeof $resize) {
                    $resize(event);
                }

                this.measureLayout(function(cols, rows) {
                    $connection.emit('terminal.resize', {
                        cols : cols,
                        rows : rows,
                    });
                });
            });
        };

        /**
         * Locate the position in terminal screen
         * 
         * @param x {@link Number}
         *           X coordinate in pixel
         * @param x {@link Number}
         *           Y coordinate in pixel
         * @return position of column and row
         */
        this.locatePosition = function(x, y) {
            var fm = $paint.measureText(' ');

            return {
                col : Math.ceil(x / fm.width),
                row : Math.ceil(y / fm.height),
            };
        };

        window.on = $terminal.on = function(type, callback) {
           this['on' + type] = callback;

           return this;
        }
    };

    /**
     * Normal keypad mode
     */
    WebTerminal.NORMAL_KEYPAD_MODE          = 0;

    /**
     * Application keypad mode
     */
    WebTerminal.APPLICATION_KEYPAD_MODE     = 1;

    /**
     * Normal cursor key mode
     */
    WebTerminal.NORMAL_CURSOR_KEY_MODE      = 0;

    /**
     * Application cursor key mode
     */
    WebTerminal.APPLICATION_CURSOR_KEY_MODE = 1;

    WebTerminal.CHARSET_MASK     = 0xFFFFFF00;
    WebTerminal.CHARSET_ASCII    = 0x0000D800;
    WebTerminal.CHARSET_GBCHR    = 0x0000DB00;
    WebTerminal.CHARSET_LINEDRAW = 0x0000D900;
    WebTerminal.CHARSET_SCOACS   = 0x0000DA00;

    module.exports = WebTerminal;
});

