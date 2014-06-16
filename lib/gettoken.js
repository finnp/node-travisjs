var ghauth = require('ghauth'); // deletion of authorization would be neat https://developer.github.com/v3/oauth_authorizations/#delete-an-authorization
var request = require('request');

// config has a get and a set method
module.exports = function (config, userAgent, travisHeaders, travisUrl) {
  return function getToken(cb) {
    var authOpts = {
      scopes: [
        "read:org",
        "user:email",
        "repo_deployment",
        "repo:status",
        "write:repo_hook"
      ],
      userAgent: userAgent,
      note: userAgent,
      noSave: true
    }

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
}