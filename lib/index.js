var request = require('request')
var ghslug = require('github-slug')
var yaml = require('yamljs')
var gittravis = require('git-travis')
var open = require('open')
var fs = require('fs')
var travislint = require('travis-lint')
var EventEmitter = require('events').EventEmitter
var extend = require('util').inherits

extend(Travis, EventEmitter)
module.exports = Travis

function Travis (configstore) {
  this.configstore = configstore
  this.userAgent = 'Travis'
  this.travisUrl = 'https://api.travis-ci.org'
  this.travisHeaders = {
    'User-Agent': this.userAgent,
    'Accept': 'application/vnd.travis-ci.2+json'
  }
  this._ghauth = require('ghauth') // deletion of authorization would be neat https://developer.github.com/v3/oauth_authorizations/#delete-an-authorization
}

Travis.prototype.hook = function (opts, cb) {
  cb = cb || function () {}
  var self = this
  var active = !opts.deactivate
  this._getToken(function (token) {
    self.travisHeaders.Authorization = 'token ' + token
    // get slug
    ghslug('./', function (err, slug) {
      if (err) return console.error(err)

      if (opts.skipsync) return setHook()

      // sync
      process.stdout.write('Syncing repos..')
      self._request('/users/sync', {method: 'POST'}, function () {
        self._waitSync(setHook)
      })

      function setHook () {
        var activeStr = active ? 'A' : 'Dea'
        console.log(activeStr + 'ctivating hook for ' + slug + '...')
        self._request('/repos/' + slug, {}, function (response, data) {
            // turn on the hook
          var hookId = JSON.parse(data).repo.id
          var opts = {method: 'PUT'}
          opts.json = {
            hook: {
              id: hookId,
              active: active
            }
          }

          self._request('/hooks', opts, function (response, data) {
            console.log(activeStr + 'ctivated hook for ' + slug)
            cb()
          })
        })
      }
    })
  })
}

Travis.prototype._waitSync = function (cb) {
  var self = this
  process.stdout.write('.')
  self._request('/users', {}, function (res, data) {
    data = JSON.parse(data)
    if (data.user.is_syncing) {
      self._waitSync(cb)
    } else {
      process.stdout.write('\n')
      cb()
    }
  })
}

Travis.prototype._request = function (endpoint, opts, cb) {
  opts = opts || {}
  opts.url = this.travisUrl + endpoint
  opts.headers = this.travisHeaders
  request(opts, function (err, res, data) {
    if (err) return console.error(err)
    if (res.statusCode !== 200) {
      console.error('Error', res.statusCode, data)
      if (res.statusCode === 500) {
        console.error('Maybe you haven\'t authed Travis with GitHub yet. Go to http://travis-ci.org and click "Sign up with GitHub".')
      }
      return
    }
    cb(res, data)
  })
}

Travis.prototype.badge = function () {
  ghslug('./', function (err, slug) {
    if (err) return console.error('Could not determine repository')
    console.log('[![Build Status](https://travis-ci.org/' + slug + '.svg?branch=master)](https://travis-ci.org/' + slug + ')'
    )
  })
}

Travis.prototype.open = function () {
  ghslug('./', function (err, slug) {
    if (err) return console.error('Could not determine repository')
    open('https://travis-ci.org/' + slug)
  })
}

Travis.prototype.yml = function () {
  var opts = {
    language: 'node_js',
    sudo: false,
    node_js: this.configstore.get('node_js') || [4, 6, 7]
  }
  var yml = yaml.stringify(opts, 10)
  console.log('Writing .travis.yml:')
  console.log(yml)
  fs.writeFileSync('./.travis.yml', yml)
}

Travis.prototype.status = function () {
  // TODO: Other branches
  ghslug('./', function (err, slug) {
    if (err) return console.error('Could not determine repository')
    slug = slug.split('/')
    gittravis.print(slug[0], slug[1], 'master')
  })
}

Travis.prototype._getToken = function (cb) {
  var self = this
  var authOpts = {
    scopes: [
      'read:org',
      'user:email',
      'repo_deployment',
      'repo:status',
      'write:repo_hook'
    ],
    userAgent: self.userAgent,
    note: self.userAgent,
    noSave: true
  }

  var token = self.configstore.get('token')
  if (token) {
    cb(token)
  } else {
    self._ghauth(authOpts, function (err, authData) {
      if (err) {
        var error = JSON.parse(err.message)
        console.error('Error:', error.message)
        var errors = error.errors || []
        errors.forEach(function (e) {
          if (e.code === 'already_exists') {
            console.error('You have already authed `node-travisjs`, please delete and try again: https://github.com/settings/applications')
          }
        })
        return
      }

      var req = {}
      req.url = self.travisUrl + '/auth/github'
      req.headers = self.travisHeaders
      req.json = { 'github_token': authData.token }
      req.method = 'POST'
      req.encoding = 'utf8'

      request(req, function (err, response, body) {
        if (err) throw err
        if (response.statusCode !== 200) return console.error('Error ' + req.url + ' ' + response.statusCode)
        if (body.access_token) {
          self.configstore.set('token', body.access_token)
          cb(body.access_token)
        }
      })
    })
  }
}

Travis.prototype.lint = function (cb) {
  travislint(fs.readFileSync('./.travis.yml'), function (err, warnings) {
    if (err) throw err

    if (warnings.length) {
      var warns = []
      var notes = []
      for (var item in warnings) {
        var warn = warnings[item]
        if (warn.key.length) {
          warns.push('\t - ' + warn.key[0] + ': ' + warn.message)
        } else {
          notes.push('\t - ' + warn.message)
        }
      }

      console.log('Warnings (' + warns.length + '):\n' + warns.join('\n'))
      console.log('Notes (' + notes.length + '):\n' + notes.join('\n'))
    } else {
      console.log('your .travis.yml is valid!')
    }
  })
}
