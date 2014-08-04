var nock = require('nock');
var test = require('tape');
var Travis = require('../lib/index.js');
var assert = require('assert');

var store = {
  set: function (key, value) {
    this[key] = value;
  },
  get: function (key) {
    return this[key];
  }
}

var travisjs = new Travis(store);

// ghauth mock (assumes it works correctly)
travisjs._ghauth = function (opts, cb) {
  assert.deepEqual(opts, {
    scopes: [
      "read:org",
      "user:email",
      "repo_deployment",
      "repo:status",
      "write:repo_hook"
    ],
    userAgent: 'node-travisjs',
    note: 'node-travisjs',
    noSave: true    
  });
  cb(null, {token: 'github_token'});
}

test('hook', function (t) {
  t.test('first time hook, github login', function (t) {   
    t.plan(1);
     
    // Mocking Travis
    var hookMock = nock('https://api.travis-ci.org', {
        reqheaders: {
          'Accept': 'application/vnd.travis-ci.2+json',
          'User-Agent': 'node-travisjs'
        }
      })
      
      .post('/auth/github', {'github_token':'github_token'})
      .reply(200, {'access_token':'travis_token'})
      
      .filteringPath(/\/repos\/[^&]*\/[^&]*/g, '/repos/user/repo')
      .get('/repos/user/repo')
      .reply(200, {repo: {id: 7}})
      
      .put('/hooks')
      .reply(200)
      
      .post('/users/sync')
      .reply(200, {result: true})
      
      .get('/users')
      .reply(200, {user: {is_syncing: true}})
      
      .get('/users')
      .reply(200, {user: {is_syncing: false}})
      ;
      
    // turning on of travis hook
    travisjs.hook(true);
    setTimeout(function () {
      hookMock.done(); // raises exceptions
      t.ok(hookMock.isDone(), 'sufficient travis api calls');
    }, 50);
  });
  
  t.test('activating hook after login', function (t) {
    t.plan(1);
    
    // Mocking Travis
    var hookMock = nock('https://api.travis-ci.org', {
        reqheaders: {
          'Accept': 'application/vnd.travis-ci.2+json',
          'User-Agent': 'node-travisjs'
        }
      })

      .filteringPath(/\/repos\/[^&]*\/[^&]*/g, '/repos/user/repo')
      .get('/repos/user/repo')
      .reply(200, {repo: {id: 7}})
      
      .put('/hooks')
      .reply(200) 
      
      .post('/users/sync')
      .reply(200, {result: true})
      
      .get('/users')
      .reply(200, {user: {is_syncing: false}})
      ;
    
    travisjs.hook(true);
    setTimeout(function () {
      hookMock.done(); // raises exceptions
      t.ok(hookMock.isDone(), 'sufficient travis api calls');
    }, 50);
    
  });
});