define(function(require, exports, module) {

    var Stack = function() {
        var $stack = [];

        Object.defineProperty(this, 'size', {
            get : function() {
                return $stack.length;
            }
        });

        this.isEmpty = function() {
            return $stack.length <= 0;
        };

        this.peak = function() {
            return $stack[$stack.length - 1];
        };

        this.push = function(o) {
            return $stack.push(o);
        };

        this.pop = function() {
            return $stack.pop();
        };

        this.clear = function() {
            $stack.splice(0, this.size);
        };

        this.dump = function() {
            var s = $stack.join('');

            this.clear();
            return s;
        };

        this.toString = function() {
            return $stack.join('');
        };

    };

    module.exports = Stack;

});
