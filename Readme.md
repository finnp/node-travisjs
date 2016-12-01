# travisjs

Mac / Linux | Windows
----------  | ---------
[![Build Status](https://travis-ci.org/finnp/node-travisjs.svg?branch=master)](https://travis-ci.org/finnp/node-travisjs) | [![Windows Build status](http://img.shields.io/appveyor/ci/finnp/node-travisjs.svg)](https://ci.appveyor.com/project/finnp/node-travisjs/branch/master)

[![Standard - JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Travisjs is a command line application for travis, especially targeted
for managing tests for  node modules. It is inspired by `travisify` and `git-travis`
(which is uses internally).

Install with `npm install travisjs -g`

```
Usage: travisjs <command>

command
  version    display the current version
  init       initialize travis (hook and yml)
  badge      generate badge
  open       open travis page
  yml        creates a .travis.yml
  hook       set up hook for this repo
  status     shows the status of the tests
  config     shows the location of the config file
  lint       validate your .travis.yml
```

## config file

Travisjs config file location can be shown with `travisjs config`.

It can have a couple of properties:

| Property | Description
| :------: | :----------
| token    | Access token — you don't want to touch this.
| node_js  | Node.js versions to include in generated .travis.yml file.

Example config file:

```
token: xxx
node_js:
  - '0.10'
  - '0.12'
  - iojs
```
