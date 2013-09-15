define(function(require, exports, module) {

    var EOFException = function(msg) {

        Object.defineProperty(this, 'class', {
            value : 'EOFException',
            writable : false,
        });

        Object.defineProperty(this, 'message', {
            value : msg,
            writable : false,
        });

    };

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
            var c = $text.charCodeAt($pos++);

            if (isNaN(c)) {
                throw new EOFException('End of stream');
            }

            return c;
        };

        this.unread = function() {
            $pos = Math.max(0, $pos - 1);
        };

        this.reads = function(n, buffer) {
            var str = null;

            n = n || 1;
            str = $text.substr($pos, n);

            if (!str || str.length <= 0) {
                throw new EOFException('End of stream');
            }

            buffer && buffer.push(str);
            $pos = Math.min($text.length, $pos + n);

            return str;
        };

        this.unreads = function(n) {
            $pos = Math.max(0, $pos - n);
        };

        this.peak = function(n) {
            return $text.substr($pos, n || 1);
        };
    };

    module.exports = StringReader;

});

