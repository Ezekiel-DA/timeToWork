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
let places = JSON.parse(fs.readFileSync('private/places.json')).places.join('|');
let apiKey = process.env['TTW_GOOGLE_DISTANCE_MATRIX_API_KEY'];
if (!apiKey) {
    throw new Error('Missing API key for Google Distance Matrix API. Did you remember to set TTW_GOOGLE_DISTANCE_MATRIX_API_KEY ?');
}

let baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';
let url = `${baseUrl}?origins=${places}&destinations=${places}&key=${apiKey}&departure_time=now&mode=driving&alternatives=true&units=metric&traffic_model=best_guess`;

function queryTravelTime() {
    return request(url, { json: true })
    .then(res => {
        let [toWork, fromWork] = res.rows.map(row => row.elements.filter(element => element.distance.value > 0)[0].duration.value);
        return {toWork, fromWork};
    });
}

// connect to MongoDB
mongodb.MongoClient.connect('mongodb://192.168.99.100:27017/ttw').then(db => {
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
    setInterval(getTravelTimeAndStoreInDB, 60 * 1000);
        
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


}).catch(err => {
    console.log('Failed to connect to MongoDB. Try: docker run -d --name ttw-mongo -p 27017:27017 mongo');
    throw err;
});

