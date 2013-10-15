define(function(require, exports, module) {

    var preferences = require('preferences');

    var btnPlus = document.getElementById('plus');
    // var btnClear = document.getElementById('clear');
    var entries = document.getElementById('entries');

    btnPlus.addEventListener('click', function(event) {
        var arg = {
            url : chrome.extension.getURL('options.html')
        };

        chrome.tabs.query(arg, function(tabs) {
            if (tabs.length > 0) {
                chrome.tabs.update(tabs[0].id, {
                    active : true
                });
            } else {
                chrome.tabs.create(arg);
            }
        });
    });

    /*btnClear.addEventListener('click', function(event) {
        preferences.clear(function(error) {
            if (!error) {
                while (entries.firstChild) {
                    entries.removeChild(entries.firstChild);
                }
            }
        });
    });*/

    preferences.loadAll(function(map) {
        for (var key in map) {
            var a = document.createElement('A');
            var u = document.createElement('U');
            var li = document.createElement('LI');

            a.$key = key;
            a.href = key;
            a.target = '_blank';
            a.innerText = key;

            u.$key = key;
            u.innerText = 'X';
            u.addEventListener('click', function(event) {
                var entry = this.parentNode;

                preferences.remove(this.$key, function(error) {
                    if (!error) {
                        entry.parentNode.removeChild(entry);
                    }
                });
            });

            li.$key = key;
            li.appendChild(a);
            li.appendChild(u);
            entries.appendChild(li);
        }
    });
});

