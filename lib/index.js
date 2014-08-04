var request = require('request');
var ghslug = require('github-slug');
var yaml = require('yamljs');
var gittravis = require('git-travis');
var open = require('open');
var request = require('request');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var extend = require('util').inherits;

extend(Travis, EventEmitter);
module.exports = Travis;

function Travis(configstore) {
  this.configstore = configstore;
  this.userAgent = 'node-travisjs';
  this.travisUrl = 'https://api.travis-ci.org';
  this.travisHeaders = {
    'User-Agent': this.userAgent,
    'Accept': 'application/vnd.travis-ci.2+json'
  }
  this._ghauth = require('ghauth'); // deletion of authorization would be neat https://developer.github.com/v3/oauth_authorizations/#delete-an-authorization

}

Travis.prototype.hook = function (active) {
  var self = this;
  this._getToken(function (token) {
    self.travisHeaders.Authorization = 'token ' + token;
    // get slug
    ghslug('./', function (err, slug) {
      if(err) return console.error(err);
        var activeStr = active ? 'A' : 'Dea';
        console.log(activeStr + 'ctivating hook for ' + slug + '...');
        self._request('/repos/' + slug, {}, function (response, data) {

            // turn on the hook
            var hookId = JSON.parse(data).repo.id;
            var opts = {method: 'PUT'};
            opts.json = {
              hook: {
                id: hookId,
                active: active
              }
            };

            self._request('/hooks', opts, function (response, data) {
              console.log(activeStr + 'ctivated hook for ' + slug);
            })
        })
    });
  });  
}

Travis.prototype._request = function(endpoint, opts, cb) {
  opts = opts || {};
  opts.url = this.travisUrl + endpoint;
  opts.headers = this.travisHeaders;
  request(opts, function (err, res, data) {
    if(err) return console.error(err);
    if(res.statusCode !== 200)
      return console.error('Error ' + opts.url + ' ' + res.statusCode);
    cb(res, data);
  })
}

Travis.prototype.badge = function () {
  ghslug('./', function (err, slug) {
    console.log('[![Build Status](https://travis-ci.org/' + slug 
      + '.svg?branch=master)](https://travis-ci.org/' + slug + ')'
    );
  });
}

Travis.prototype.open = function () {
  ghslug('./', function (err, slug) {
    open('https://travis-ci.org/' + slug);
  });
}

Travis.prototype.yml = function () {
  var opts = {
    language: 'node_js',
    node_js: ['0.10', '0.8']
  }
  var yml = yaml.stringify(opts, 10);
  console.log('Writing .travis.yml:');
  console.log(yml);
  fs.writeFileSync('./.travis.yml', yml);
}

Travis.prototype.status = function () {
  // TODO: Other branches
  ghslug('./', function (err, slug) {
    var slug = slug.split('/');
    gittravis.print(slug[0], slug[1], 'master');
  });
}

Travis.prototype._getToken = function (cb) {
  var self = this;
  var authOpts = {
    scopes: [
      "read:org",
      "user:email",
      "repo_deployment",
      "repo:status",
      "write:repo_hook"
    ],
    userAgent: self.userAgent,
    note: self.userAgent,
    noSave: true
  }

  var token = self.configstore.get('token');
  if(token) {
    cb(token)
  } else {
    self._ghauth(authOpts, function (err, authData) {
      if(err) throw err;
      var req = {};
      req.url = self.travisUrl + '/auth/github';
      req.headers = self.travisHeaders;
      req.json = { 'github_token': authData.token };
      req.method = 'POST';
      req.encoding = 'utf8'

      request(req, function (err, response, body) {
        if(err) throw err;
        if(response.statusCode !== 200) 
          return console.error('Error ' + req.url + ' ' + response.statusCode)
          if(body.access_token) {
            self.configstore.set('token', body.access_token);
            cb(token);
          }
      });
    });  
  }
}