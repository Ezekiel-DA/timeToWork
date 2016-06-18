'use strict';

import 'babel-polyfill';
import 'whatwg-fetch';
import MG from 'metrics-graphics';
import moment from 'moment';
import _ from 'underscore';
import d3 from 'd3';

function sToM(s) {
    return (s / 60);
}

function rawDataToSingleArray(raw) {
    return Object.keys(raw.values).map(h => Object.keys(raw.values[h]).map(m => {
        var time = moment();
        time.hours(h);
        time.minutes(m);
        return {
            date: time.toDate(),
            value: time.hours() < 12 ? sToM(raw.values[h][m].toWork) : (time.hours() < 13 ? null : sToM(raw.values[h][m].fromWork)),
            daystamp: raw.daystamp
        };
    })).reduce(function (prev, cur) {
        prev = prev.concat(cur);
        return prev;
    }, []);
}

function singleArrayToArrayOfArray(data) {
    return [data.map(c => {
        return { date: c.time, value: c.toWork };
    }), data.map(c => {
        return { date: c.time, value: c.fromWork };
    })];
}

function drawAll(allRawData, target) {
    var allData = allRawData.filter(rawData => rawData.values).map(rawDataToSingleArray);

    var timeMarkers = [
        {date: moment().hours(8).minutes(0).toDate()},
        {date: moment().hours(17).minutes(0).toDate()}
    ];
    MG.data_graphic({
        data: allData,
        title: `${moment(allRawData[0].daystamp).format('dddd MMMM Do YYYY')} to ${moment(allRawData[allRawData.length-1].daystamp).format('dddd MMMM Do YYYY')}`,
        target, full_width: true, height: 500, left: 100, right: 50,
        markers: timeMarkers, x_extended_ticks: true, xax_count: 10, yax_count: 10,
        y_label: 'mins', animate_on_load: true, missing_is_hidden: true, min_y: 30, show_secondary_x_label: false, decimals: 0,
        y_extended_ticks: true, min_x: moment().hours(6).minutes(0).toDate(), max_x: moment().hours(20).minutes(0).toDate(),
        legend: allData.map(data => moment(data[0].daystamp).format('ddd')), x_rollover_format: '%H:%M '
    });
}

function draw(data, target) {
    var timeMarkers = [
        {time: moment(data.daystamp).hours(8).minutes(0).toDate()},
        {time: moment(data.daystamp).hours(17).minutes(0).toDate()}
    ];

    var commonSettings = {
        title: moment(data.daystamp).format("dddd, MMMM Do YYYY"),
        target, full_width: true, height: 400, left: 50, right: 50, area: false,
        markers: timeMarkers, x_extended_ticks: true, xax_count: 10,
        y_label: 'mins', animate_on_load: true, missing_is_hidden: true, min_y: 30, show_secondary_x_label: false, decimals: 0,
        y_extended_ticks: true, min_x: moment(data.daystamp).hours(6).minutes(0).toDate(), max_x: moment(data.daystamp).hours(20).minutes(0).toDate()
    };

    if (!data.values) {
        MG.data_graphic(_.extend({
            chart_type: 'missing-data',
            missing_text: 'No data for '+moment(data.daystamp).format("dddd, MMMM Do YYYY")    
        }, commonSettings));
    }
}

function getData(date) {
    return fetch('/api/data/' + date.toDate().toISOString(), { credentials: 'include' })
    .then(function (res) {
        return res.json();
    });
}

// build the list of n valid dates ('today' included) to display from the 'today' input, in chronological order
function buildMoments(today, n = 5) {
    let t = moment(today);
    let ret = [];
    ret.push(moment(t));

    while (ret.length < n) {
        t.subtract(1, 'days');
        if (t.isoWeekday() === 6 || t.isoWeekday() === 7) {
            continue;
        }
        ret.push(moment(t));
    }

    return ret.reverse();
}

function* TargetDivGenerator(root) {
    let count = 0;
    while(1) {
        let targetDiv = document.createElement('div');
        let id = `ttw-graph-${count++}`;
        targetDiv.id = id;
        root.appendChild(targetDiv);
        yield `#${id}`;
        let hr = document.createElement('hr');
        root.appendChild(hr);
    }
}

var today = moment().startOf('day');
if (today.isoWeekday() === 6 || today.isoWeekday() === 7) { // jump back to friday if weekend
    today.isoWeekday(5);
}
var moments = buildMoments(today);
var targetDivMaker = TargetDivGenerator(document.getElementById('ttw-graphs'));
Promise.all(moments.map(getData))
.then(allData => drawAll(allData, targetDivMaker.next().value));
