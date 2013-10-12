define(function(require, exports, module) {

    var Paint = function(style) {
        var $style = {
            'reverse-video' : {
                'default' : false,
            },
            'color' : {
                'default' : [ 'white', 'white' ],
            },
            'background-color' : {
                'default' : [ 'black', 'black' ],
            },
            'font-size' : {
                'default' : '11pt',
            },
            'font-family' : {
                'default' : 'Courier, Courier New',
            },
            'font-weight' : {
                'default' : 'normal',
            },
            'text-decoration' : {
                'default' : 'none',
            }
        };

        for (var i in $style) {
            if ('undefined' !== style[i]) {
                $style[i].value = style[i];
            }
        }

        Object.defineProperty(this, 'reverse-video', {
            get : function() {
                return $style['reverse-video'].value || $style['reverse-video']['default'];
            },
            set : function(value) {
                $style['reverse-video'].value = value;
            }
        });

        Object.defineProperty(this, 'background-color', {
            get : function() {
                return $style['background-color'].value || $style['background-color']['default'];
            },
            set : function(color) {
                $style['background-color'].value = color;
            }
        });

        Object.defineProperty(this, 'color', {
            get : function() {
                return $style['color'].value || $style['color']['default'];
            },
            set : function(color) {
                $style['color'].value = color;
            }
        });

        Object.defineProperty(this, 'font-size', {
            get : function() {
                return $style['font-size'].value || $style['font-size']['default'];
            },
            set : function(size) {
                $style['font-size'].value = size;
            }
        });

        Object.defineProperty(this, 'font-weight', {
            get : function() {
                return $style['font-weight'].value || $style['font-weight']['default'];
            },
            set : function(weight) {
                $style['font-weight'].value = weight;
            }
        });

        Object.defineProperty(this, 'font-family', {
            get : function() {
                return $style['font-family'].value || $style['font-family']['default'];
            },
            set : function(family) {
                $style['font-family'].value = family;
            }
        });

        Object.defineProperty(this, 'text-decoration', {
            get : function() {
                return $style['text-decoration'].value || $style['text-decoration']['default'];
            },
            set : function(decoration) {
                $style['text-decoration'].value = decoration;
            }
        });

        /**
         * Test whether the specified style of this paint is default 
         * 
         * @param style {@link String}
         *           Style name
         */
        this.isDefault = function(style) {
            if ('undefined' !== typeof style) {
                return $style[style].value == $style[style]['default'];
            } else {
                for (var i in $style) {
                    if ($style[i].value != $style[i]['default'])
                        return false;
                }

                return true;
            }
        };

        /**
         * Reset the specified style, if style name not specified, restore all styles
         * 
         * @param style {@link String}
         *           Style name
         */
        this.reset = function(style) {
            if ('undefined' !== typeof style && 'undefined' !== typeof $style[style]) {
                $style[style].value = $style[style]['default'];
            } else {
                for (var i in $style) {
                    $style[i].value = $style[i]['default'];
                }
            }
        };

        this.reset();
    };

    Paint.prototype.clone = function() {
        return new Paint({
            'reverse-video'    : this['reverse-video'],
            'color'            : this['color'],
            'background-color' : this['background-color'],
            'font-weight'      : this['font-weight'],
            'font-family'      : this['font-family'],
            'font-size'        : this['font-size'],
            'text-decoration'  : this['text-decoration'],
        });
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
        span.style.top = '-1000px';
        span.style.left = '-1000px';
        span.style.zIndex = -1;
        span.style.position = 'absolute';
        span.style.whiteSpace = 'pre';
        span.style.fontSize = this['font-size'];
        span.style.fontWeight = this['font-weight'];
        span.style.fontFamily = this['font-family'];

        document.body.appendChild(span);

        fm.width = span.offsetWidth;
        fm.height = span.offsetHeight;

        document.body.removeChild(span);

        return fm;
    };

    Paint.prototype.toString = function() {
        var styles = [];
        var bold = 'bold' == this['font-weight'];

        if (this['font-weight']) {
            styles.push('font-weight:' + this['font-weight']);
        }

        if (this['reverse-video']) {
            styles.push('color:' + this['background-color'][bold ? 1 : 0]);
            styles.push('background-color:' + this['color'][bold ? 1 : 0]);
        } else {
            if (!this.isDefault('color')) {
                styles.push('color:' + this['color'][bold ? 1 : 0]);
            }

            if (!this.isDefault('background-color')) {
                styles.push('background-color:' + this['background-color'][bold ? 1 : 0]);
            }

            if (!this.isDefault('text-decoration')) {
                styles.push('text-decoration:' + this['text-decoration']);
            }
        }

        return styles.join(';');
    };

    module.exports = Paint;

});

