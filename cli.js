var ghauth = require('ghauthprompt');
var request = require('request');
var Configstore = require('configstore');
var originUrl = require('git-remote-origin-url');
var urlFromGit = require('github-url-from-git');
var urlParse = require('url').parse;

var travisUrl = 'https://api.travis-ci.org';
var userAgent = 'travis-init.js29';

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

getToken(function (token) {
  // get slug
  originUrl('./', function (err, url) {
    if(err) return console.error(err);
      var url = urlFromGit(url);
      console.log(urlParse(url).path.slice(1));
  });
});

function getToken(cb) {
  var config = new Configstore('travis-init');
  var token = config.get('token');
  if(token) {
    cb(token)
  } else {
    ghauth(authOpts, function (err, authData) {
      if(err) return console.error(err);
      var req = {};
      req.url = travisUrl + '/auth/github';
      req.headers = {
        'User-Agent': userAgent,
        'Accept': 'application/vnd.travis-ci.2+json'
      };
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

