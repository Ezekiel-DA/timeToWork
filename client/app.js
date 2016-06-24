import 'babel-polyfill';
import 'whatwg-fetch';
import MG from 'metrics-graphics';
import moment from 'moment';
import * as services from './services'; 

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

function drawAll(allRawData, target) {
    var allData = allRawData.filter(rawData => rawData.values).map(rawDataToSingleArray);
    
    if (!allData.length) {
        return; // nothing to do, no data at all in input !
    }

    var timeMarkers = [
        {date: moment().hours(8).minutes(0).toDate()},
        {date: moment().hours(17).minutes(0).toDate()}
    ];
    MG.data_graphic({
        data: allData,
        'title': `${moment(allRawData[0].daystamp).format('dddd MMMM Do YYYY')} to ${moment(allRawData[allRawData.length-1].daystamp).format('dddd MMMM Do YYYY')}`,
        'target': target.graph, 'full_width': true, 'height': 500, 'left': 100,
        'markers': timeMarkers, 'x_extended_ticks': true, 'xax_count': 10, 'yax_count': 10,
        'y_label': 'mins', 'animate_on_load': true, 'missing_is_hidden': true, 'min_y': 30, 'show_secondary_x_label': false, 'decimals': 0,
        'y_extended_ticks': true, 'min_x': moment().hours(6).minutes(0).toDate(), 'max_x': moment().hours(20).minutes(0).toDate(),
        'legend': allData.map(data => moment(data[0].daystamp).format('ddd')), 'x_rollover_format': '%H:%M ', 'legend_target': target.legend
    });
}

function getData(date) {
    return fetch('/api/data/' + date.toDate().toISOString(), { credentials: 'include' })
    .then(function (res) {
        return res.json();
    });
}

// Create divs for the content and legends, returning a new one for each call to the generator and adding horizontal
// breaks when necessary. The returned value is an object of the form {graph: , legend: } where graph and legend are
// strings corresponding to the CSS IDs of the inserted elements.
// The input to the generator is the original div to add ourselves under.
function* TargetDivGenerator(root) {
    let count = 0;
    while(1) {
        let targetDiv = document.createElement('div');
        let id = `ttw-graph-${count++}`;
        targetDiv.id = id;
        root.appendChild(targetDiv);
        let legendTargetDiv = document.createElement('div');
        let legendId = `ttw-graph-legend-${count}`;
        legendTargetDiv.id = legendId;
        legendTargetDiv.style.textAlign = 'center';
        root.appendChild(legendTargetDiv);
        yield {
            graph: `#${id}`,
            legend: `#${legendId}`
        };
        let hr = document.createElement('hr');
        root.appendChild(hr);
    }
}

var today = moment().startOf('day');
if (today.isoWeekday() === 6 || today.isoWeekday() === 7) { // jump back to friday if weekend
    today.isoWeekday(5);
}
var moments = services.buildMoments(today);
var targetDivMaker = TargetDivGenerator(document.getElementById('ttw-graphs'));
Promise.all(moments.map(getData))
.then(allData => drawAll(allData, targetDivMaker.next().value));
