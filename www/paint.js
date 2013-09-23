define(function(require, exports, module) {

    var Paint = function() {
        var $fgColor;
        var $bgColor;
        var $fontSize;
        var $fontFamily;
        var $fontWeight;

        Object.defineProperty(this, 'backgroundColor', {
            get : function() {
                return $bgColor;
            },
            set : function(color) {
                $bgColor = color;
            }
        });

        Object.defineProperty(this, 'foregroundColor', {
            get : function() {
                return $fgColor;
            },
            set : function(color) {
                $fgColor = color;
            }
        });

        Object.defineProperty(this, 'fontSize', {
            get : function() {
                return $fontSize;
            },
            set : function(size) {
                $fontSize = size;
            }
        });

        Object.defineProperty(this, 'fontWeight', {
            get : function() {
                return $fontWeight;
            },
            set : function(weight) {
                $fontWeight = weight;
            }
        });

        Object.defineProperty(this, 'fontFamily', {
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
     * Reset this paint to default style
     */
    Paint.prototype.reset = function() {
        this.backgroundColor = null;
        this.foregroundColor = null;
        this.fontSize = '12pt';
        this.fontWeight = 'normal';
        this.fontFamily = 'Courier, Courier New';
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
        var span = document.createElement('SPAN');

        span.innerText = text;
        span.style.top = '-1000px';
        span.style.left = '-1000px';
        span.style.zIndex = -1;
        span.style.position = 'absolute';
        span.style.whiteSpace = 'pre';
        span.style.fontSize = this.fontSize;
        span.style.fontFamily = this.fontFamily;
        span.style.fontWeight = this.fontWeight;
        document.body.appendChild(span);

        fm.width = span.offsetWidth;
        fm.height = span.offsetHeight;

        document.body.removeChild(span);

        return fm;
    };

    module.exports = Paint;

});

