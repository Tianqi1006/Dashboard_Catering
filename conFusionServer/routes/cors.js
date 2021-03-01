const express = require('express');
const cors = require('cors');
const app = express();

const whitelist = ['http://localhost:30000', 'https://localhost:3443', 'http://localhost:4200']; //4200 corresponds to angular clients
var corsOptionsDelegate = (req, callback) => {
    var corsOptions;

    //check whether incoming request origin is in the whitelist
    if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true };
    }
    else {
        corsOptions = { origin: false };
    }
    callback(null, corsOptions);
};

exports.cors = cors(); //reply with the wildcard * (w/o options)
exports.corsWithOptions = cors(corsOptionsDelegate);