define(function(require, exports, module) {

    var LinkedList = function() {

        var $head = {
            prev : null,
            next : null,
            data : null,
        };

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

        this.iterator = function() {
            var head = $head;

            return {
                hasNext : function() {
                    return !!head.next;
                },
                next : function() {
                    if (head.next) {
                        return (head = head.next).data;
                    }

                    return null;
                },
            };
        };

    };

    module.exports = LinkedList;

});

