import { createTesters, parsers } from '../../../jest.setup'

// Generate answers for gfm cases (without gfm extensions)
createTesters(parsers.gfm)
  .scan(['gfm/**/#616.json', 'gfm/**/#619.json', 'gfm/**/#620.json'])
  .runAnswer()

// Generate answers for gfm-ex cases (with gfm extensions)
createTesters(parsers.gfmEx)
  .scan([
    'gfm/**/*.json',
    '!gfm/**/#616.json',
    '!gfm/**/#619.json',
    '!gfm/**/#620.json',
  ])
  .runAnswer()

// Generate answers for other cases
createTesters(parsers.yozora).scan(['custom/**/*.json']).runAnswer()
