import { createTesters, parsers } from '../../../jest.setup'

createTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester
    .scan([
      'gfm/definition',
      'gfm/link-reference',
      'gfm/image-reference',
      'custom/definition',
    ])
    .runTest(),
)
