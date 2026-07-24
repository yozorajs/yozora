import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { generateGFMFixtures } from './generate.mjs'

const snapshot = JSON.parse(readFileSync(new URL('./examples.json', import.meta.url), 'utf8'))
const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf8'))

const flattenGroupIds = group =>
  Object.values(group).flatMap(value => (Array.isArray(value) ? value : flattenGroupIds(value)))

test('generates flat fixtures and complete group metadata', t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-fixtures-'))
  const originalLog = console.log
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))

  try {
    console.log = () => {}
    generateGFMFixtures(rootDir)
  } finally {
    console.log = originalLog
  }

  const fixtureDir = join(rootDir, 'fixtures/gfm')
  const entries = readdirSync(fixtureDir, { withFileTypes: true })
  assert.equal(
    entries.some(entry => entry.isDirectory()),
    false,
  )

  const meta = JSON.parse(readFileSync(join(fixtureDir, 'meta.json'), 'utf8'))
  assert.equal(config.fixtureGroupsRevision, snapshot.source.revision)
  assert.deepEqual(meta.source, snapshot.source)
  assert.deepEqual(Object.keys(meta.groups).sort(), ['ast', 'unclassified'])
  assert.deepEqual(meta.groups.ast.autolink.slice(0, 3), ['#602', '#603', '#604'])
  assert.deepEqual(meta.groups.unclassified.tabs.slice(0, 3), ['#001', '#002', '#003'])
  assert.equal(Object.hasOwn(meta.groups.unclassified, 'tagfilter'), false)
  assert.deepEqual(meta.groups.ast.break['hard line breaks'].slice(0, 3), ['#653', '#654', '#655'])

  const metadataIds = flattenGroupIds(meta.groups)
  const fixtureIds = entries
    .filter(entry => /^#\d{3}[.]json$/.test(entry.name))
    .map(entry => entry.name.slice(0, -5))
    .sort()
  assert.equal(fixtureIds.length, snapshot.examples.length - 2)
  assert.equal(fixtureIds.includes('#548'), false)
  assert.equal(fixtureIds.includes('#652'), false)
  assert.equal(new Set(metadataIds).size, metadataIds.length)
  assert.deepEqual(metadataIds.slice().sort(), fixtureIds)

  const readCase = fixtureId =>
    JSON.parse(readFileSync(join(fixtureDir, `${fixtureId}.json`), 'utf8')).cases[0]
  assert.equal(readCase('#083').input, 'Foo\n    bar')
  assert.equal(readCase('#083').description, config.fixtureOverrides['#083'].description)
  assert.equal(readCase('#087').input, '\n    \n    foo\n    ')
  assert.equal(readCase('#087').description, config.fixtureOverrides['#087'].description)
  assert.equal(readCase('#543').input, '[foo *bar][ref]*\n\n[ref]: /uri')
  assert.equal(readCase('#543').description, config.fixtureOverrides['#543'].description)
  assert.equal(readCase('#543').htmlAnswer, '<p><a href="/uri">foo *bar</a>*</p>')

  const checkedInMeta = JSON.parse(
    readFileSync(new URL('../../../fixtures/gfm/meta.json', import.meta.url), 'utf8'),
  )
  assert.deepEqual(meta, checkedInMeta)
})

test('migrates previous answers by content without collapsing duplicate cases', t => {
  const rootDir = mkdtempSync(join(tmpdir(), 'yozora-gfm-migration-'))
  const fixtureDir = join(rootDir, 'fixtures/gfm')
  const originalLog = console.log
  t.after(() => rmSync(rootDir, { recursive: true, force: true }))
  mkdirSync(fixtureDir, { recursive: true })

  const previousFixtures = [
    ['#176', snapshot.examples[175], 'first duplicate'],
    ['#188', snapshot.examples[187], 'second duplicate'],
    ['#654', snapshot.examples[652], 'renumbered fixture'],
    ['#652', snapshot.examples[651], 'excluded fixture'],
  ]
  for (const [fixtureId, example, description] of previousFixtures) {
    writeFileSync(
      join(fixtureDir, `${fixtureId}.json`),
      `${JSON.stringify({
        title: fixtureId,
        cases: [
          {
            description,
            input: example.markdown,
            markupAnswer: description,
            htmlAnswer: example.html,
            parseAnswer: { description },
          },
        ],
      })}\n`,
    )
  }

  try {
    console.log = () => {}
    generateGFMFixtures(rootDir)
  } finally {
    console.log = originalLog
  }

  const readCase = fixtureId =>
    JSON.parse(readFileSync(join(fixtureDir, `${fixtureId}.json`), 'utf8')).cases[0]
  assert.equal(readCase('#176').description, 'first duplicate')
  assert.equal(readCase('#188').description, 'second duplicate')
  assert.equal(readCase('#653').description, 'renumbered fixture')
  assert.equal(readdirSync(fixtureDir).includes('#652.json'), false)
})
