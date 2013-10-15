define(function(require, exports, module) {

    module.exports.loadAll = function(callback) {
        chrome.storage.local.get(null, callback);
    };

    module.exports.add = function(entry, callback) {
        chrome.storage.local.set(entry, function() {
            if ('function' === typeof callback) {
                callback(chrome.runtime.lastError);
            }
        });
    };

    module.exports.remove = function(keys, callback) {
        chrome.storage.local.remove(keys, function() {
            if ('function' === typeof callback) {
                callback(chrome.runtime.lastError);
            }
        });
    };

});

