/**
 * TCP/IP Socket
 */
define(function(require, exports, module) {

    /**
     * Socket constructor
     */
    var Socket = function() {
        var $id = null;
        var $hostname = null;
        var $port = null;
        var $closed = true;
        var $connected = false;

        Object.defineProperty(this, 'id', {
            get : function() {
                return $id;
            }
        });

        Object.defineProperty(this, 'hostname', {
            get : function() {
                return $hostname;
            }
        });

        Object.defineProperty(this, 'port', {
            get : function() {
                return $port;
            }
        });

        Object.defineProperty(this, 'connected', {
            get : function() {
                return $connected;
            }
        });

        Object.defineProperty(this, 'closed', {
            get : function() {
                return $closed;
            }
        });

        /**
         * Connect to the specified host:port
         * 
         * @param hostname {@link String}
         *           Host name or IP address
         * @param port {@link Number}
         *           Host port number
         */
        this.connect = function(hostname, port, callback) {
            if (this.connected) {
                return;
            }

            chrome.socket.create('tcp', {}, function(info) {
                $id = info.id;

                chrome.socket.connect(this.id, hostname, port, function(result) {
                    $hostname = hostname;
                    $port = port;
                    $closed = false;
                    $connected = true;

                    if ('function' === typeof callback) {
                        callback(result);
                    }
                });
            });
        };

        /**
         * Read data from this socket
         * 
         * @param n {@link ArrayBuffer}
         *           The read buffer size
         * @param callback {@link Function}
         *           Called when the read operation compeltes
         *           without blocking or an error occurs
         */
        this.read = function(n, callback) {
            if (!this.connected) {
                if ('function' === typeof callback) {
                    callback({
                        resultCode : -1,
                    });
                }

                return;
            }


            chrome.socket.read(this.id, n, callback);
        };

        /**
         * Write data to the server
         * 
         * @param data {@link ArrayBuffer}
         *           The data to write
         * @param callback {@link Function}
         *           Called when the write operation compeltes
         *           without blocking or an error occurs
         */
        this.write = function(data, callback) {
            if (!this.connected) {
                if ('function' === typeof callback) {
                    callback({
                        bytesWritten : -1
                    });
                }

                return;
            }

            chrome.socket.write(this.id, data, callback);
        };

        /**
         * Disconnect from server
         */
        Socket.prototype.close = function() {
            if (this.closed) {
                return;
            }

            chrome.socket.disconnect(this.id);
            $closed = true;
            $connected = false;
        };

        /**
         * Distroy this socket
         */
        Socket.prototype.destroy = function() {
            if (!this.id) {
                return;
            }

            chrome.socket.destroy(this.id);
            $id = null;
        };
    };

    module.exports = Socket;

});

