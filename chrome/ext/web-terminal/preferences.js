define(function(require, exports, module) {

    module.exports.loadAll = function(callback) {
        chrome.storage.local.get(null, callback);
    };

    module.exports.add = function(entry, callback) {
        chrome.storage.local.set(entry, callback);
    };

});

