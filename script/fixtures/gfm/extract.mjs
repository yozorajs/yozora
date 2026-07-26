/* eslint-disable no-undef */

const DEFAULT_GFM_SOURCE_URL = 'https://github.github.com/gfm/'

function decodeHtmlEntities(value) {
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|(amp|gt|lt|quot));/gi,
    (entity, decimal, hex, name) => {
      if (decimal != null) return String.fromCodePoint(Number(decimal))
      if (hex != null) return String.fromCodePoint(Number.parseInt(hex, 16))

      switch (name.toLowerCase()) {
        case 'amp':
          return '&'
        case 'gt':
          return '>'
        case 'lt':
          return '<'
        case 'quot':
          return '"'
        default:
          return entity
      }
    },
  )
}

function decodeCode(source, exampleNo) {
  const content = source.replace(/<span class="space"> <\/span>/g, ' ')
  const unexpectedTag = /<[^>]+>/.exec(content)
  if (unexpectedTag != null) {
    throw new Error(`Unexpected HTML tag in GFM example ${exampleNo}: ${unexpectedTag[0]}`)
  }
  return decodeHtmlEntities(content).replace(/\n$/, '').replace(/→/g, '\t')
}

function decodeDescription(source) {
  return decodeHtmlEntities(source.replace(/<[^>]+>/g, ''))
    .replace(/[\t\n\f\r ]+/g, ' ')
    .trim()
    .replace(/:$/, '')
}

function findExampleEnd(html, start, exampleNo) {
  const tagPattern = /<\/?div\b[^>]*>/g
  tagPattern.lastIndex = start
  let depth = 0

  for (let tag = tagPattern.exec(html); tag != null; tag = tagPattern.exec(html)) {
    depth += tag[0].startsWith('</') ? -1 : 1
    if (depth === 0) return tagPattern.lastIndex
  }
  throw new Error(`Unclosed GFM example ${exampleNo}`)
}

function findDescription(preceding, inheritedDescription) {
  const content = preceding.trim()
  if (content.length === 0) return inheritedDescription

  const paragraphs = [...content.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)]
  const paragraph = paragraphs.at(-1)
  if (paragraph == null || paragraph.index + paragraph[0].length !== content.length)
    return undefined
  return decodeDescription(paragraph[1])
}

/**
 * Parse the complete GFM HTML document without browser dependencies.
 *
 * @param {string} html
 * @param {string} sourceUrl
 */
export function parseGFMDocument(html, sourceUrl = DEFAULT_GFM_SOURCE_URL) {
  if (typeof html !== 'string') throw new TypeError('GFM document must be a string')
  const url = new URL(sourceUrl)
  const versionMatch = /<div class="version">([\s\S]*?)<\/div>/.exec(html)
  if (versionMatch == null) throw new Error('Missing GFM version')

  const starts = [...html.matchAll(/<div class="example" id="example-(\d+)">/g)]
  const examples = [null]
  let previousEnd = 0
  let inheritedDescription

  for (const start of starts) {
    const exampleNo = Number(start[1])
    if (exampleNo !== examples.length) {
      throw new Error(`Non-contiguous GFM example ${exampleNo}; expected ${examples.length}`)
    }

    const end = findExampleEnd(html, start.index, exampleNo)
    const description = findDescription(html.slice(previousEnd, start.index), inheritedDescription)
    const body = html.slice(start.index + start[0].length, end)
    const columns = [
      ...body.matchAll(/<pre><code class="language-(markdown|html)">([\s\S]*?)<\/code><\/pre>/g),
    ]
    if (columns.length !== 2 || columns[0][1] !== 'markdown' || columns[1][1] !== 'html') {
      throw new Error(`Invalid columns in GFM example ${exampleNo}`)
    }

    const exampleId = `example-${exampleNo}`
    examples.push({
      title: `GFM#${exampleNo} ${url.origin}${url.pathname}#${exampleId}`,
      ...(description === undefined ? {} : { description }),
      content: decodeCode(columns[0][2], exampleNo),
      expectedHtml: decodeCode(columns[1][2], exampleNo),
    })
    inheritedDescription = description
    previousEnd = end
  }

  if (examples.length === 1) throw new Error('Missing GFM examples')
  return {
    version: decodeDescription(versionMatch[1]),
    examples,
  }
}

/**
 * 将 GFM 中的 example 元素解析成 JSON 数据
 * @param exampleEl example 元素
 */
export function parseGFMExample(exampleEl) {
  if (exampleEl == null) return null

  const exampleId = exampleEl.id || ''
  const match = /^example-(\d+)$/.exec(exampleId)
  if (match == null) {
    console.error(`Bad exampleEl: id(${exampleEl.id}). skipped`)
    return null
  }
  const exampleNo = match[1]

  const getCode = column => {
    const codeEl = column.getElementsByTagName('code')[0]
    const content = codeEl.innerText.replace(/\n$/, '')
    return content
  }

  const getDescription = el => {
    const prevEl = el.previousElementSibling
    if (prevEl == null) return undefined
    if (prevEl.tagName.toLowerCase() === 'p') {
      return prevEl.innerText.replace(/:$/, '')
    }
    if (prevEl.classList.contains('example')) {
      return getDescription(prevEl)
    }
  }

  const { origin, pathname } = window.location
  const columns = exampleEl.getElementsByClassName('column')
  const result = {
    title: `GFM#${exampleNo} ${origin}${pathname}#${exampleId}`,
    description: getDescription(exampleEl),
    content: getCode(columns[0]).replace(/→/g, '\t'),
    expectedHtml: getCode(columns[1]).replace(/→/g, '\t'),
  }
  return result
}

export function extractGFMExamples(...exampleNos) {
  const exampleEls = exampleNos.map(exampleNo => {
    const id = 'example-' + exampleNo
    const elementEl = document.getElementById(id)
    return elementEl
  })
  let result = exampleEls.map(exampleEl => parseGFMExample(exampleEl))
  if (result.length === 1) result = result[0]
  return JSON.stringify(result, null, 2)
}

export function extractGFMExamplesInRange(left, right = left) {
  const exampleNos = []
  for (let i = left; i <= right; ++i) exampleNos.push(i)
  return extractGFMExamples(...exampleNos)
}

export function extractAllGFMExamples() {
  const exampleEls = document.querySelectorAll('[id^=example]')
  const result = Array.from(exampleEls).map(exampleEl => parseGFMExample(exampleEl))
  return JSON.stringify(result, null, 2)
}
