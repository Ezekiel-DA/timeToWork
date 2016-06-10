/*global require*/

'use strict';

let request = require('request-promise');
let httpStatus = require('http-status');
let process = require('process');
let express = require('express');
let mongodb = require('mongodb');
let moment = require('moment');
let fs = require('fs');
    
// basic express setup
var app = express();
app.disable('x-powered-by');
app.use(express.static('client/static'));
app.listen(8000);
    
// Google Distance Matrix API setup
var places;
try {
    places = JSON.parse(fs.readFileSync('private/places.json'));
    if (!places) {
        throw new Error('Places file parsed as JSON but resulted in an empty object.');
    }
}
catch (err) {
    console.log('Failed to get home/work place settings. Does private.places.json exist and contain {"home": "<address>", "work": "<address">} ?');
    throw(err);
}


let apiKey = process.env['TTW_GOOGLE_DISTANCE_MATRIX_API_KEY'];
if (!apiKey) {
    throw new Error('Missing API key for Google Distance Matrix API. Did you remember to set TTW_GOOGLE_DISTANCE_MATRIX_API_KEY ?');
}

let baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';
let options = 'departure_time=now&mode=driving&alternatives=true&units=metric&traffic_model=best_guess';
let urlToWork = `${baseUrl}?origins=${places.home}&destinations=${places.work}&key=${apiKey}&${options}`;
let urlFromWork = `${baseUrl}?origins=${places.work}&destinations=${places.home}&key=${apiKey}&${options}`;

function queryTravelTime() {
    return Promise.all([request(urlToWork, { json: true }), request(urlFromWork, {json: true})])
    .then(resArray => {
        let [toWork, fromWork] = resArray.map(res => res.rows[0].elements[0].duration_in_traffic.value);
        return {toWork, fromWork};
    });
}

// connect to MongoDB
let mongodbUrl = process.env['TTW_MONGODB_URL'];
if (!mongodbUrl) {
    throw new Error('Missing MongoDB URL setting. Did you remember to set TTW_MONGODB_URL to mongodb://<host>:<port>/<db> ?');
}
mongodb.MongoClient.connect(mongodbUrl).then(db => {
    console.log('connected to MongoDB');
    let collection = db.collection('datapoints');
    // query Google Distance Matrix every minute
    function getTravelTimeAndStoreInDB() {
        queryTravelTime().then(timeInfo => {
            let now = moment();
            let data = {};
            data[`values.${now.hours() }.${now.minutes() }`] = timeInfo;
            
            collection.updateOne(
                { daystamp: now.startOf('day').toDate() },
                { $set: data },
                { upsert: true }
            );
        });
    }
    
    getTravelTimeAndStoreInDB();
    setInterval(getTravelTimeAndStoreInDB, 120 * 1000);
        
    // API endpoints
    app.get('/api/data/:day', (req, res) => {
        let reqDate = moment(req.params.day, 'YYYY-MM-DD');
        
        if (!reqDate.isValid()) {
            return res.sendStatus(httpStatus.BAD_REQUEST);
        }
        
        collection.findOne({daystamp: reqDate.startOf('day').toDate()})
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            console.log(err);
            res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
        });
    });

});

