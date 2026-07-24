/* eslint-disable no-undef */
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
