define(function(require, exports, module) {

    /**
     * Read string as a stream
     * 
     * @param s {@link String}
     *           String to be read
     */
    var StringReader = function(s) {
        var $pos = 0;
        var $text = s;

        Object.defineProperty(this, 'available', {
            get : function() {
                return $text.length - $pos;
            }
        });

        this.read = function(buffer) {
            return $text.charCodeAt($pos++);
        };

        this.unread = function() {
            $pos = Math.max(0, $pos - 1);
        };

        this.reads = function(n, buffer) {
            var str = null;

            n = n || 1;
            str = $text.substr($pos, n);
            buffer && buffer.push(str);
            $pos = Math.min($text.length, $pos + n);

            return str;
        };

        this.unreads = function(n) {
            $pos = Math.max(0, $pos - n);
        };

        this.peak = function() {
            return $text.charCodeAt($pos);
        };

        this.peaks = function(n) {
            return $text.substr($pos, n || 1);
        };
    };

    module.exports = StringReader;

});

