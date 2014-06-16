var nock = require('nock');
var test = require('tape');
var Travis = require('../lib/index.js');

var store = {
  set: function (key, value) {
    this[key] = value;
  },
  get: function (key) {
    return this[key];
  },
  token: 'testtoken'
}

var travisjs = new Travis(store);

test('hook', function (t) {
  t.plan(1);
  var hookMock = nock('https://api.travis-ci.org')
    .get('/repos/finnp/node-travisjs')
    .reply(200, {repo: {id: 7}})
    .put('/hooks')
    .reply(200) // filter for the correct travis headers
    ;
  // turning on of travis hook
  travisjs.hook(true);
  setTimeout(function () {
    t.ok(hookMock.isDone(), 'sufficient calls to travis-ci.org');
  }, 50);
});