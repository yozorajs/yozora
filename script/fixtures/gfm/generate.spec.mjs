import assert from 'node:assert/strict'
import fs, {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createGFMFixturePlan, generateGFMFixtures, writeGFMFixturePlan } from './generate.mjs'

const checkedInFixturesRoot = fileURLToPath(new URL('../../../fixtures/', import.meta.url))

const flattenGroupIds = group =>
  Object.values(group).flatMap(value => (Array.isArray(value) ? value : flattenGroupIds(value)))

const listFixtureIds = directory =>
  readdirSync(directory)
    .filter(filename => /^#\d{3}[.]json$/.test(filename))
    .map(filename => filename.slice(0, -5))
    .sort()

const snapshotDirectory = directory =>
  Object.fromEntries(
    readdirSync(directory)
      .sort()
      .map(filename => [filename, readFileSync(join(directory, filename), 'utf8')]),
  )

const writeJson = (filepath, value) => writeFileSync(filepath, JSON.stringify(value, null, 2))

const createFixture = (exampleNo, input, ast, markup) => ({
  title: `GFM#${exampleNo} https://github.github.com/gfm/#example-${exampleNo}`,
  cases: [
    {
      description: `legacy ${exampleNo}`,
      input,
      answer: {
        gfm: {
          html: `<p>${input}</p>`,
          ...(markup === undefined ? {} : { markup }),
          ast,
        },
      },
    },
  ],
})

const createExample = (exampleNo, input) => ({
  title: `GFM#${exampleNo} https://github.github.com/gfm/#example-${exampleNo}`,
  description: `current ${exampleNo}`,
  content: input,
  expectedHtml: `<p>current ${exampleNo}</p>`,
})

test('is byte-idempotent and preserves all checked-in answers', async t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-idempotent-'))
  const fixturesRoot = join(rootDir, 'fixtures')
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))
  mkdirSync(fixturesRoot)

  for (const directoryName of ['gfm', 'gfm-new']) {
    const source = join(checkedInFixturesRoot, directoryName)
    const target = join(fixturesRoot, directoryName)
    if (fs.existsSync(source)) cpSync(source, target, { recursive: true })
    else mkdirSync(target)
  }
  const before = Object.fromEntries(
    ['gfm', 'gfm-new'].map(directoryName => [
      directoryName,
      snapshotDirectory(join(fixturesRoot, directoryName)),
    ]),
  )

  const summary = await generateGFMFixtures(rootDir)
  const after = Object.fromEntries(
    ['gfm', 'gfm-new'].map(directoryName => [
      directoryName,
      snapshotDirectory(join(fixturesRoot, directoryName)),
    ]),
  )

  assert.deepEqual(summary, { currentExamples: 677, matched: 677, new: 0 })
  assert.deepEqual(after, before)

  const mainCases = Object.entries(after.gfm)
    .filter(([filename]) => /^#\d{3}[.]json$/.test(filename))
    .map(([, raw]) => JSON.parse(raw).cases[0])
  assert.equal(mainCases.filter(fixtureCase => 'ast' in fixtureCase.answer.gfm).length, 677)
  assert.equal(mainCases.filter(fixtureCase => 'markup' in fixtureCase.answer.gfm).length, 677)
})

test('partitions renumbered duplicate inputs and preserves answers', async t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-partition-'))
  const fixturesRoot = join(rootDir, 'fixtures')
  const mainDir = join(fixturesRoot, 'gfm')
  const newDir = join(fixturesRoot, 'gfm-new')
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))
  for (const directory of [mainDir, newDir]) mkdirSync(directory, { recursive: true })

  writeJson(join(mainDir, '#001.json'), createFixture(1, 'duplicate', { id: 'one' }, 'one'))
  writeJson(join(mainDir, '#002.json'), createFixture(2, 'duplicate', { id: 'two' }, 'two'))
  writeJson(join(mainDir, 'meta.json'), {
    groups: { unclassified: {}, ast: { legacy: ['#001', '#002'] } },
  })
  writeJson(join(newDir, '#009.json'), {
    title: 'GFM#9 https://github.github.com/gfm/#example-9',
    cases: [{ input: 'stale', answer: { gfm: { html: '<p>stale</p>' } } }],
  })

  const examples = [
    null,
    createExample(1, 'new one'),
    createExample(2, 'new two'),
    createExample(3, 'duplicate'),
    createExample(4, 'duplicate'),
  ]
  const groups = [{ name: 'duplicate', start: 3, end: 4, excluded: [] }]

  const rollbackPlan = createGFMFixturePlan(rootDir, { examples, groups })
  const beforeRollback = Object.fromEntries(
    ['gfm', 'gfm-new'].map(directoryName => [
      directoryName,
      snapshotDirectory(join(fixturesRoot, directoryName)),
    ]),
  )
  const originalRename = fs.renameSync
  let renameCount = 0
  fs.renameSync = (...args) => {
    renameCount++
    if (renameCount === 4) throw new Error('injected rename failure')
    return originalRename(...args)
  }
  try {
    await assert.rejects(writeGFMFixturePlan(rootDir, rollbackPlan), /rolled back/)
  } finally {
    fs.renameSync = originalRename
  }
  assert.deepEqual(
    Object.fromEntries(
      ['gfm', 'gfm-new'].map(directoryName => [
        directoryName,
        snapshotDirectory(join(fixturesRoot, directoryName)),
      ]),
    ),
    beforeRollback,
  )
  assert.equal(
    readdirSync(fixturesRoot).some(filename => filename.includes('.gfm-')),
    false,
  )

  const stalePlan = createGFMFixturePlan(rootDir, { examples, groups })
  writeFileSync(join(mainDir, '#001.json'), `${readFileSync(join(mainDir, '#001.json'), 'utf8')}\n`)
  await assert.rejects(
    writeGFMFixturePlan(rootDir, stalePlan),
    /GFM fixtures changed after planning/,
  )
  assert.equal(readdirSync(fixturesRoot).includes('.gfm-sync.lock'), false)

  const summary = await generateGFMFixtures(rootDir, { examples, groups })

  assert.deepEqual(summary, { currentExamples: 4, matched: 2, new: 2 })
  assert.deepEqual(listFixtureIds(mainDir), ['#003', '#004'])
  assert.deepEqual(listFixtureIds(newDir), ['#001', '#002'])
  assert.deepEqual(JSON.parse(readFileSync(join(mainDir, '#003.json'), 'utf8')).cases[0], {
    description: 'current 3',
    input: 'duplicate',
    answer: { gfm: { html: '<p>current 3</p>', markup: 'one', ast: { id: 'one' } } },
  })
  assert.deepEqual(JSON.parse(readFileSync(join(mainDir, '#004.json'), 'utf8')).cases[0], {
    description: 'current 4',
    input: 'duplicate',
    answer: { gfm: { html: '<p>current 4</p>', markup: 'two', ast: { id: 'two' } } },
  })
  assert.deepEqual(JSON.parse(readFileSync(join(mainDir, 'meta.json'), 'utf8')), {
    groups: { unclassified: {}, ast: { duplicate: ['#003', '#004'] } },
  })
  assert.equal(
    readdirSync(fixturesRoot).some(filename => filename.includes('.gfm-')),
    false,
  )

  const lockPath = join(fixturesRoot, '.gfm-sync.lock')
  const activePlan = createGFMFixturePlan(rootDir, { examples, groups })
  writeFileSync(lockPath, `${process.pid}\n`)
  await assert.rejects(
    writeGFMFixturePlan(rootDir, activePlan),
    new RegExp(`process ${process.pid} owns`),
  )
  rmSync(lockPath)

  const unresolvedArtifact = join(fixturesRoot, 'gfm.gfm-backup-test')
  const unresolvedPlan = createGFMFixturePlan(rootDir, { examples, groups })
  writeFileSync(lockPath, '2147483647\n')
  mkdirSync(unresolvedArtifact)
  await assert.rejects(
    writeGFMFixturePlan(rootDir, unresolvedPlan),
    /unresolved transaction artifacts/,
  )
  assert.equal(readFileSync(lockPath, 'utf8'), '2147483647\n')
  rmSync(unresolvedArtifact, { recursive: true })

  const recoveredPlan = createGFMFixturePlan(rootDir, { examples, groups })
  await writeGFMFixturePlan(rootDir, recoveredPlan)
  assert.equal(readdirSync(fixturesRoot).includes('.gfm-sync.lock'), false)
})

test('aborts when an answered fixture no longer matches upstream', t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-orphan-'))
  const mainDir = join(rootDir, 'fixtures', 'gfm')
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))
  mkdirSync(mainDir, { recursive: true })

  writeJson(join(mainDir, '#001.json'), createFixture(1, 'stale input', { id: 'one' }, 'one'))
  writeJson(join(mainDir, 'meta.json'), {
    groups: { unclassified: {}, ast: { legacy: ['#001'] } },
  })

  const examples = [null, createExample(1, 'fresh input')]
  const groups = [{ name: 'legacy', start: 1, end: 1, excluded: [] }]

  assert.throws(
    () => createGFMFixturePlan(rootDir, { examples, groups }),
    /Orphaned answered GFM fixtures no longer match upstream: #001/,
  )
})

test('preserves parser overrides and expanded AST layout when updating HTML', async t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-answers-'))
  const mainDir = join(rootDir, 'fixtures', 'gfm')
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))
  mkdirSync(mainDir, { recursive: true })

  const fixture = createFixture(
    1,
    'content',
    {
      type: 'root',
      position: { start: { line: 1, column: 1, offset: 0 } },
      children: [],
    },
    'content',
  )
  fixture.cases[0].answer['gfm-ex'] = { html: '', ast: { type: 'extended' } }
  fixture.cases[0].answer.yozora = { markup: 'custom' }
  writeJson(join(mainDir, '#001.json'), fixture)
  writeJson(join(mainDir, 'meta.json'), {
    groups: { unclassified: {}, ast: { content: ['#001'] } },
  })

  const examples = [null, createExample(1, 'content')]
  const groups = [{ name: 'content', start: 1, end: 1, excluded: [] }]
  await generateGFMFixtures(rootDir, { examples, groups })

  const raw = readFileSync(join(mainDir, '#001.json'), 'utf8')
  assert.deepEqual(JSON.parse(raw).cases[0].answer, {
    ...fixture.cases[0].answer,
    gfm: { ...fixture.cases[0].answer.gfm, html: examples[1].expectedHtml },
  })
  assert.match(raw, /"start": \{\n\s+"line": 1,/u)
})

test('preserves source-only HTML overrides and formatting when input is unchanged', async t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-source-html-'))
  const mainDir = join(rootDir, 'fixtures', 'gfm')
  const newDir = join(rootDir, 'fixtures', 'gfm-new')
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))
  mkdirSync(mainDir, { recursive: true })
  mkdirSync(newDir)
  writeJson(join(mainDir, '#001.json'), createFixture(1, 'known', { type: 'root' }))
  writeJson(join(mainDir, 'meta.json'), {
    groups: { unclassified: {}, ast: { known: ['#001'] } },
  })

  const examples = [null, createExample(1, 'known'), createExample(2, 'new')]
  const groups = [{ name: 'known', start: 1, end: 1, excluded: [] }]
  const filepath = join(newDir, '#002.json')
  writeJson(filepath, {
    title: examples[2].title,
    cases: [
      {
        description: examples[2].description,
        input: examples[2].content,
        answer: {
          gfm: { html: examples[2].expectedHtml },
          'gfm-ex': { html: '<p>extended</p>' },
          yozora: { html: '' },
        },
      },
    ],
  })
  const before = readFileSync(filepath, 'utf8')

  await generateGFMFixtures(rootDir, { examples, groups })

  assert.equal(readFileSync(filepath, 'utf8'), before)
})

test('preserves source-only HTML overrides by exact input after renumbering duplicates', async t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-source-duplicates-'))
  const mainDir = join(rootDir, 'fixtures', 'gfm')
  const newDir = join(rootDir, 'fixtures', 'gfm-new')
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))
  mkdirSync(mainDir, { recursive: true })
  mkdirSync(newDir)
  writeJson(join(mainDir, '#001.json'), createFixture(1, 'known', { type: 'root' }))
  writeJson(join(mainDir, 'meta.json'), {
    groups: { unclassified: {}, ast: { known: ['#001'] } },
  })

  for (const [exampleNo, html] of [
    [2, ''],
    [3, '<p>extended</p>'],
  ]) {
    const example = createExample(exampleNo, 'duplicate')
    writeJson(join(newDir, `#00${exampleNo}.json`), {
      title: example.title,
      cases: [
        {
          input: example.content,
          answer: { gfm: { html: example.expectedHtml }, 'gfm-ex': { html } },
        },
      ],
    })
  }

  const examples = [
    null,
    createExample(1, 'known'),
    createExample(2, 'fresh input'),
    createExample(3, 'duplicate'),
    createExample(4, 'duplicate'),
  ]
  const groups = [{ name: 'known', start: 1, end: 1, excluded: [] }]
  await generateGFMFixtures(rootDir, { examples, groups })

  const answers = Object.fromEntries(
    listFixtureIds(newDir).map(id => [
      id,
      JSON.parse(readFileSync(join(newDir, `${id}.json`), 'utf8')).cases[0].answer,
    ]),
  )
  assert.deepEqual(answers, {
    '#002': { gfm: { html: examples[2].expectedHtml } },
    '#003': { gfm: { html: examples[3].expectedHtml }, 'gfm-ex': { html: '<p>extended</p>' } },
    '#004': { gfm: { html: examples[4].expectedHtml }, 'gfm-ex': { html: '' } },
  })
})

for (const parserName of ['gfm-ex', 'yozora']) {
  test(`aborts when a source-only ${parserName} HTML override no longer matches upstream`, async t => {
    const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-source-orphan-'))
    const mainDir = join(rootDir, 'fixtures', 'gfm')
    const newDir = join(rootDir, 'fixtures', 'gfm-new')
    t.after(() => rmSync(rootDir, { recursive: true, force: true }))
    mkdirSync(mainDir, { recursive: true })
    mkdirSync(newDir)
    writeJson(join(mainDir, '#001.json'), createFixture(1, 'known', { type: 'root' }))
    writeJson(join(mainDir, 'meta.json'), {
      groups: { unclassified: {}, ast: { known: ['#001'] } },
    })
    writeJson(join(newDir, '#002.json'), {
      title: createExample(2, 'stale input').title,
      cases: [
        {
          input: 'stale input',
          answer: { gfm: { html: '<p>stale</p>' }, [parserName]: { html: '' } },
        },
      ],
    })
    const before = snapshotDirectory(newDir)

    await assert.rejects(
      generateGFMFixtures(rootDir, {
        examples: [null, createExample(1, 'known'), createExample(2, 'fresh input')],
        groups: [{ name: 'known', start: 1, end: 1, excluded: [] }],
      }),
      /Orphaned answered GFM fixtures no longer match upstream: #002/u,
    )
    assert.deepEqual(snapshotDirectory(newDir), before)
  })
}

for (const parserName of ['gfm', 'gfm-ex', 'yozora']) {
  for (const field of ['ast', 'markup']) {
    test(`rejects a source-only fixture with answer.${parserName}.${field}`, t => {
      const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-source-only-'))
      const mainDir = join(rootDir, 'fixtures', 'gfm')
      const newDir = join(rootDir, 'fixtures', 'gfm-new')
      t.after(() => rmSync(rootDir, { recursive: true, force: true }))
      mkdirSync(mainDir, { recursive: true })
      mkdirSync(newDir)
      writeJson(join(mainDir, '#001.json'), createFixture(1, 'known', { type: 'root' }, 'known'))
      writeJson(join(mainDir, 'meta.json'), {
        groups: { unclassified: {}, ast: { known: ['#001'] } },
      })
      const answer = { gfm: { html: '<p>new</p>' } }
      answer[parserName] = { ...answer[parserName], [field]: field === 'ast' ? {} : '' }
      writeJson(join(newDir, '#002.json'), {
        title: 'GFM#2 https://github.github.com/gfm/#example-2',
        cases: [{ input: 'new', answer }],
      })

      assert.throws(
        () =>
          createGFMFixturePlan(rootDir, {
            examples: [null, createExample(1, 'known'), createExample(2, 'new')],
            groups: [{ name: 'known', start: 1, end: 1, excluded: [] }],
          }),
        /Answered fixture must not remain in gfm-new/u,
      )
    })
  }
}

test('validates the checked-in partition and pinned source metadata', () => {
  const examples = JSON.parse(readFileSync(new URL('./examples.json', import.meta.url), 'utf8'))
  const source = JSON.parse(readFileSync(new URL('./source.json', import.meta.url), 'utf8'))
  const currentIds = listFixtureIds(new URL('gfm/', new URL('../../../fixtures/', import.meta.url)))
  const newDirectory = new URL('gfm-new/', new URL('../../../fixtures/', import.meta.url))
  const newIds = fs.existsSync(newDirectory) ? listFixtureIds(newDirectory) : []

  assert.equal(source.url, 'https://github.github.com/gfm/')
  assert.equal(source.exampleCount, examples.length - 1)
  assert.match(source.sha256, /^[\da-f]{64}$/)
  assert.equal(currentIds.length, 677)
  assert.deepEqual(newIds, [])

  for (const [directory, fixtureIds] of [
    ['gfm', currentIds],
    ['gfm-new', newIds],
  ]) {
    for (const fixtureId of fixtureIds) {
      const exampleNo = Number(fixtureId.slice(1))
      const example = examples[exampleNo]
      const fixture = JSON.parse(
        readFileSync(
          new URL(
            `${directory}/${encodeURIComponent(fixtureId)}.json`,
            new URL('../../../fixtures/', import.meta.url),
          ),
          'utf8',
        ),
      )
      const fixtureCase = fixture.cases[0]
      assert.equal(fixture.title, example.title)
      assert.equal(fixtureCase.description, example.description)
      assert.equal(fixtureCase.input, example.content)
      assert.equal(fixtureCase.answer.gfm.html, example.expectedHtml)
    }
  }

  const meta = JSON.parse(readFileSync(new URL('../../../fixtures/gfm/meta.json', import.meta.url)))
  const metadataIds = flattenGroupIds(meta.groups)
  assert.equal(new Set(metadataIds).size, metadataIds.length)
  assert.deepEqual(metadataIds.slice().sort(), currentIds)

  const coveredIds = [...currentIds, ...newIds]
    .map(fixtureId => Number(fixtureId.slice(1)))
    .sort((left, right) => left - right)
  assert.deepEqual(
    coveredIds,
    Array.from({ length: 677 }, (_, index) => index + 1),
  )
})
