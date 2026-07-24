import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const GFM_SPEC_URL = 'https://github.github.com/gfm/'
const REQUEST_TIMEOUT_MS = 30_000
const VERSION_PATTERN = /<div class="version">\s*Version\s+([^<(]+?)\s*\(([^)<]+)\)\s*<\/div>/
const EXAMPLE_ID_PATTERN = /<div class="example" id="example-(\d+)">/g
const SPEC_TOKEN_PATTERN =
  /<h2\b[^>]*>([\s\S]*?)<\/h2>|<div class="example" id="example-(\d+)">[\s\S]*?<code class="language-markdown">([\s\S]*?)<\/code>[\s\S]*?<code class="language-html">([\s\S]*?)<\/code>[\s\S]*?<\/div>\s*<\/div>/g

function decodeHtmlEntities(value) {
  return value.replace(
    /&#x([0-9a-f]+);|&#([0-9]+);|&(amp|lt|gt|quot|apos);/gi,
    (reference, hexadecimal, decimal, named) => {
      if (hexadecimal != null) return String.fromCodePoint(Number.parseInt(hexadecimal, 16))
      if (decimal != null) return String.fromCodePoint(Number.parseInt(decimal, 10))
      return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[named.toLowerCase()] ?? reference
    },
  )
}

function extractText(value) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ''))
}

function normalizeExampleText(value) {
  return extractText(value).replace(/→/g, '\t').replace(/\n$/, '')
}

export function parseGfmSpecPage(source) {
  const versionMatch = VERSION_PATTERN.exec(source)
  if (versionMatch == null) throw new Error('GFM spec page has no valid version')

  const examples = []
  let section = ''
  for (const match of source.matchAll(SPEC_TOKEN_PATTERN)) {
    if (match[1] != null) {
      section = extractText(match[1])
        .replace(/^\d+(?:[.]\d+)*\s*/, '')
        .trim()
      continue
    }

    const number = Number(match[2])
    if (number !== examples.length + 1) {
      throw new Error(`Unexpected GFM example number ${number}; expected ${examples.length + 1}`)
    }
    if (section.length === 0) throw new Error(`GFM example ${number} has no section`)
    examples.push({
      number,
      section,
      markdown: normalizeExampleText(match[3]),
      html: normalizeExampleText(match[4]),
    })
  }
  if (examples.length === 0) throw new Error('GFM spec page contains no examples')
  const declaredExampleCount = Array.from(source.matchAll(EXAMPLE_ID_PATTERN)).length
  if (examples.length !== declaredExampleCount) {
    throw new Error(`Parsed ${examples.length} of ${declaredExampleCount} GFM examples`)
  }

  return {
    revision: versionMatch[1].trim(),
    publishedAt: versionMatch[2].trim(),
    examples,
  }
}

async function request(url, fetchImpl) {
  let response
  try {
    response = await fetchImpl(url, {
      headers: { accept: 'text/html' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new Error(`Failed to fetch ${url}`, { cause: error })
  }
  if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
  return response
}

export async function fetchGfmExamples(fetchImpl = fetch) {
  const response = await request(GFM_SPEC_URL, fetchImpl)
  const source = await response.text()
  const { revision, publishedAt, examples } = parseGfmSpecPage(source)

  return {
    source: {
      url: GFM_SPEC_URL,
      revision,
      publishedAt,
      sha256: createHash('sha256').update(source).digest('hex'),
    },
    examples,
  }
}

export async function updateGfmExamples(
  outputUrl = new URL('./examples.json', import.meta.url),
  fetchImpl = fetch,
) {
  const snapshot = await fetchGfmExamples(fetchImpl)
  fs.writeFileSync(outputUrl, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  return snapshot
}

if (process.argv[1] === __filename) {
  const snapshot = await updateGfmExamples()
  console.log(`Updated ${snapshot.examples.length} GFM examples from ${snapshot.source.revision}`)
}
