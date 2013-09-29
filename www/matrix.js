define(function(require, exports, module) {

    /**
     * The Matrix holds the pixel-like objects
     * 
     * @param width {@link Number}
     *           The width of matrix
     * @param height {@link Number}
     *           The height of matrix
     */
    var Matrix = function(width, height) {
        var $data = [];
        var $width = width || 0;

        // initialize matrix
        for (var y = 0; y < height; y++) {
            var row = [];

            for (var x = 0; x < width; x++) {
                row.push(null);
            }

            $data.push(row);
        }

        /**
         * Matrix width
         * 
         * @type {@link Number}
         */
        Object.defineProperty(this, 'width', {
            get : function() {
                return $width;
            },
            set : function(width) {
                if (this.width > width) {
                    for (var y = 0; y < this.height; y++) {
                        $data[y].splice(width, this.width - width);
                    }
                }

                $width = width;
            }
        });

        /**
         * Matrix height
         * 
         * @type {@link Number}
         */
        Object.defineProperty(this, 'height', {
            get : function() {
                return $data.length;
            },
            set : function(height) {
                if (this.height < height) {
                    for (var i = this.height; i < height; i++) {
                       $data.push([]); 
                    }
                } else if (this.height > height) {
                    $data.splice(height, this.height - height);
                }
            }
        });

        Object.defineProperty(this, 'data', {
            get : function() {
                return $data;
            }
        });

        /**
         * Get the pixel-like object by coordinate
         * 
         * @param x {@link Number}
         *           The x coordinate, it's in the range [0, width)
         * @param y {@link Number}
         *           The y coordinate, it's in the range [0, height)
         * @return the object which locate at (x, y)
         */
        this.get = function(x, y) {
            return $data[y][x];
        };

        /**
         * Set the pixel-like object by coordinate
         * 
         * @param x {@link Number}
         *           The x coordinate, it's in the range [0, width)
         * @param y {@link Number}
         *           The y coordinate, it's in the range [0, height)
         */
        this.set = function(x, y, data) {
            $data[y][x] = data;
        };

    };

    /*
     * Get the sub matrix of this matrix with specified boundary
     * 
     * @param x {@link Number}
     *           The x coordinate
     * @param y {@link Number}
     *           The y coordinate, it's in the range [0, height)
     * @param width {@link Number}
     *           The width of sub matrix
     * @param width {@link Number}
     *           The heigh of sub matrix
     * @return the a sub matrix of this matrix
     */
    Matrix.prototype.subMatrix = function(x, y, width, height) {
        var $width = x + width;
        var $height = y + height;
        var matrix = new Matrix(width, height);

        for (var $y = y; $y < $height; $y++) {
            for (var $x = x; $x < $width; $x++) {
                var entry = this.get($x, $y);

                matrix.set($x, $y, entry);
            }
        }

        return matrix;
    };

    module.exports = Matrix;

});
