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
        var time = moment(raw.daystamp);
        time.hours(h);
        time.minutes(m);
        return {
            time: time.toDate(),
            value: time.hours() < 12 ? sToM(raw.values[h][m].toWork) : (time.hours() < 13 ? null : sToM(raw.values[h][m].fromWork))
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

function draw(data, target) {
    var timeMarkers = [
        {time: moment(data.daystamp).hours(8).minutes(0).toDate()},
        {time: moment(data.daystamp).hours(17).minutes(0).toDate()}
    ];

    var commonSettings = {
        title: moment(data.daystamp).format("dddd, MMMM Do YYYY"),
        target, full_width: true, height: 400, left: 100, right: 50, area: false,
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
    else {
        MG.data_graphic(_.extend({    
            //data: singleArrayToArrayOfArray(rawDataToSingleArray(data)),
            data: rawDataToSingleArray(data),
            x_accessor: 'time', y_accessor: 'value',
            // legend: ['to', 'from']
        }, commonSettings));
    }
}

function getData(date) {
    return fetch('/api/data/' + date.toDate().toISOString(), { credentials: 'include' })
    .then(function (res) {
        return res.json();
    });
}

// build the list of n valid dates ('today' included) to display from the 'today' input
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

    return ret;
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
var moments = buildMoments(today);
var targetDivMaker = TargetDivGenerator(document.getElementById('ttw-graphs'));
Promise.all(moments.map(getData))
.then(allData => allData.map(data => draw(data, targetDivMaker.next().value)));

//setInterval(getData(today), 60*1000);
