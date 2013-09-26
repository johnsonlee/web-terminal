define(function(require, exports, module) {

    var DEFAULT_STYLES = {
        'color'            : null,
        'background-color' : null,
        'font-size'        : '11pt',
        'font-family'      : 'Courier, Courier New',
        'font-weight'      : 'normal',
    };

    var Paint = function() {
        var $fgColor;
        var $bgColor;
        var $fontSize;
        var $fontFamily;
        var $fontWeight;

        Object.defineProperty(this, 'background-color', {
            get : function() {
                return $bgColor ? $bgColor['bold' == $fontWeight ? 1 : 0] : null;
            },
            set : function(color) {
                $bgColor = color;
            }
        });

        Object.defineProperty(this, 'color', {
            get : function() {
                return $fgColor ? $fgColor['bold' == $fontWeight ? 1 : 0] : null;
            },
            set : function(color) {
                $fgColor = color;
            }
        });

        Object.defineProperty(this, 'font-size', {
            get : function() {
                return $fontSize;
            },
            set : function(size) {
                $fontSize = size;
            }
        });

        Object.defineProperty(this, 'font-weight', {
            get : function() {
                return $fontWeight;
            },
            set : function(weight) {
                $fontWeight = weight;
            }
        });

        Object.defineProperty(this, 'font-family', {
            get : function() {
                return $fontFamily;
            },
            set : function(family) {
                $fontFamily = family;
            }
        });

        this.reset();
    };

    /**
     * Test whether all parameters of this paint is default 
     */
    Paint.prototype.isDefault = function() {
        for (var style in DEFAULT_STYLES) {
            if (this[style] != DEFAULT_STYLES[style]) {
                return false;
            }
        }

        return true;
    };

    /**
     * Reset the specified style, if style name not specified, restore all styles
     * 
     * @param style {@link String}
     *           Style name
     */
    Paint.prototype.reset = function(style) {
        if ('undefined' !== typeof DEFAULT_STYLES[style]) {
            this[style] = DEFAULT_STYLES[style];
        } else {
            for (style in DEFAULT_STYLES) {
                this[style] = DEFAULT_STYLES[style];
            }
        }
    };

    /**
     * Return the width of the text
     * 
     * @param text {@link String}
     *           The text to measure
     * @return the width of the text
     */
    Paint.prototype.measureText = function(text) {
        var fm = {};
        var styles = [];
        var span = document.createElement('SPAN');

        span.innerText = text;
        span.setAttribute('style', this.toString());
        span.style.top = '-1000px';
        span.style.left = '-1000px';
        span.style.zIndex = -1;
        span.style.position = 'absolute';
        span.style.whiteSpace = 'pre';

        document.body.appendChild(span);

        fm.width = span.offsetWidth;
        fm.height = span.offsetHeight;

        document.body.removeChild(span);

        return fm;
    };

    Paint.prototype.toString = function() {
        var styles = [];

        for (var style in DEFAULT_STYLES) {
            if (this[style]) {
                styles.push(style + ':' + this[style]);
            }
        }

        return styles.join(';');
    };

    module.exports = Paint;

});

