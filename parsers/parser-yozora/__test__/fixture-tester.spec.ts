import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DefaultMarkupWeaver } from '@yozora/markup-yozora'
import YozoraParser from '@yozora/parser-yozora'
import { afterAll, expect, test } from 'vitest'
import type { IYozoraUseCaseAnswers, ParserName } from '../../../script/test/index.mjs'
import { MarkupTester, TokenizerTester } from '../../../script/test/index.mjs'

const directory = mkdtempSync(join(tmpdir(), 'yozora-test-util-'))
afterAll(() => rmSync(directory, { recursive: true, force: true }))

const ast = {
  type: 'root',
  children: [{ type: 'paragraph', children: [{ type: 'text', value: 'content' }] }],
}
const correct = { ast, markup: 'content' }
const incorrect = { ast: { type: 'root', children: [] }, markup: 'incorrect' }

test('collects each fixture once when grouping sibling directories', () => {
  const caseRootDirectory = mkdtempSync(join(directory, 'nested-'))
  for (const name of ['first', 'second']) {
    const groupDirectory = join(caseRootDirectory, 'group', name)
    mkdirSync(groupDirectory, { recursive: true })
    writeFileSync(
      join(groupDirectory, 'case.json'),
      JSON.stringify({ cases: [{ input: name, answer: { gfm: {} } }] }),
    )
  }

  const groups = new TokenizerTester({
    caseRootDirectory,
    parser: new YozoraParser(),
    parserName: 'yozora',
  })
    .scan('**/*.json')
    .collect()
  const inputs: string[] = []
  for (const group of groups) {
    inputs.push(...group.cases.map(kase => kase.input))
    groups.push(...group.subGroups)
  }
  expect(inputs.sort()).toEqual(['first', 'second'])
})

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

test.each(['ast', 'markup'] as const)(
  'preserves grouping metadata when generating %s answers from full scans',
  async representation => {
    const caseRootDirectory = mkdtempSync(join(directory, 'metadata-'))
    const filepath = join(caseRootDirectory, '#001.json')
    const metadataPath = join(caseRootDirectory, 'meta.json')
    const metadata =
      JSON.stringify({ groups: { unclassified: {}, ast: { text: ['#001'] } } }, null, 4) + '\n\n'
    const answer = { gfm: { html: '<p>content</p>' } }
    writeFileSync(metadataPath, metadata)
    writeFileSync(
      filepath,
      JSON.stringify({
        title: 'writer',
        cases: [{ description: 'content', input: 'content', answer }],
      }),
    )

    const props = {
      caseRootDirectory,
      parser: new YozoraParser(),
      parserName: 'yozora' as const,
    }
    const tester = (
      representation === 'ast'
        ? new TokenizerTester(props)
        : new MarkupTester({ ...props, weaver: new DefaultMarkupWeaver() })
    ).scan('**/*.json')
    expect(tester.collect().map(group => group.filepath)).toEqual([filepath])

    await tester.runAnswer()

    expect(readFileSync(metadataPath, 'utf8')).toBe(metadata)
    expect(JSON.parse(readFileSync(filepath, 'utf8')).cases[0].answer).toEqual({
      ...answer,
      yozora: { [representation]: representation === 'ast' ? ast : 'content' },
    })
  },
)

test('keeps fixtures named meta.json in full scans', async () => {
  const caseRootDirectory = mkdtempSync(join(directory, 'named-metadata-'))
  const filepath = join(caseRootDirectory, 'meta.json')
  writeFileSync(filepath, JSON.stringify({ cases: [{ input: 'content', answer: { gfm: {} } }] }))

  const tester = new TokenizerTester({
    caseRootDirectory,
    parser: new YozoraParser(),
    parserName: 'gfm',
  }).scan('**/*.json')
  expect(tester.collect()).toHaveLength(1)

  await tester.runAnswer()

  expect(JSON.parse(readFileSync(filepath, 'utf8')).cases[0].answer.gfm.ast).toEqual(ast)
})

test.each([
  ['missing cases', { title: 'fixture' }],
  ['null cases', { cases: null }],
  ['non-array cases', { cases: {} }],
  ['invalid groups', { groups: [] }],
  ['null document', null],
])('rejects invalid fixture %s without caching failed scans', (_name, data) => {
  const caseRootDirectory = mkdtempSync(join(directory, 'invalid-'))
  const filepath = join(caseRootDirectory, 'fixture.json')
  writeFileSync(filepath, JSON.stringify(data))

  const tester = new TokenizerTester({
    caseRootDirectory,
    parser: new YozoraParser(),
    parserName: 'gfm',
  })
  expect(() => tester.scan('**/*.json')).toThrowError(`Invalid fixture cases in ${filepath}`)
  expect(tester.collect()).toHaveLength(0)

  writeFileSync(filepath, JSON.stringify({ cases: [{ input: 'content', answer: { gfm: {} } }] }))
  tester.scan('**/*.json')
  expect(tester.collect()).toHaveLength(1)
})
