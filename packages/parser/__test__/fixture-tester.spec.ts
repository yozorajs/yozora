import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DefaultMarkupWeaver } from '@yozora/markup-weaver'
import YozoraParser from '@yozora/parser'
import type { IYozoraUseCaseAnswers, ParserName } from '@yozora/test-util'
import { MarkupTester, TokenizerTester } from '@yozora/test-util'
import { afterAll, expect, test } from 'vitest'

const directory = mkdtempSync(join(tmpdir(), 'yozora-test-util-'))
afterAll(() => rmSync(directory, { recursive: true, force: true }))

const ast = {
  type: 'root',
  children: [{ type: 'paragraph', children: [{ type: 'text', value: 'content' }] }],
}
const correct = { ast, markup: 'content' }
const incorrect = { ast: { type: 'root', children: [] }, markup: 'incorrect' }

const variants: readonly {
  name: string
  parserName: ParserName
  answer: IYozoraUseCaseAnswers
}[] = [
  {
    name: 'gfm',
    parserName: 'gfm',
    answer: { gfm: correct, 'gfm-ex': incorrect, yozora: incorrect },
  },
  {
    name: 'gfm-ex',
    parserName: 'gfm-ex',
    answer: { gfm: incorrect, 'gfm-ex': correct, yozora: incorrect },
  },
  {
    name: 'yozora',
    parserName: 'yozora',
    answer: { gfm: incorrect, 'gfm-ex': incorrect, yozora: correct },
  },
  {
    name: 'inherited-gfm-ex',
    parserName: 'yozora',
    answer: { gfm: incorrect, 'gfm-ex': correct, yozora: { html: '' } },
  },
  { name: 'inherited-gfm', parserName: 'yozora', answer: { gfm: correct, yozora: { html: '' } } },
]

for (const { name, parserName, answer } of variants) {
  const filename = `${name}.json`
  writeFileSync(
    join(directory, filename),
    JSON.stringify({
      title: name,
      cases: [{ description: 'selects the expected representation', input: 'content', answer }],
    }),
  )

  new TokenizerTester({ caseRootDirectory: directory, parser: new YozoraParser(), parserName })
    .scan(filename)
    .runTest()
  new MarkupTester({
    caseRootDirectory: directory,
    parser: new YozoraParser(),
    parserName,
    weaver: new DefaultMarkupWeaver(),
  })
    .scan(filename)
    .runTest()
}

test('updates only the selected parser and representation when generating answers', async () => {
  const filename = join(directory, 'writer.json')
  const answer: IYozoraUseCaseAnswers = {
    gfm: {
      html: '<p>baseline</p>',
      markup: 'baseline',
      ast: { position: { start: { line: 1, column: 1, offset: 0 } } },
    },
    'gfm-ex': { html: '', markup: 'extended', ast: { type: 'old' } },
    yozora: { html: '<p>custom</p>' },
  }
  writeFileSync(
    filename,
    JSON.stringify({
      title: 'writer',
      cases: [{ description: 'preserves other answers', input: 'content', answer }],
    }),
  )

  await new TokenizerTester({
    caseRootDirectory: directory,
    parser: new YozoraParser(),
    parserName: 'gfm-ex',
  })
    .scan('writer.json')
    .runAnswer()

  const afterAst = JSON.parse(readFileSync(filename, 'utf8'))
  expect(afterAst.cases[0].answer).toEqual({
    ...answer,
    'gfm-ex': { ...answer['gfm-ex'], ast },
  })

  await new MarkupTester({
    caseRootDirectory: directory,
    parser: new YozoraParser(),
    parserName: 'yozora',
    weaver: new DefaultMarkupWeaver(),
  })
    .scan('writer.json')
    .runAnswer()

  const afterMarkup = JSON.parse(readFileSync(filename, 'utf8'))
  expect(afterMarkup).toEqual({
    ...afterAst,
    cases: [
      {
        ...afterAst.cases[0],
        answer: {
          ...afterAst.cases[0].answer,
          yozora: { ...answer.yozora, markup: 'content' },
        },
      },
    ],
  })
  expect(readFileSync(filename, 'utf8')).toMatch(/"start": \{\n\s+"line": 1,/u)
})

test('creates a partial parser override without copying inherited fields', async () => {
  const filename = join(directory, 'partial.json')
  const answer = { gfm: { html: '<p>content</p>', markup: 'content', ast: { type: 'old' } } }
  writeFileSync(
    filename,
    JSON.stringify({
      title: 'partial',
      cases: [{ input: 'content', answer }],
    }),
  )

  await new TokenizerTester({
    caseRootDirectory: directory,
    parser: new YozoraParser(),
    parserName: 'yozora',
  })
    .scan('partial.json')
    .runAnswer()

  expect(JSON.parse(readFileSync(filename, 'utf8')).cases[0].answer).toEqual({
    ...answer,
    yozora: { ast },
  })
})
