import test from 'tape';
import * as services from '../client/services';
import moment from 'moment';

// if today is Wednesday Jun 22 and n is 3, the expected output is a bunch of moments corresponding to:
// [ [6/6, 6/7, 6/8, 6/9, 6/10], [6/13, 6/14, 6/15, 6/16, 6/17], [6/20, 6/21, 6/22] ]
test('buildWeeks', (t) => {
    var formatString = 'YYYY-MM-DD';
    t.deepEqual(
        services.buildWeeks(moment('2016-06-22'), 3).map(week => week.map(d => d.format(formatString))),
        [
            [moment('2016-06-06'), moment('2016-06-07'), moment('2016-06-08'), moment('2016-06-09'), moment('2016-06-10')].map(m => m.format(formatString)),
            [moment('2016-06-13'), moment('2016-06-14'), moment('2016-06-15'), moment('2016-06-16'), moment('2016-06-17')].map(m => m.format(formatString)),
            [moment('2016-06-20'), moment('2016-06-21'), moment('2016-06-22')].map(m => m.format(formatString))
        ],
        'produces an array of array containing the correct dates'
    );
    t.end();
});