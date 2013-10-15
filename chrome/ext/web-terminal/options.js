define(function(require, exports, module) {

    var preferences = require('preferences');

    var btnAdd = document.getElementById('btnAdd');
    var cmbProtocol = document.getElementsByName('protocol')[0];
    var txtHost = document.getElementsByName('host')[0];
    var txtPort = document.getElementsByName('port')[0];

    btnAdd.addEventListener('click', function(event) {
        var item = {};
        var key = cmbProtocol.value + '://' + txtHost.value + (txtPort.value ? ':' + txtPort.value : '');

        item[key] = {
            protocol : cmbProtocol.value,
            host     : txtHost.value,
            port     : txtPort.value,
        };

        preferences.add(item);
    });
});
