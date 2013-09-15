define(function(require, exports, module) {

    var StringBuffer = function() {
        var $buffer = document.createTextNode('');

        Object.defineProperty(this, 'length', {
            get : function() {
                return $buffer.length;
            },
        });

        this.get = function(i) {
            return $buffer.data.get(i);
        };

        this.charAt = function(i) {
            return $buffer.data.charAt(i);
        };

        this.charCodeAt = function(i) {
            return $buffer.data.charCodeAt(i);
        };

        this.indexOf = function(s) {
            return $buffer.data.indexOf(s);
        };

        this.lastIndexOf = function(s) {
            return $buffer.data.lastIndexOf(s);
        };

        this.append = function(s) {
            $buffer.appendData(s);
        };

        this.insert = function(start, s) {
            $buffer.insertData(start, s);
        };

        this.replace = function(start, n, s) {
            $buffer.replaceData(start, n, s);
        };

        this.delete = function(start, n) {
            $buffer.deleteData(start, n);
        };

        this.substr = function(start, n) {
            return $buffer.substringData(start, start + n);
        };

        this.substring = function(start, end) {
            return $buffer.substringData(start, end);
        };

        this.clear = function() {
            $buffer.deleteData(0, this.length);
        };

        this.toString = function() {
            return $buffer.data;
        };
    };

    module.exports = StringBuffer;

});

