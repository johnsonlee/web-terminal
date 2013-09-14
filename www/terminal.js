define(function(require, exports, module) {

    var Iterator = function(iterable) {
        var $iterable = iterable;
        var $cursor = 0;

        this.previous = function() {
            if ($cursor <= 0)
                return null;

            return $iterable[--$cursor];
        };

        this.next = function() {
            if ($cursor >= $iterable.length)
                return null;

            return $iterable[++$cursor];
        };

        this.get = function() {
            return $iterable[$cursor];
        };
    };

    var Terminal = function(options) {
        options = options || {};
        options.user = options.user || 'anonymous';

        var $this = this;
        var $cols = 0;
        var $text = '';
        var $height = 0;
        var $fontSize = '12pt';
        var $history = [];
        var $cursorPosition = 0;
        var $fontFamily = 'Courier, Courier New';
        var $canvas = document.createElement('canvas');
        var $cursor = document.createElement('DIV');
        var $terminal = document.createElement('DIV');
        var $container = document.createElement('DIV');
        var $graphics = $canvas.getContext('2d');
        var $session = new Iterator($history);
        var $mode = options.user == 'root' ? '#' : '$';
        var $prompt = options.user + '@' + location.hostname + ':~' + $mode + ' ';
        var socket = io.connect(location.protocol + '//' + location.host);

        $graphics.font = $fontSize + ' ' + $fontFamily;

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
                return $terminal.childNodes.length;
            }
        });

        Object.defineProperty(this, 'columns', {
            get : function() {
                return Math.floor(this.width / this.columnWidth);
            }
        });

        Object.defineProperty(this, 'columnWidth', {
            get : function() {
                return $graphics.measureText(' ').width;
            }
        });

        Object.defineProperty(this, 'lineHeight', {
            get : function() {
                return $terminal.firstChild.offsetHeight;
            }
        });

        Object.defineProperty(this, 'session', {
            value : $session,
            writable : false,
        });

        this.resize = function() {
            var styles = [];
            var size = {
                width : this.width,
                height : this.height
            };

            console.log('Web Terminal: ' + this.width + 'x' + this.height);

            $container.style.width = $container.offsetParent.clientWidth;
            $container.style.height = $container.offsetParent.clientHeight;

            $cursor.style.width = this.columnWidth + 'px';

            $terminal.style.width = this.width + 'px';
            $terminal.style.height = this.height + 'px';
        };

        this.clear = function() {
            $text = '';
            this.removeAllLine();
        };

        this.moveCursor = function(row, col) {
            var x = this.columnWidth * col;
            var y = this.lineHeight * (row - 1);

            $cursor.style.top = (y - $terminal.scrollTop) + 'px';
            $cursor.style.left = x + 'px';
            $cursor.style.height = $terminal.firstChild.offsetHeight;

            console.log('Move To: (' + x + ',' + y + ')');
        };

        this.moveCursorToHome = function(row) {
            $cursorPosition = $prompt.length;
            this.updateCursor();
        };

        this.moveCursorToEnd = function() {
            $cursorPosition = $terminal.lastChild.textContent.length;
            this.updateCursor();
        };

        this.moveCursorByColumns = function(delta) {
            var left = $cursor.style.left.replace('px', '');
            var x = parseInt(left);

            if (delta < 0 && x <= $prompt.length * this.columnWidth)
                return;
            
            $cursorPosition += delta;
            $cursor.style.left = (x + (this.columnWidth * delta)) + 'px';
        };

        this.updateCursor = function() {
            this.moveCursor(this.rows, $cursorPosition);
        };

        this.insertText = function(text) {
            var offset = 0;
            var section = text;
            var lastLine = $terminal.lastChild;
            var session = lastLine.lastChild;

            offset = this.columns - $cursorPosition;
            text = text.substr(0, offset);
            session.insertData($cursorPosition - $prompt.length, text);
            $cursorPosition += text.length;
            this.updateCursor();
        };

        this.backSpace = function() {
            var lastLine = $terminal.lastChild;

            if (!lastLine) {
                return;
            }

            var text = lastLine.lastChild;

            if ($cursorPosition - $prompt.length < 1) {
                return;
            }

            text.deleteData($cursorPosition - $prompt.length - 1, 1);
            $text = $terminal.textContent;
            $cursorPosition--;
            this.updateCursor();
        };

        this.newSession = function(text) {
            var line = document.createElement('DIV');
            var prompt = document.createElement('SPAN');
            var session = document.createTextNode(text || '');

            prompt.innerText = $prompt;
            line.appendChild(prompt);
            line.appendChild(session);
            $terminal.appendChild(line);
            $terminal.scrollByLines(1);
            $cursorPosition = line.textContent.length;
            this.updateCursor();
        };

        this.replaceSession = function(text) {
            var lastLine = $terminal.lastChild;
            var session = lastLine.lastChild;

            if (session.nodeType != Node.TEXT_NODE) {
                if (text) {
                    this.insertText(text);
                }
            } else {
                session.replaceData(0, session.length, text || '');
            }
        };

        this.removeAllLine = function() {
            while ($terminal.firstChild) {
                $terminal.removeChild($terminal.firstChild);
            }
        };

        this.commit = function() {
            var line = $terminal.lastChild.lastChild;

            if (!line || line.nodeType != Node.TEXT_NODE)
                return;

            console.log('send message: ' + line.nodeValue);
            socket.emit('send', { message: line.nodeValue });
            $history.push(line.nodeValue);
            this.session.next();
        };

        this.delete = function() {
            var session = $terminal.lastChild.lastChild;

            session.deleteData($cursorPosition - $prompt.length, 1);
        };

        this.run = function(container) {
            $container.setAttribute('class', 'terminal-container');

            $cursor.setAttribute('class', 'cursor');

            $terminal.setAttribute('class', 'terminal');
            $terminal.setAttribute('tabindex', '-1');

            $terminal.onkeydown = function(event) {
                switch (event.keyCode) {
                case 8:  // BACKSPACE
                    $this.backSpace();
                    return false;
                case 13: // ENTER
                    $this.commit();
                    $this.newSession();
                    return false;
                case 23: // ESC
                    return false;
                case 32: // SPACE
                    $this.insertText(' ');
                    return false;
                case 35: // END
                    $this.moveCursorToEnd($this.rows);
                    return;
                case 36: // HOME
                    $this.moveCursorToHome($this.rows);
                    return;
                case 37: // LEFT
                    $this.moveCursorByColumns(-1);
                    return false;
                case 38: // UP
                    $this.replaceSession($this.session.previous());
                    return false;
                case 39: // RIGHT
                    $this.moveCursorByColumns(1);
                    return false;
                case 40: // DOWN
                    $this.replaceSession($this.session.next());
                    return false;
                case 46: // DELETE;
                    $this.delete();
                    return false;
                }
            };

            $terminal.onkeypress = function(event) {
                $this.insertText(String.fromCharCode(event.keyCode));
            };

            $terminal.onscroll = function(event) {
                $this.updateCursor();
            };

            var blink = window.setInterval(function() {
                var className = $cursor.getAttribute('class');
                var row = $terminal.childNodes[$this.rows - 1].textContent;

                /*if ($cursorPosition < row.length && !/mask/.test(className)) {
                    className += ' mask';
                    $cursor.setAttribute('class', className);
                } else {
                    className = className.replace(/\s*mask/g, '');
                    $cursor.setAttribute('class', className);
                }*/

                if (/blink/.test(className)) {
                    className = className.replace(/\s*blink/g, '');
                    $cursor.setAttribute('class', className);
                } else {
                    className += ' blink';
                    $cursor.setAttribute('class', className);
                }
            }, 500);

            $container.appendChild($cursor);
            $container.appendChild($terminal);
            container.appendChild($container);

            $this.resize();
            $this.newSession();
            $terminal.focus();
            socket.emit('resize', {
                rows: $this.rows,
                cols: $this.columns,
            });
        };

        window.onresize = function() {
            $this.resize();
        };
    };

    module.exports = Terminal;
});

