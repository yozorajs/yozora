#! /usr/bin/env node

import { launch } from '@guanghechen/plop-helper'
import path from 'node:path'

launch(process.argv, args => ({
  configPath: args.plopfile || path.join(__dirname, 'index.js'),
}))
