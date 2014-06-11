var ghauth = require('ghauthprompt');
var request = require('request');

var travisUrl = 'https://api.travis-ci.org';
var userAgent = 'travis-init.js28';

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
    console.dir(body.access_token); // save the access_token here
  });
});