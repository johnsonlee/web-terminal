define(function(require, exports, module) {

    var preferences = require('preferences');

    preferences.loadAll(function(map) {
        var entries = document.getElementById('entries');

        for (var key in map) {
            var a = document.createElement('A');
            var li = document.createElement('LI');

            a.href = key;
            a.target = '_blank';
            a.innerText = key;

            li.appendChild(a);
            entries.appendChild(li);
        }
    });
});

