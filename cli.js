#!/usr/bin/env node
var ghauth = require('ghauthprompt');
var request = require('request');
var Configstore = require('configstore');
var ghslug = require('github-slug');
var yaml = require('yamljs');
var fs = require('fs');

var travisUrl = 'https://api.travis-ci.org';
var userAgent = 'travis-init.js';

var travisHeaders = {
  'User-Agent': userAgent,
  'Accept': 'application/vnd.travis-ci.2+json'
};

function activateHook() {
  getToken(function (token) {
    travisHeaders.Authorization = 'token ' + token;
    // get slug
    ghslug('./', function (err, slug) {
      if(err) return console.error(err);
        console.log('Activating hook for ' + slug + '...');
        var req = {};
        req.url = travisUrl  + '/repos/' + slug;
        req.headers = travisHeaders;
        // get id for the repo
        request.get(req, function (err, response, data) {
          if(err) return console.error(err);
          if(response.statusCode !== 200)
            return console.error('Error' + response.statusCode);
          var hookId = JSON.parse(data).repo.id;
          // turn on the hook
          var req = {};
          req.url = travisUrl + '/hooks';
          req.headers = travisHeaders;
          req.json = {
            hook: {
              id: hookId,
              active: true
            }
          }
          request.put(req, function (err, response, data) {
            if(err) return console.error(err);
            if(response.statusCode !== 200)
              return console.error('Error' + response.statusCode);
            console.log('Activated hook for ' + slug);
          });
        });
        
    });
  });  
}


function getToken(cb) {
  var authOpts = {
    scopes: [
      "read:org",
      "user:email",
      "repo_deployment",
      "repo:status",
      "write:repo_hook"
    ],
    userAgent: userAgent,
    note: userAgent
  }
  
  var config = new Configstore('travis-init');
  var token = config.get('token');
  if(token) {
    cb(token)
  } else {
    ghauth(authOpts, function (err, authData) {
      if(err) return console.error(err);
      var req = {};
      req.url = travisUrl + '/auth/github';
      req.headers = travisHeaders;
      req.json = { 'github_token': authData.token };
      req.method = 'POST';
      req.encoding = 'utf8'

      request(req, function (err, response, body) {
        if(err) return console.error(err);
        if(response.statusCode !== 200) 
          return console.error('Error ' + response.statusCode)
          if(body.access_token) {
            config.set('token', body.access_token);
            cb(token);
          }
      });
    });  
  }
}

function generateBadge() {
  ghslug('./', function (err, slug) {
    console.log('[![Build Status](https://travis-ci.org/' + slug 
      + '.svg?branch=master)](https://travis-ci.org/' + slug + ')'
    );
  });
}

function createYML() {
  var opts = {
    language: 'node_js',
    node_js: ['0.10', '0.8']
  }
  var yml = yaml.stringify(opts, 10);
  console.log('Writing .travis.yml:');
  console.log(yml);
  fs.writeFileSync('./.travis.yml', yml);
}

// CLI parser

var parser = require('nomnom')
  .script('travisjs')
  ;
  
parser.command('init')
  .help('initialize travis (hook and yml)')
  .callback(function (opts) {
      createYML();
      // git add and commit ?
      activateHook();
  })
  ;
  
parser.command('badge')
  .help('generate badge')
  .callback(function (opts) {
      generateBadge();
  })
  ;
  
parser.command('yml')
  .help('creates a .travis.yml')
  .callback(function (opts) {
      createYML();
  })
  ;

parser.command('hook')
  .help('activate hook for this repo')
  .callback(function (opts) {
      activateHook();
  })
  ;
  

parser.parse();
