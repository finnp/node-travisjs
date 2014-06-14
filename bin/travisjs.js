#!/usr/bin/env node
var travisjs = require('../index.js');

var program = require('nomnom')
  .script('travisjs')
  ;
  
program.command('init')
  .help('initialize travis (hook and yml)')
  .callback(function (opts) {
      travisjs.yml();
      // TODO: git add and commit, maybe
      travisjs.hook();
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
  .help('activate hook for this repo')
  .callback(function (opts) {
    travisjs.hook();
  })

program.command('status')
  .help('shows the status of the tests')
  .callback(function (opts) {
    travisjs.status();
  })
  ;
  
program.parse();
