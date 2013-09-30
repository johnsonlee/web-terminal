define(function(require, exports, module) {

    var Paint = require('www/paint');
    var Matrix = require('www/matrix');

    var styles = [
        'color',
        'backgroundColor',
        'fontWeight',
    ];

    /**
     * TTY canvas
     * 
     * @param holder {@link Object}
     *           The carrier of this canvas
     */
    var Canvas = function(holder) {
        var $lines = [];
        var $holder = holder;
        var $matrix = new Matrix();
        var $bounds = {
            left : 0,
            top  : 0,
            right : 0,
            bottom : 0,
        };

        Object.defineProperty(this, 'holder', {
            get : function() {
                return $holder;
            }
        });

        Object.defineProperty(this, 'width', {
            get : function() {
                return $matrix.width;
            }
        });

        Object.defineProperty(this, 'height', {
            get : function() {
                return $matrix.height;
            }
        });

        Object.defineProperty(this, 'matrix', {
            get : function() {
                return $matrix;
            }
        });

        Object.defineProperty(this, 'marginTop', {
            get : function() {
                return $bounds.top;
            },
            set : function(marginTop) {
                $bounds.top = marginTop;
            }
        });

        Object.defineProperty(this, 'marginBottom', {
            get : function() {
                return $bounds.bottom;
            },
            set : function(marginBottom) {
                $bounds.bottom = marginBottom;
            }
        });

        /**
         * Resize canvas
         * 
         * @param width {@link Number}
         *           New width to resize
         * @param height {@link Number}
         *           New height to resize
         */
        this.resize = function(width, height) {
            var $height = this.height;

            $matrix.width = width;
            $matrix.height = height;

            for (var y = $height; y < height; y++) {
                var line = $lines[y] = document.createElement('DIV');
                var text = document.createTextNode('');

                for (var x = 0; x < width; x++) {
                    text.appendData(' ');
                    $matrix.set(x, y, {
                        data : ' ',
                        dom  : text,
                        left : x,
                        right : width - x - 1,
                    });
                }

                line.appendChild(text);
                $holder.appendChild(line);
            }

            this.marginTop = 1;
            this.marginBottom = this.height;
        };
    };

    /**
     * Dump this canvas, and insert a empty buffer
     */
    Canvas.prototype.clear = function() {
        var width = this.width;
        var height = this.height;

        for (var y = 0; y < height; y++) {
            var line = document.createElement('DIV');
            var text = document.createTextNode('');

            for (var x = 0; x < width; x++) {
                text.appendData(' ');
                this.matrix.set(x, y, {
                    data : ' ',
                    dom  : text,
                    left : x,
                    right : width - x - 1,
                });
            }

            line.appendChild(text);
            this.holder.appendChild(line);
            this.holder.scrollTop += line.offsetHeight;
        }
    };

    /**
     * Clear the specified region
     * 
     * @param x {@link Number}
     *           Column number
     * @param y {@link Number}
     *           Row number
     * @param width {@link Number}
     *           The width of region
     * @param height {@link Number}
     *           The height of region
     */
    Canvas.prototype.clearRegion = function(left, top, right, bottom) {
        var spaces = new Array(right - left + 1).join(' ');

        for (var y = top; y < bottom; y++) {
            this.drawText(spaces, left, y);
        }
    };

    /**
     * Draw cursor at the specified position
     */
    Canvas.prototype.drawCursor = function(x, y) {
        var entry = this.matrix.get(x, y);

        this.drawText(entry.data, x, y, entry.paint);
    };

    /**
     * Draw text in this canvas
     * 
     * @param text {@link String}
     *           The text to draw
     * @param x {@link Number}
     *           The column number to start drawing
     * @param y {@link Number}
     *           The row number to start drawing
     * @param paint {@link Paint}
     *           The paint style to apply
     */
    Canvas.prototype.drawText = function(text, x, y, paint) {
        var left = x;
        var right = x + text.length;
        var start = this.matrix.get(x, y);
        var end = this.matrix.get(right - 1, y);
        var first = start.dom;
        var last = end.dom;
        var txtFirst = first.innerText || first.data;
        var txtLast = last.innerText || last.data;

        if (first.isSameNode(last)) {
            if (text.length == this.matrix.width
                    && text == (first.innerText || first.data)) {
                return;
            }

            var node = applyStyle(document.createTextNode(text), paint);

            switch (first.nodeType) {
            case Node.TEXT_NODE:
                if (start.left != 0 && end.right != 0) {
                    last = document.createTextNode('');
                    last.appendData(txtLast.substring(end.left + 1));

                    first.parentNode.insertBefore(node, first.nextSibling);
                    first.parentNode.insertBefore(last, node.nextSibling);
                    first.deleteData(start.left, first.length - start.left);

                    updateMatrix.call(this, left - start.left, left, y, first);
                    updateMatrix.call(this, right, right + end.right, y, last);
                } else if (start.left != 0 && end.right == 0) {
                    first.parentNode.insertBefore(node, first.nextSibling);
                    first.deleteData(start.left, start.right + 1);
                    updateMatrix.call(this, left - start.left, left, y, first);
                } else if (start.left == 0 && end.right != 0) {
                    last.parentNode.insertBefore(node, last);
                    last.deleteData(0, end.left + 1);
                    updateMatrix.call(this, right, right + end.right, y, last);
                } else {
                    first.parentNode.insertBefore(node, first);
                    first.parentNode.removeChild(first);
                }

                updateMatrix.call(this, left, right, y, node, text, paint);
                break;
            case Node.ELEMENT_NODE:
                if (start.left != 0 && end.right != 0) {
                    last = document.createElement('SPAN');
                    last.innerText = txtLast.substring(end.left + 1);
                    last.setAttribute('style', first.getAttribute('style'));

                    first.parentNode.insertBefore(node, first.nextSibling);
                    first.parentNode.insertBefore(last, node.nextSibling);
                    first.innerText = txtFirst.substr(0, start.left);

                    updateMatrix.call(this, left - start.left, left, y, first);
                    updateMatrix.call(this, right, right + end.right, y, last);
                } else if (start.left != 0 && end.right == 0) {
                    first.parentNode.insertBefore(node, first.nextSibling);
                    first.innerText = txtFirst.substr(0, start.left);
                    updateMatrix.call(this, left - start.left, left, y, first);
                } else if (start.left == 0 && end.right != 0) {
                    last.parentNode.insertBefore(node, last);
                    last.innerText = txtLast.substring(end.left + 1);
                    updateMatrix.call(this, right, right + end.right, y, last);
                } else {
                    first.parentNode.insertBefore(node, first);
                    first.parentNode.removeChild(first);
                }

                updateMatrix.call(this, left, right, y, node, text, paint);
                break;
            }
        } else {
            // remove nodes between start and end
            while (first.nextSibling && !first.nextSibling.isSameNode(last)) {
                first.parentNode.removeChild(first.nextSibling);
            }

            var node = applyStyle(document.createTextNode(text), paint);

            first.parentNode.insertBefore(node, last);

            if (start.left != 0 && end.right != 0) {
                clearFirst(first, start, txtFirst);
                clearLast(last, end, txtLast);
                updateMatrix.call(this, left - start.left, left, y, first);
                updateMatrix.call(this, right, right + end.right, y, last);
            } else if (start.left == 0 && end.right != 0) {
                first.parentNode.removeChild(first);
                clearLast(last, end, txtLast);
                updateMatrix.call(this, right, right + end.right, y, last);
            } else if (start.left != 0 && end.right == 0) {
                clearFirst(first, start, txtFirst);
                last.parentNode.removeChild(last);
                updateMatrix.call(this, left - start.left, left, y, first);
            } else {
                first.parentNode.removeChild(first);
                last.parentNode.removeChild(last);
            }

            updateMatrix.call(this, left, right, y, node, text, paint);
        }
    };

    /**
     * Scroll up canvas
     * 
     * @param y {@link Number}
     *           The row number of cursor position
     * @param n {@link Number}
     *           The number of rows to scroll up
     */
    Canvas.prototype.scrollUp = function(y, n) {
        var width = this.width;
        var delta = this.height - this.marginBottom;

        for (var i = 0; i < delta; i++) {
            var row = [];
            var text = document.createTextNode('');
            var entry = this.matrix.data.splice(this.marginTop - 1, 1)[0][0];
            var line = entry.dom.parentNode;

            line.parentNode.removeChild(line);
            line = document.createElement('DIV');
            line.appendChild(text);

            for (var j = 0; j < width; j++) {
                text.appendData(' ');
                row.push({
                    data : ' ',
                    dom : text,
                    left : j,
                    right : width - j - 1,
                });
            }

            entry = this.matrix.get(0, this.marginBottom - 1);
            this.matrix.data.splice(this.marginBottom - 1, 0, row);
            this.holder.insertBefore(line, entry.dom.parentNode);
        }
    };

    /**
     * Scroll down canvas
     * 
     * @param y {@link Number}
     *           The row number of cursor position
     * @param n {@link Number}
     *           The number of rows to scroll down
     */
    Canvas.prototype.scrollDown = function(y, n) {
        var width = this.width;
        var height = this.height;
        var delta = this.height - this.marginBottom + this.marginTop;

        for (var i = 0; i < n; i++) {
            var row = [];;
            var entry = this.matrix.get(0, this.marginTop - 1);
            var text = document.createTextNode('');
            var line = document.createElement('DIV');

            for (var j = 0; j < width; j++) {
                text.appendData(' ');
                row.push({
                    data : ' ',
                    dom : text,
                    left : j,
                    right : width - j - 1,
                });
            }

            line.appendChild(text);
            this.matrix.data.splice(this.marginTop - 1, 0, row);
            this.holder.insertBefore(line, entry.dom.parentNode);
        }

        for (var i = 0; i < n; i++) {
            var row = this.matrix.data.splice(this.marginBottom, 1);
            var line = row[0][0].dom.parentNode;

            this.holder.removeChild(line);
        }
    };

    Canvas.prototype.scrollOut = function(height) {
        while (this.height > height) {
            this.matrix.data.shift();
        }
    };

    /**
     * Insert n lines at the specified position
     * 
     * @param y {@link Number}
     *           The position start to insert
     * @param n {@link Number}
     *           The number of lines to insert
     */
    Canvas.prototype.insertLine = function(y, n) {
        var width = this.width;
        var entry = this.matrix.get(0, y);

        for (var j = 0; j < n; j++) {
            var row = [];
            var line = document.createElement('DIV');
            var text = document.createTextNode('');

            line.appendChild(text);

            for (var i = 0; i < width; i++) {
                text.appendData(' ');
                row.push({
                    data : ' ',
                    dom : text,
                    left : i,
                    right : width - i - 1,
                });
            }

            this.matrix.data.splice(y, 0, row);
            this.holder.insertBefore(line, entry.dom.parentNode);
        }
    };

    /**
     * Append one line in this canvas
     */
    Canvas.prototype.appendLine = function() {
        var row = [];
        var height = this.height;
        var line = document.createElement('DIV');
        var text = document.createTextNode('');

        line.appendChild(text);

        for (var i = 0; i < this.width; i++) {
            text.appendData(' ');
            row.push({
                data : ' ',
                dom : text,
                left : i,
                right : this.width - i - 1,
            });
        }

        this.matrix.data.push(row);
        this.holder.appendChild(line);
    };

    Canvas.prototype.toString = function() {
        var buffer = [];

        for (var y = 0; y < this.matrix.height; y++) {
            var line = [];

            for (var x = 0; x < this.matrix.width; x++) {
                line.push(this.matrix.get(x, y).data);
            }

            buffer.push(line.join(''));
        }

        return buffer.join('\n');
    };

    function clearLast(last, end, txtLast) {
        switch (last.nodeType) {
        case Node.TEXT_NODE:
            last.deleteData(0, end.left + 1);
            break;
        case Node.ELEMENT_NODE:
            last.innerText = txtLast.substring(end.left + 1);
            break;
        }
    }

    function clearFirst(first, start, txtFirst) {
        switch (first.nodeType) {
        case Node.TEXT_NODE:
            first.deleteData(start.left, start.right + 1);
            break;
        case Node.ELEMENT_NODE:
            first.innerText = txtFirst.substr(0, start.left);
            break;
        }
    }

    function updateMatrix(left, right, y, dom, text, paint) {
        for (var i = left; i < right; i++) {
            var entry = this.matrix.get(i, y);

            entry.left = i - left;
            entry.right = right - i - 1;
            entry.dom = dom;
            entry.paint = paint ? paint.clone() : null;

            if (text instanceof Array || 'string' === typeof text) {
                entry.data = text[i - left];
            }
        }
    }

    function applyStyle(node, paint) {
        if (!paint) {
            return node;
        }

        document.createElement('SPAN').appendChild(node);
        node = node.parentNode;
        node.setAttribute('style', paint.toString());

        return node;
    }

    module.exports = Canvas;

});

