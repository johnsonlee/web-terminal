define(function(require, exports, module) {

    var Paint = require('www/paint');
    var Matrix = require('www/matrix');


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

        /**
         * Resize canvas
         * 
         * @param width {@link Number}
         *           New width to resize
         * @param height {@link Number}
         *           New height to resize
         */
        this.resize = function(width, height) {
            for (var i = this.height; i < height; i++) {
                $lines[i] = document.createElement('DIV');
                $holder.appendChild($lines[i]);
            }

            $matrix.width = width;
            $matrix.height = height;

            for (var y = 0; y < this.height; y++) {
                var line = $lines[y];
                var text = document.createTextNode('');

                for (var x = 0; x < this.width; x++) {
                    $matrix.set(x, y, {
                        data : ' ',
                        dom  : text,
                        left : x,
                        right : this.width - x - 1,
                    });
                }

                line.appendChild(text);
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
        this.clearRegion = function(left, top, right, bottom) {
            var c = ' ';

            for (var y = top; y < bottom; y++) {
                var line = $lines[y];

                for (var x = left; x < right; x++) {
                    var entry = $matrix.get(x, y);

                    entry.data = c;
                    entry.dom.replaceData(x, 1, c);
                }
            }
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
        this.drawText = function(text, x, y, paint) {
            var entry = $matrix.get(x, y);

            if (Node.TEXT_NODE === entry.dom.nodeType) {
                entry.dom.replaceData(entry.left, text.length, text);
            }

            for (var i = 0; i < text.length; i++) {
                $matrix.set(x + i, y, {
                    data : text.charAt(i),
                    dom  : entry.dom,
                    left : x + i,
                    right : this.width - 1 - i - x,
                });
            }
        };

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

    module.exports = Canvas;

});

