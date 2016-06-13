/*global require*/
(function () {
    'use strict';

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

    // connect to MongoDB
    let mongodbUrl = process.env['TTW_MONGODB_URL'];
    if (!mongodbUrl) {
        throw new Error('Missing MongoDB URL setting. Did you remember to set TTW_MONGODB_URL to mongodb://<host>:<port>/<db> ?');
    }
    mongodb.MongoClient.connect(mongodbUrl).then(db => {
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
                    res.send(data);
                })
                .catch(err => {
                    console.log(err);
                    res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
                });
        });

    });
})();
