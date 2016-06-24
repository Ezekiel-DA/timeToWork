import test from 'tape';
import * as dataCollection from '../server/dataCollection';

test('dataCollection', t => {
    dataCollection.start();
    t.end();
});