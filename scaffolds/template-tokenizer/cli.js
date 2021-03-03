#! /usr/bin/env node

const argv = require('minimist')(args)
const path = require('path')
const { Plop, run } = require('plop')

const args = process.argv.slice(2)

argv.plopfile = argv.plopfile || path.resolve(__dirname, 'index.js')

Plop.launch(
  {
    cwd: argv.cwd,
    configPath: argv.plopfile,
    require: argv.require,
    completion: argv.completion,
  },
  run,
)
