/**
 * asd
 * @param {Object} spacecraft The spacecraft
 */
function DataServer(spacecraft){
    return function (openmct) {
        var socket = new WebSocket(location.origin.replace(/^http/, 'ws') + '/realtime/');
        var listener = {};

        socket.onmessage = function (event) {
            point = JSON.parse(event.data);
            if (listener[point.id]) {
                listener[point.id](point);
            }
        };

        var provider = {
            supportsSubscribe: function (domainObject) {
                return domainObject.type === 'example.telemetry';
            },
            subscribe: function (domainObject, callback) {
                listener[domainObject.identifier.key] = callback;
                socket.send('subscribe ' + domainObject.identifier.key);
                return function unsubscribe() {
                    delete listener[domainObject.identifier.key];
                    socket.send('unsubscribe ' + domainObject.identifier.key);
                };
            }
        };

        openmct.telemetry.addProvider(provider);
    }
}

DataServer.prototype.listenCan = function(){
    const serialPort = require('serialport');
    var sp = new serialPort("/dev/ttyUSB0", {
        baudRate: 115200,
        parser: serialPort.parsers.Readline
    });

    sp.on('open', function(){
        console.log("opened port");
        sp.on('data', function(data){
            console.log(data.toString());
        });
    });
}

module.exports = DataServer;