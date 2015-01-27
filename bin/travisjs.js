#!/usr/bin/env node
var Travis = require('../lib/index.js');
var Configstore = require('configstore');

var store = new Configstore('travisjs')
var travisjs = new Travis(store);

var program = require('nomnom')
  .script('travisjs')
  ;
  
program.command('version')
  .help('display the current version')
  .callback(function () {
      return require('../package').version;
  })
  ;

program.command('init')
  .help('initialize travis (hook and yml)')
  .callback(function (opts) {
      travisjs.yml();
      // TODO: git add and commit, maybe
      travisjs.hook(true);
  })
  ;
  
program.command('badge')
  .help('generate badge')
  .callback(function (opts) {
    travisjs.badge();
  })
  ;
  
program.command('open')
  .help('open travis page')
  .callback(function (opts) {
    travisjs.open();
  })
  ;
  
program.command('yml')
  .help('creates a .travis.yml')
  .callback(function (opts) {
    travisjs.yml();
  })
  ;

program.command('hook')
  .help('set up hook for this repo')
  .option('deactivate', {
    abbr: 'd',
    flag: true,
    help: 'deactivate hook'
  })
  .option('skipsync', {
    abbr: 's',
    flag: true,
    help: 'skip the syncing'
  })
  .callback(function (opts) {
    travisjs.hook(opts);
  })

program.command('status')
  .help('shows the status of the tests')
  .callback(function (opts) {
    travisjs.status();
  })
  
program.command('config')
  .help('shows the location of the config file')
  .callback(function () {
    console.log(store.path)
  })


program.command('lint')
    .help('validate your .travis.yml')
    .callback(function () {
      travisjs.lint();
    })

program.parse();
