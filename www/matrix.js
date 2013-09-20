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
        var $width = width;
        var $height = height;
        var $data = new Array($width * $height);

        /**
         * Matrix width
         * 
         * @type {@link Number}
         */
        Object.defineProperty(this, 'width', {
            get : function() {
                return $width;
            }
        });

        /**
         * Matrix height
         * 
         * @type {@link Number}
         */
        Object.defineProperty(this, 'height', {
            get : function() {
                return $height;
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
            return $data[$height * y + x];
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
            $data[$height * y + x] = data;
        };

    };

    module.exports = Matrix;

});
