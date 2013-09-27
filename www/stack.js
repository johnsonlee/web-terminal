define(function(require, exports, module) {

    var Stack = function() {
        var $stack = [];

        Object.defineProperty(this, 'empty', {
            get : function() {
                return $stack.length <= 0;
            }
        });

        Object.defineProperty(this, 'size', {
            get : function() {
                return $stack.length;
            }
        });

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

        this.contains = function(o) {
            for (var i = 0; i < $stack.length; i++) {
                if ($stack[i] == o)
                    return true;
            }

            return false;
        };

        this.toString = function() {
            return $stack.join('');
        };

    };

    module.exports = Stack;

});
