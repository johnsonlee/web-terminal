define(function(require, exports, module) {

    var $canvas = document.createElement('CANVAS');
    var $g2d = $canvas.getContext('2d');

    /**
     * Graphics
     */
    module.exports = {
        '2d' : {
            getFontMetrics : function(font) {
                $g2d.font = [
                    font.style  || '',
                    font.size   || '',
                    font.family || '',
                ].join(' ');

                return {
                    width : $g2d.measureText(' ').width,
                    height : 18,
                };
            },
        }
    };

});

