/*
 Spacecraft.js simulates a small spacecraft generating telemetry.
*/

const SerialPort = require('serialport');

let config = {
    '1': 'prop.force',
    '2': 'pwr.temp'
}

let calibrating = 0;

function Spacecraft() {
    this.state = {
        "prop.force": 77,
        "prop.thrusters": "ON",
        "comms.recd": 0,
        "comms.sent": 0,
        "pwr.temp": 245,
        "pwr.c": 8.15,
        "pwr.v": 30
    };
    this.history = {};
    this.listeners = [];
    Object.keys(this.state).forEach(function (k) {
        this.history[k] = [];
    }, this);

    // console.log("Example spacecraft launched!");
    // console.log("Press Enter to toggle thruster state.");

    // process.stdin.on('data', function () {
    //     this.state['prop.thrusters'] =
    //         (this.state['prop.thrusters'] === "OFF") ? "ON" : "OFF";
    //     this.state['comms.recd'] += 32;
    //     console.log("Thrusters " + this.state["prop.thrusters"]);
    //     this.generateTelemetry();
    // }.bind(this));
};

Spacecraft.prototype.received = function (req, res) {
    this.state['prop.force'] += req.body.fuel;
    this.generateTelemetry();
    res.sendStatus(200);
}

Spacecraft.prototype.updateState = function () {
    this.state["prop.force"] = Math.max(
        0,
        this.state["prop.force"] -
        (this.state["prop.thrusters"] === "ON" ? 0.5 : 0)
    );
    this.state["pwr.temp"] = this.state["pwr.temp"] * 0.985 +
        Math.random() * 0.25 + Math.sin(Date.now());
    if (this.state["prop.thrusters"] === "ON") {
        this.state["pwr.c"] = 8.15;
    } else {
        this.state["pwr.c"] = this.state["pwr.c"] * 0.985;
    }
    this.state["pwr.v"] = 30 + Math.pow(Math.random(), 3);
};



Spacecraft.prototype.listenCan = function () {
    let byteArrayToLong = function ( /*byte[]*/ byteArray) {
        var value = 0;
        for (var i = 0; i < array.length; i++) {
            value = (value << 8) | byteArray[i];
        }
        return value;
    };
    console.log("import serialport library");
    const serialPort = require('serialport');
    var sp = new serialPort("/dev/ttyUSB0", {
        baudRate: 115200
    });
    let parser = sp.pipe(new SerialPort.parsers.Readline({delimiter: '\r\n'}))
    let self = this;
    parser.on('data', function (data) {
        if (calibrating > 30) {
            let d = data.toString().split(' ');

            let id = d[0];
            let val = 0;

            if(parseInt(d[1]) === 1){
                val = parseInt(d[2], 16);
            } else {
                val = byteArrayToLong(d.splice(0, 2));
            }
            self.state[config[id]] = val;
            self.generateTelemetry();
        } else {
            calibrating++;
            console.log(calibrating);
        }
    });
}

/**
 * Takes a measurement of spacecraft state, stores in history, and notifies 
 * listeners.
 */
Spacecraft.prototype.generateTelemetry = function () {
    var timestamp = Date.now(),
        sent = 0;
    Object.keys(this.state).forEach(function (id) {
        var state = {
            timestamp: timestamp,
            value: this.state[id],
            id: id
        };
        this.notify(state);
        this.history[id].push(state);
        this.state["comms.sent"] += JSON.stringify(state).length;
    }, this);
};

Spacecraft.prototype.notify = function (point) {
    this.listeners.forEach(function (l) {
        l(point);
    });
};

Spacecraft.prototype.listen = function (listener) {
    this.listeners.push(listener);
    return function () {
        this.listeners = this.listeners.filter(function (l) {
            return l !== listener;
        });
    }.bind(this);
};

module.exports = Spacecraft;