#! /usr/bin/env node

import { launch } from '@guanghechen/plop-helper'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

launch(process.argv, args => ({
  configPath: args.plopfile || path.join(__dirname, 'index.mjs'),
}))
