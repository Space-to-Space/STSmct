/*global require,process,console*/

/**
 * Usage:
 *
 * npm install minimist express
 * node app.js [options]
 */


const options = require('minimist')(process.argv.slice(2));
const express = require('express');
const app = express();
const fs = require('fs');
const request = require('request');
const bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
// Defaults
options.port = options.port || options.p || 8080;
options.host = options.host || 'localhost';
options.directory = options.directory || options.D || '.';

// Show command line options
if (options.help || options.h) {
    console.log("\nUsage: node app.js [options]\n");
    console.log("Options:");
    console.log("  --help, -h               Show this message.");
    console.log("  --port, -p <number>      Specify port.");
    console.log("  --directory, -D <bundle>   Serve files from specified directory.");
    console.log("");
    process.exit(0);
}

app.disable('x-powered-by');

app.use('/proxyUrl', function proxyRequest(req, res, next) {
    console.log('Proxying request to: ', req.query.url);
    req.pipe(request({
        url: req.query.url,
        strictSSL: false
    }).on('error', next)).pipe(res);
});

const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');
webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
webpackConfig.plugins.push(function () {
    this.plugin('watch-run', function (watching, callback) {
        console.log('Begin compile at ' + new Date());
        callback();
    })
});

webpackConfig.entry.openmct = [
    'webpack-hot-middleware/client?reload=true',
    webpackConfig.entry.openmct
];

const compiler = webpack(webpackConfig);

app.use(require('webpack-dev-middleware')(
    compiler, {
        publicPath: '/dist',
        logLevel: 'warn'
    }
));

app.use(require('webpack-hot-middleware')(
    compiler, {

    }
));

app.use('/plugins', express.static('./plugins'));


var expressWs = require('express-ws');
expressWs(app);

const setup = require('./endpoints/server');
setup(app);

// Expose index.html for development users.
app.get('/', function (req, res) {
    fs.createReadStream('index.html').pipe(res);
});

app.get('/dictionary.json', function (req, res) {
    fs.createReadStream('dictionary.json').pipe(res);
});

// Finally, open the HTTP server and log the instance to the console
app.listen(8080);