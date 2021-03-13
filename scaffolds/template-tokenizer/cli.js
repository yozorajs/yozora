#! /usr/bin/env node

const { launch } = require('@guanghechen/plop-helper')
const path = require('path')

launch(process.argv, args => ({
  configPath: args.plopfile || path.join(__dirname, 'index.js'),
}))
