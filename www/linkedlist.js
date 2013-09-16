define(function(require, exports, module) {

    var LinkedList = function() {

        var $head = {
            prev : null,
            next : null,
            data : null,
        };

        Object.defineProperty(this, 'first', {
            get : function() {
                if ($head.next) {
                    return $head.next.data;
                }

                return null;
            }
        });

        Object.defineProperty(this, 'last', {
            get : function() {
                if ($head.prev) {
                    return $head.prev.data;
                }

                return null;
            }
        });

        Object.defineProperty(this, 'iterator', {
            get : function() {
                return $head.next;
            }
        });

        this.add = function(data) {
            var entry = {
                prev : $head.prev,
                next : null,
                data : data,
            };

            if ($head.prev) {
                $head.prev.next = entry;
            } else {
                $head.next = entry;
            }

            $head.prev = entry;

            console.debug(JSON.stringify(data));
        };

        this.clear = function() {
            $head.prev = $head.next = null;
        };

    };

    module.exports = LinkedList;

});

