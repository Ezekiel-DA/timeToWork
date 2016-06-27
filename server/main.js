/*global require*/
(function () {
    'use strict';

    let Promise = require('bluebird');
    let request = require('request-promise');
    let httpStatus = require('http-status');
    let process = require('process');
    let express = require('express');
    let mongodb = require('mongodb');
    let moment = require('moment');
    let fs = require('fs');
    let dataCollection = require('./dataCollection.js');

    // basic express setup
    var app = express();
    app.disable('x-powered-by');
    app.use(express.static('client/static'));
    app.listen(8000);
    
    // generate a delay (in milliseconds) to back off before the next connection attempt to MongoDB
    // warning: input in SECONDS, output in MILLISECONDS
    function* exponentialBackoffGenerator(maxRetries = 10, firstDelayInS = 3, maxDelayInS = 10 * 60) {
        let tries = 0
        while (tries < maxRetries) {
            yield Math.min(maxDelayInS, Math.pow(firstDelayInS, tries++)) * 1000
        }
    }

    // connect to MongoDB
    let mongodbUrl = process.env['TTW_MONGODB_URL'];
    if (!mongodbUrl) {
        throw new Error('Missing MongoDB URL setting. Did you remember to set TTW_MONGODB_URL to mongodb://<host>:<port>/<db> ?');
    }

    function onDBConnected(db) {
        console.log('connected to MongoDB');
        let collection = db.collection('datapoints');

        // start the data collector (queries Google Distance Matrix and saves to DB)
        dataCollection.start(collection);

        // API endpoints
        app.get('/api/data/:day', (req, res) => {
            let reqDate = moment(req.params.day, 'YYYY-MM-DD');

            if (!reqDate.isValid()) {
                return res.sendStatus(httpStatus.BAD_REQUEST);
            }

            collection.findOne({ daystamp: reqDate.startOf('day').toDate() })
                .then(data => {
                    data = data || { daystamp: req.params.day };
                    res.send(data);
                })
                .catch(err => {
                    console.log(err);
                    res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
                });
        });
    }

    let eb = exponentialBackoffGenerator()

    mongodb.MongoClient.connect(mongodbUrl)
    .then(onDBConnected)
    .catch(function retryConnectionOnError(err) {
        console.log('MongoDB connection error:', err)
        let waitBeforeNextAttempt = eb.next();
        if (waitBeforeNextAttempt.done) {
            console.log('FATAL ERROR: too many failed connection attempts to MongoDB. Giving up...')
            process.exit(1)
        }
        return Promise.delay(eb.next().value).then(mongodb.MongoClient.connect.bind(mongodb.MongoClient, mongodbUrl)).then(onDBConnected).catch(retryConnectionOnError)
    })
})();
