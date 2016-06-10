'use strict';

import 'whatwg-fetch';

function getTasks() {
    return fetch('/api/tasks', { credentials: 'include' })
    .then(function (res) {
        return res.json();
    });
}
