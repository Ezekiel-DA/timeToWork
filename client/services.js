import moment from 'moment';
import 'moment-range';

// Build a list of lists corresponding to moments (dates) for n weeks before today, in chronological order
// In other words : if today is Wednesday Jun 22 and n is 3, the expected output is a bunch of moments corresponding to:
// [ [6/6, 6/7, 6/8, 6/9, 6/10], [6/13, 6/14, 6/15, 6/16, 6/17], [6/20, 6/21, 6/22] ]
function buildWeeks(today, n = 3) {
    return new Array(n).fill([]).map((week, idx) => {
        return week.concat(moment.range(moment(today).subtract(idx, 'weeks').startOf('isoWeek'),
                                        idx ? moment(today).subtract(idx, 'weeks').endOf('isoWeek').isoWeekday(5) : moment(today).subtract(idx, 'weeks')).toArray('days'));
    }).reverse();
}

export {
    buildWeeks
};