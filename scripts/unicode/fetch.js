/**
 * @see https://www.fileformat.info/info/unicode/category/Pd/list.htm
 */
function fetchUnicodeCharacter (tbody) {
  const trList = tbody.querySelectorAll('tr')
  const items = []
  for (let i = 0; i < trList.length; ++i) {
    const tr = trList[i]
    const tdList = tr.querySelectorAll('td')
    const valueText = tdList[0].innerText
    const nameText = tdList[1].innerText
    const url = tdList[0].querySelector('a').href
    if (valueText == null) continue

    const name = nameText.trim().split(/[\s\-]/g).join('_')
    const value = valueText.trim().toLowerCase().replace(/^u\+/i, '0x0')
    const item = '  /**\n   ' + '* @see ' + url + '\n   */\n  ' + `${name} = ${value},`
    items.push(item)
  }
  return items.join('\n')
}
