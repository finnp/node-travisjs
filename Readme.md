# travisjs

[![Build Status](https://travis-ci.org/finnp/node-travisjs.svg?branch=master)](https://travis-ci.org/finnp/node-travisjs)

Travisjs is a command line application for travis, especially targeted 
for managing tests for  node modules. It is inspired by `travisify` and `git-travis` 
(which is uses internally).

Install with `npm install travisjs -g`

```
Usage: travisjs <command>

command
  init       initialize travis (hook and yml)
  badge      generate badge
  open       open travis page
  yml        creates a .travis.yml
  hook       set up hook for this repo
  status     shows the status of the tests
```