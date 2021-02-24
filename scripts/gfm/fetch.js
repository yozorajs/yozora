/**
 * 将 GFM 中的 example 元素解析成 JSON 数据
 * @param exampleEl example 元素
 */
function parseGFMExample(exampleEl) {
  if (exampleEl == null) return null

  const exampleId = exampleEl.id || ''
  const exampleNo = exampleId.replace(/^example-(\d+)$/, '$1')
  if (exampleNo.length < 0) {
    console.error(`Bad exampleEl: id(${exampleEl.id}). skipped`)
    return null
  }

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

function fetchGFMExamples(...exampleNos) {
  const exampleEls = exampleNos.map(exampleNo => {
    const id = 'example-' + exampleNo
    const elementEl = document.getElementById(id)
    return elementEl
  })
  let result = exampleEls.map(exampleEl => parseGFMExample(exampleEl))
  if (result.length === 1) result = result[0]
  return JSON.stringify(result, null, 2)
}

function fetchGFMExamplesInRange(left, right = left) {
  const exampleNos = []
  for (let i = left; i <= right; ++i) exampleNos.push(i)
  return fetchGFMExamples(...exampleNos)
}

function fetchExamplesAll() {
  const exampleEls = document.querySelectorAll('[id^=example]')
  const result = Array.from(exampleEls).map(exampleEl =>
    parseGFMExample(exampleEl),
  )
  return JSON.stringify(result, null, 2)
}

module.exports = {
  fetchExamplesAll,
  fetchGFMExamples,
  fetchGFMExamplesInRange,
  parseGFMExample,
}
