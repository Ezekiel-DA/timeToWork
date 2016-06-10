'use strict';

import 'whatwg-fetch';
import 'metrics-graphics';

function massageData(raw) {
    return Object.keys(raw.values).map(h => Object.keys(raw.values[h]).map(m => {
        var time = new Date(raw.daystamp);
        time.setHours(h);
        time.setMinutes(m);
        return {
            time: time,
            toWork: Math.round(raw.values[h][m].toWork/60),
            fromWork: Math.round(raw.values[h][m].fromWork/60)
        }
    })).reduce(function(prev, cur) {
        prev = prev.concat(cur);
        return prev;
    }, []);
}

function draw(data) {
    MG.data_graphic({
        title: "To work",
        data: massageData(data),
        width: 800,
        height: 450,
        target: '.today-graph-towork',
        x_accessor: 'time',
        y_accessor: 'toWork',
        y_label: 'minutes',
        area: false,
        missing_is_hidden: true
    });
    MG.data_graphic({
        title: "From work",
        data: massageData(data),
        width: 800,
        height: 450,
        target: '.today-graph-fromwork',
        x_accessor: 'time',
        y_accessor: 'fromWork',
        y_label: 'minutes',
        area: false,
        missing_is_hidden: true
    });
}

function getData(date) {
    return fetch('/api/data/' + date.toISOString(), { credentials: 'include' })
    .then(function (res) {
        return res.json();
    }).then(function (data) {
        console.log(data);
        draw(data);
    });
}

getData(new Date());
setInterval(getData(new Date()), 60*1000);
