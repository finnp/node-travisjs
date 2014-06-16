#!/usr/bin/env node
var Travis = require('../lib/index.js');
var Configstore = require('configstore');

var travisjs = new Travis(new Configstore('travisjs'));

var program = require('nomnom')
  .script('travisjs')
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
  .callback(function (opts) {
    travisjs.hook(!opts.deactivate);
  })

program.command('status')
  .help('shows the status of the tests')
  .callback(function (opts) {
    travisjs.status();
  })
  ;
  
program.parse();
