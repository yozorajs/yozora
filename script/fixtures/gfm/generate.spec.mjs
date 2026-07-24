import assert from 'node:assert/strict'
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { generateGFMFixtures } from './generate.mjs'

const snapshot = JSON.parse(readFileSync(new URL('./examples.json', import.meta.url), 'utf8'))
const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf8'))
const excludedFixtureIds = ['#491', '#493', '#633', '#634', '#635', '#657']

const flattenGroupIds = group =>
  Object.values(group).flatMap(value => (Array.isArray(value) ? value : flattenGroupIds(value)))

function copyCheckedInFixtures(rootDir) {
  const fixtureDir = join(rootDir, 'fixtures/gfm')
  mkdirSync(join(rootDir, 'fixtures'), { recursive: true })
  cpSync(new URL('../../../fixtures/gfm/', import.meta.url), fixtureDir, { recursive: true })
  return fixtureDir
}

function generateQuietly(rootDir) {
  const originalLog = console.log
  try {
    console.log = () => {}
    generateGFMFixtures(rootDir)
  } finally {
    console.log = originalLog
  }
}

test('generates flat fixtures and complete group metadata', t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-fixtures-'))
  const fixtureDir = copyCheckedInFixtures(rootDir)
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))

  generateQuietly(rootDir)

  const entries = readdirSync(fixtureDir, { withFileTypes: true })
  assert.equal(
    entries.some(entry => entry.isDirectory()),
    false,
  )

  const meta = JSON.parse(readFileSync(join(fixtureDir, 'meta.json'), 'utf8'))
  assert.equal(config.fixtureGroupsRevision, snapshot.source.revision)
  assert.deepEqual(meta.source, snapshot.source)
  assert.deepEqual(Object.keys(meta.groups).sort(), ['ast', 'unclassified'])
  assert.deepEqual(meta.groups.ast.autolink.slice(0, 3), ['#603', '#604', '#605'])
  assert.deepEqual(meta.groups.unclassified.tabs.slice(0, 3), ['#001', '#002', '#003'])
  assert.equal(Object.hasOwn(meta.groups.unclassified, 'tagfilter'), false)
  assert.deepEqual(meta.groups.ast.break['hard line breaks'].slice(0, 3), ['#658', '#659', '#660'])

  const metadataIds = flattenGroupIds(meta.groups)
  const fixtureIds = entries
    .filter(entry => /^#\d{3}[.]json$/.test(entry.name))
    .map(entry => entry.name.slice(0, -5))
    .sort()
  assert.equal(fixtureIds.length, snapshot.examples.length - excludedFixtureIds.length)
  for (const fixtureId of excludedFixtureIds) assert.equal(fixtureIds.includes(fixtureId), false)
  assert.equal(new Set(metadataIds).size, metadataIds.length)
  assert.deepEqual(metadataIds.slice().sort(), fixtureIds)

  const readCase = fixtureId =>
    JSON.parse(readFileSync(join(fixtureDir, `${fixtureId}.json`), 'utf8')).cases[0]
  assert.equal(readCase('#083').input, 'Foo\n    bar')
  assert.equal(readCase('#087').input, '\n    \n    foo\n    ')
  assert.equal(readCase('#544').input, '[foo *bar][ref]*\n\n[ref]: /uri')
  assert.equal(readCase('#549').input, '[ẞ]\n\n[SS]: /url')

  const checkedInMeta = JSON.parse(
    readFileSync(new URL('../../../fixtures/gfm/meta.json', import.meta.url), 'utf8'),
  )
  assert.deepEqual(meta, checkedInMeta)
})

test('keeps checked-in inputs and HTML answers aligned with the GFM snapshot', () => {
  const meta = JSON.parse(
    readFileSync(new URL('../../../fixtures/gfm/meta.json', import.meta.url), 'utf8'),
  )
  for (const fixtureId of flattenGroupIds(meta.groups)) {
    const example = snapshot.examples[Number(fixtureId.slice(1)) - 1]
    const testcase = JSON.parse(
      readFileSync(
        new URL(`../../../fixtures/gfm/${encodeURIComponent(fixtureId)}.json`, import.meta.url),
        'utf8',
      ),
    ).cases[0]

    assert.equal(testcase.input, example.markdown, `${fixtureId} input`)
    assert.equal(testcase.htmlAnswer, example.html, `${fixtureId} HTML`)
  }
})

test('migrates previous answers by input without collapsing duplicate cases', t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-migration-'))
  const fixtureDir = copyCheckedInFixtures(rootDir)
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))

  for (const [fixtureId, description] of [
    ['#176', 'first duplicate'],
    ['#188', 'second duplicate'],
    ['#658', 'renumbered fixture'],
  ]) {
    const filepath = join(fixtureDir, `${fixtureId}.json`)
    const fixture = JSON.parse(readFileSync(filepath, 'utf8'))
    fixture.cases[0].description = description
    writeFileSync(filepath, `${JSON.stringify(fixture, null, 2)}\n`)
  }
  renameSync(join(fixtureDir, '#658.json'), join(fixtureDir, '#999.json'))

  generateQuietly(rootDir)

  const readCase = fixtureId =>
    JSON.parse(readFileSync(join(fixtureDir, `${fixtureId}.json`), 'utf8')).cases[0]
  assert.equal(readCase('#176').description, 'first duplicate')
  assert.equal(readCase('#188').description, 'second duplicate')
  assert.equal(readCase('#658').description, 'renumbered fixture')
  assert.equal(readdirSync(fixtureDir).includes('#999.json'), false)
})

test('rejects a missing previous input before writing any fixture', t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-missing-input-'))
  const fixtureDir = copyCheckedInFixtures(rootDir)
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))
  const firstFixturePath = join(fixtureDir, '#001.json')
  const firstFixture = JSON.parse(readFileSync(firstFixturePath, 'utf8'))
  firstFixture.title = 'must remain unchanged'
  writeFileSync(firstFixturePath, `${JSON.stringify(firstFixture, null, 2)}\n`)
  rmSync(join(fixtureDir, '#492.json'))

  assert.throws(() => generateQuietly(rootDir), /GFM fixture #492 has no matching previous input/)
  assert.equal(JSON.parse(readFileSync(firstFixturePath, 'utf8')).title, 'must remain unchanged')
})
