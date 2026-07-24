import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { generateGFMFixtures } from './generate.mjs'

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
  assert.deepEqual(Object.keys(meta.groups).sort(), ['ast', 'unclassified'])
  assert.deepEqual(meta.groups.ast.autolink.slice(0, 3), ['#602', '#603', '#604'])
  assert.deepEqual(meta.groups.unclassified.tabs.slice(0, 3), ['#001', '#002', '#003'])

  const metadataIds = flattenGroupIds(meta.groups)
  const fixtureIds = entries
    .filter(entry => /^#\d{3}[.]json$/.test(entry.name))
    .map(entry => entry.name.slice(0, -5))
    .sort()
  assert.equal(new Set(metadataIds).size, metadataIds.length)
  assert.deepEqual(metadataIds.slice().sort(), fixtureIds)

  const checkedInMeta = JSON.parse(
    readFileSync(new URL('../../../fixtures/gfm/meta.json', import.meta.url), 'utf8'),
  )
  assert.deepEqual(meta, checkedInMeta)
})
