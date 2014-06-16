var request = require('request');
var ghslug = require('github-slug');
var yaml = require('yamljs');
var gittravis = require('git-travis');
var getToken = require('./gettoken.js');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var extend = require('util').inherits;

extend(Travis, EventEmitter);
module.exports = Travis;

function Travis(configstore) {
  this.configstore = configstore;
  this.userAgent = 'travis-init.js';
  this.travisUrl = 'https://api.travis-ci.org';
  this.travisHeaders = {
    'User-Agent': this.userAgent,
    'Accept': 'application/vnd.travis-ci.2+json'
  }
  this._getToken = getToken(
    this.configstore, 
    this.userAgent, 
    this.travisHeaders,
    this.travisUrl
  );
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
        var req = {};
        req.url = self.travisUrl  + '/repos/' + slug;
        req.headers = self.travisHeaders;
        // get id for the repo
        request.get(req, function (err, response, data) {
          if(err) return console.error(err);
          if(response.statusCode !== 200)
            return console.error('Error' + response.statusCode);
          var hookId = JSON.parse(data).repo.id;
          // turn on the hook
          var req = {};
          req.url = self.travisUrl + '/hooks';  
          req.headers = self.travisHeaders;
          req.json = {
            hook: {
              id: hookId,
              active: active
            }
          }
          request.put(req, function (err, response, data) {
            if(err) return console.error(err);
            if(response.statusCode !== 200)
              return console.error('Error' + response.statusCode);
            console.log(activeStr + 'ctivated hook for ' + slug);
          });
        });
        
    });
  });  
}

Travis.prototype.badge = function () {
  ghslug('./', function (err, slug) {
    console.log('[![Build Status](https://travis-ci.org/' + slug 
      + '.svg?branch=master)](https://travis-ci.org/' + slug + ')'
    );
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