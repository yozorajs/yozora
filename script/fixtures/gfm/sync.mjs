import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { format, resolveConfig } from 'prettier'
import { repositoryRoot } from '../../internal/repository.mjs'
import { parseGFMDocument } from './extract.mjs'
import {
  createGFMFixturePlan,
  findGFMTransactionArtifacts,
  verifyGFMFixturePlan,
  writeGFMFixturePlan,
} from './generate.mjs'

const __filename = fileURLToPath(import.meta.url)
const sourceMetadataUrl = new URL('./source.json', import.meta.url)
const examplesUrl = new URL('./examples.json', import.meta.url)
const scriptDirectory = path.dirname(__filename)
const fetchTimeoutMs = 30_000
const maximumSourceBytes = 10 * 1024 * 1024

function readJson(url) {
  return JSON.parse(fs.readFileSync(url, 'utf8'))
}

function validateSha256(value, optionName) {
  if (typeof value !== 'string' || !/^[\da-f]{64}$/.test(value)) {
    throw new TypeError(`${optionName} must be a lowercase SHA-256 digest`)
  }
  return value
}

function validateSourceMetadata(metadata) {
  if (
    metadata == null ||
    typeof metadata !== 'object' ||
    typeof metadata.url !== 'string' ||
    typeof metadata.version !== 'string' ||
    !Number.isInteger(metadata.exampleCount) ||
    metadata.exampleCount < 1
  ) {
    throw new TypeError('Invalid GFM source metadata')
  }
  const url = new URL(metadata.url)
  if (url.protocol !== 'https:') throw new TypeError('GFM source URL must use HTTPS')
  validateSha256(metadata.sha256, 'source.json sha256')
  return metadata
}

function parseArguments(argv) {
  const result = { mode: null, url: null, expectedSha256: null }
  for (let index = 0; index < argv.length; ++index) {
    const argument = argv[index]
    if (argument === '--inspect' || argument === '--check' || argument === '--write') {
      const mode = argument.slice(2)
      if (result.mode != null) throw new Error('Choose only one sync mode')
      result.mode = mode
      continue
    }
    if (argument === '--url' || argument === '--expected-sha256') {
      const value = argv[++index]
      if (value == null) throw new Error(`Missing value for ${argument}`)
      if (argument === '--url') result.url = value
      else result.expectedSha256 = validateSha256(value, argument)
      continue
    }
    throw new Error(`Unknown GFM sync argument ${argument}`)
  }
  result.mode ||= 'check'
  if (result.mode === 'write' && result.expectedSha256 == null) {
    throw new Error('--write requires --expected-sha256')
  }
  if (result.mode !== 'write' && result.expectedSha256 != null) {
    throw new Error('--expected-sha256 is only valid with --write')
  }
  return result
}

async function fetchSource(sourceUrl) {
  const url = new URL(sourceUrl)
  if (url.protocol !== 'https:') throw new TypeError('GFM source URL must use HTTPS')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`GFM source request failed with HTTP ${response.status}`)
    const contentLength = Number(response.headers.get('content-length'))
    if (Number.isFinite(contentLength) && contentLength > maximumSourceBytes) {
      throw new Error(`GFM source exceeds ${maximumSourceBytes} bytes`)
    }
    const source = Buffer.from(await response.arrayBuffer())
    if (source.byteLength > maximumSourceBytes) {
      throw new Error(`GFM source exceeds ${maximumSourceBytes} bytes`)
    }
    return source
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`GFM source request timed out after ${fetchTimeoutMs}ms`, { cause: error })
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export function createSourceSnapshot(source, sourceUrl) {
  if (!Buffer.isBuffer(source)) throw new TypeError('GFM source must be a Buffer')
  const sha256 = createHash('sha256').update(source).digest('hex')
  const { version, examples } = parseGFMDocument(source.toString('utf8'), sourceUrl)
  return {
    metadata: {
      url: sourceUrl,
      version,
      sha256,
      exampleCount: examples.length - 1,
    },
    examples,
  }
}

async function formatJson(value, filepath) {
  const prettierConfig = (await resolveConfig(path.join(repositoryRoot, 'package.json'))) || {}
  return format(JSON.stringify(value), { ...prettierConfig, filepath })
}

function assertPinnedSnapshot(snapshot, metadata, checkedInExamples) {
  if (!isDeepStrictEqual(snapshot.metadata, metadata)) {
    throw new Error(
      `GFM source metadata changed: expected ${JSON.stringify(metadata)}, received ${JSON.stringify(snapshot.metadata)}`,
    )
  }
  if (!isDeepStrictEqual(snapshot.examples, checkedInExamples)) {
    throw new Error('GFM examples.json does not match the pinned source')
  }
}

export async function syncGFM(argv = process.argv.slice(2)) {
  const options = parseArguments(argv)
  if (options.mode !== 'inspect') {
    const artifacts = findGFMTransactionArtifacts(
      path.resolve(repositoryRoot, 'fixtures'),
      scriptDirectory,
    )
    if (artifacts.length > 0) {
      throw new Error(`Unresolved GFM transaction artifacts: ${artifacts.join(', ')}`)
    }
  }
  const checkedInMetadata = validateSourceMetadata(readJson(sourceMetadataUrl))
  const sourceUrl = options.url || checkedInMetadata.url
  const source = await fetchSource(sourceUrl)
  const snapshot = createSourceSnapshot(source, sourceUrl)

  if (options.mode === 'inspect') {
    console.log(JSON.stringify(snapshot.metadata, null, 2))
    return snapshot.metadata
  }

  if (options.mode === 'check') {
    assertPinnedSnapshot(snapshot, checkedInMetadata, readJson(examplesUrl))
    const plan = createGFMFixturePlan(repositoryRoot, { examples: snapshot.examples })
    verifyGFMFixturePlan(repositoryRoot, plan)
    console.log(`GFM fixtures are synchronized at ${snapshot.metadata.sha256}`)
    return plan.summary
  }

  if (snapshot.metadata.sha256 !== options.expectedSha256) {
    throw new Error(
      `GFM source SHA-256 mismatch: expected ${options.expectedSha256}, received ${snapshot.metadata.sha256}`,
    )
  }
  const plan = createGFMFixturePlan(repositoryRoot, { examples: snapshot.examples })
  await writeGFMFixturePlan(repositoryRoot, plan, {
    extraFiles: [
      {
        target: fileURLToPath(examplesUrl),
        content: await formatJson(snapshot.examples, fileURLToPath(examplesUrl)),
      },
      {
        target: fileURLToPath(sourceMetadataUrl),
        content: await formatJson(snapshot.metadata, fileURLToPath(sourceMetadataUrl)),
      },
    ],
  })
  console.log(
    `Synchronized ${plan.summary.currentExamples} GFM examples: ${plan.summary.matched} matched, ${plan.summary.new} new, ${plan.summary.old} old`,
  )
  return plan.summary
}

if (process.argv[1] === __filename) await syncGFM()
