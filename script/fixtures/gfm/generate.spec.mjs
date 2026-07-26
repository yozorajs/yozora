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

const createFixture = (exampleNo, input, parseAnswer, markupAnswer) => ({
  title: `GFM#${exampleNo} https://github.github.com/gfm/#example-${exampleNo}`,
  cases: [
    {
      description: `legacy ${exampleNo}`,
      input,
      ...(markupAnswer === undefined ? {} : { markupAnswer }),
      htmlAnswer: `<p>${input}</p>`,
      parseAnswer,
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

  for (const directoryName of ['gfm', 'gfm-new', 'gfm-old']) {
    cpSync(join(checkedInFixturesRoot, directoryName), join(fixturesRoot, directoryName), {
      recursive: true,
    })
  }
  const before = Object.fromEntries(
    ['gfm', 'gfm-new', 'gfm-old'].map(directoryName => [
      directoryName,
      snapshotDirectory(join(fixturesRoot, directoryName)),
    ]),
  )

  const summary = await generateGFMFixtures(rootDir)
  const after = Object.fromEntries(
    ['gfm', 'gfm-new', 'gfm-old'].map(directoryName => [
      directoryName,
      snapshotDirectory(join(fixturesRoot, directoryName)),
    ]),
  )

  assert.deepEqual(summary, { currentExamples: 677, matched: 672, new: 5, old: 1 })
  assert.deepEqual(after, before)

  const mainCases = Object.entries(after.gfm)
    .filter(([filename]) => /^#\d{3}[.]json$/.test(filename))
    .map(([, raw]) => JSON.parse(raw).cases[0])
  assert.equal(mainCases.filter(fixtureCase => 'parseAnswer' in fixtureCase).length, 672)
  assert.equal(mainCases.filter(fixtureCase => 'markupAnswer' in fixtureCase).length, 654)
})

test('partitions renumbered duplicate inputs and preserves archived bytes', async t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-partition-'))
  const fixturesRoot = join(rootDir, 'fixtures')
  const mainDir = join(fixturesRoot, 'gfm')
  const newDir = join(fixturesRoot, 'gfm-new')
  const oldDir = join(fixturesRoot, 'gfm-old')
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))
  for (const directory of [mainDir, newDir, oldDir]) mkdirSync(directory, { recursive: true })

  writeJson(join(mainDir, '#001.json'), createFixture(1, 'duplicate', { id: 'one' }, 'one'))
  writeJson(join(mainDir, '#002.json'), createFixture(2, 'duplicate', { id: 'two' }, 'two'))
  writeJson(join(mainDir, 'meta.json'), {
    groups: { unclassified: {}, ast: { legacy: ['#001', '#002'] } },
  })
  writeJson(join(newDir, '#009.json'), {
    title: 'GFM#9 https://github.github.com/gfm/#example-9',
    cases: [{ input: 'stale', htmlAnswer: '<p>stale</p>' }],
  })
  const archivedRaw = JSON.stringify(createFixture(5, 'old only', { id: 'old' }, 'old'), null, 2)
  writeFileSync(join(oldDir, '#005.json'), archivedRaw)

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
    ['gfm', 'gfm-new', 'gfm-old'].map(directoryName => [
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
      ['gfm', 'gfm-new', 'gfm-old'].map(directoryName => [
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

  assert.deepEqual(summary, { currentExamples: 4, matched: 2, new: 2, old: 1 })
  assert.deepEqual(listFixtureIds(mainDir), ['#003', '#004'])
  assert.deepEqual(listFixtureIds(newDir), ['#001', '#002'])
  assert.deepEqual(listFixtureIds(oldDir), ['#005'])
  assert.deepEqual(JSON.parse(readFileSync(join(mainDir, '#003.json'), 'utf8')).cases[0], {
    description: 'current 3',
    input: 'duplicate',
    markupAnswer: 'one',
    htmlAnswer: '<p>current 3</p>',
    parseAnswer: { id: 'one' },
  })
  assert.deepEqual(JSON.parse(readFileSync(join(mainDir, '#004.json'), 'utf8')).cases[0], {
    description: 'current 4',
    input: 'duplicate',
    markupAnswer: 'two',
    htmlAnswer: '<p>current 4</p>',
    parseAnswer: { id: 'two' },
  })
  assert.equal(readFileSync(join(oldDir, '#005.json'), 'utf8'), archivedRaw)
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

test('validates the checked-in partition and pinned source metadata', () => {
  const examples = JSON.parse(readFileSync(new URL('./examples.json', import.meta.url), 'utf8'))
  const source = JSON.parse(readFileSync(new URL('./source.json', import.meta.url), 'utf8'))
  const currentIds = listFixtureIds(new URL('gfm/', new URL('../../../fixtures/', import.meta.url)))
  const newIds = listFixtureIds(new URL('gfm-new/', new URL('../../../fixtures/', import.meta.url)))
  const oldIds = listFixtureIds(new URL('gfm-old/', new URL('../../../fixtures/', import.meta.url)))

  assert.equal(source.url, 'https://github.github.com/gfm/')
  assert.equal(source.exampleCount, examples.length - 1)
  assert.match(source.sha256, /^[\da-f]{64}$/)
  assert.equal(currentIds.length, 672)
  assert.deepEqual(newIds, ['#493', '#633', '#634', '#635', '#657'])
  assert.deepEqual(oldIds, ['#491'])

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
      assert.equal(fixtureCase.htmlAnswer, example.expectedHtml)
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

  const oldFixture = JSON.parse(
    readFileSync(new URL('../../../fixtures/gfm-old/%23491.json', import.meta.url), 'utf8'),
  )
  const latestInputs = new Set(examples.slice(1).map(example => example.content))
  assert.equal(latestInputs.has(oldFixture.cases[0].input), false)
})
