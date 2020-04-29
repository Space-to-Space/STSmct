function setup() {
    var Spacecraft = require('./spacecraft');
    var RealtimeServer = require('./realtime-server');
    var HistoryServer = require('./history-server');

    var expressWs = require('express-ws');
    var app = require('express')();
    expressWs(app);

    var spacecraft = new Spacecraft();
    var realtimeServer = new RealtimeServer(spacecraft);
    var historyServer = new HistoryServer(spacecraft);

    app.use('/realtime', realtimeServer);

    console.log('route');
    app.use('/history', function(req, res){
        console.log('hi!');
        res.sendStatus(200);
    });

    
}

module.exports = setup;