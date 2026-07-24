import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const GFM_REPOSITORY = 'github/cmark-gfm'
const LATEST_RELEASE_URL = `https://api.github.com/repos/${GFM_REPOSITORY}/releases/latest`
const EXAMPLE_FENCE = '`'.repeat(32)
const EXAMPLE_MARKER = `${EXAMPLE_FENCE} example`
const REQUEST_TIMEOUT_MS = 30_000

function normalizeExampleText(value) {
  return value.replace(/→/g, '\t').replace(/\n$/, '')
}

export function parseGfmSpec(source) {
  const examples = []
  let section = ''
  let state = 'prose'
  let extensions = []
  let markdown = ''
  let html = ''
  let startLine = 0

  const lines = source.split('\n')
  for (let index = 0; index < lines.length; ++index) {
    const lineNumber = index + 1
    const line = lines[index].replace(/\r$/, '')
    const marker = line.trim()

    if (state === 'prose') {
      const heading = /^#{1,6}\s+(.+)$/.exec(line)
      if (heading != null) section = heading[1].trim()

      const extensionSource =
        marker === EXAMPLE_MARKER
          ? ''
          : marker.startsWith(`${EXAMPLE_MARKER} `)
            ? marker.slice(EXAMPLE_MARKER.length + 1)
            : null
      if (extensionSource == null) continue
      if (section.length === 0) throw new Error(`GFM example at line ${lineNumber} has no section`)

      extensions = extensionSource.trim().split(/\s+/).filter(Boolean)
      markdown = ''
      html = ''
      startLine = lineNumber
      state = 'markdown'
      continue
    }

    if (state === 'markdown') {
      if (marker === '.') {
        state = 'html'
      } else if (marker === EXAMPLE_FENCE) {
        throw new Error(`GFM example at line ${startLine} has no HTML separator`)
      } else {
        markdown += `${line}\n`
      }
      continue
    }

    if (marker !== EXAMPLE_FENCE) {
      html += `${line}\n`
      continue
    }

    examples.push({
      number: examples.length + 1,
      section,
      extensions,
      startLine,
      endLine: lineNumber,
      markdown: normalizeExampleText(markdown),
      html: normalizeExampleText(html),
    })
    state = 'prose'
  }

  if (state !== 'prose') throw new Error(`Unclosed GFM example at line ${startLine}`)
  if (examples.length === 0) throw new Error('GFM spec contains no examples')
  return examples
}

async function request(url, fetchImpl) {
  let response
  try {
    response = await fetchImpl(url, {
      headers: { accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new Error(`Failed to fetch ${url}`, { cause: error })
  }
  if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
  return response
}

export async function fetchLatestGfmExamples(fetchImpl = fetch) {
  const releaseResponse = await request(LATEST_RELEASE_URL, fetchImpl)
  const release = await releaseResponse.json()
  if (release == null || typeof release.tag_name !== 'string' || release.tag_name.length === 0) {
    throw new TypeError('Latest cmark-gfm release has no tag_name')
  }

  const revision = release.tag_name
  const specUrl = `https://raw.githubusercontent.com/${GFM_REPOSITORY}/${revision}/test/spec.txt`
  const specResponse = await request(specUrl, fetchImpl)
  const spec = await specResponse.text()

  return {
    source: {
      repository: `https://github.com/${GFM_REPOSITORY}`,
      revision,
      specUrl,
      sha256: createHash('sha256').update(spec).digest('hex'),
    },
    examples: parseGfmSpec(spec),
  }
}

export async function updateGfmExamples(
  outputUrl = new URL('./examples.json', import.meta.url),
  fetchImpl = fetch,
) {
  const snapshot = await fetchLatestGfmExamples(fetchImpl)
  fs.writeFileSync(outputUrl, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  return snapshot
}

if (process.argv[1] === __filename) {
  const snapshot = await updateGfmExamples()
  console.log(`Updated ${snapshot.examples.length} GFM examples from ${snapshot.source.revision}`)
}
