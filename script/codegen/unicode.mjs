/**
 * Browser-console generator for the Unicode code-point tables in
 * `packages/character/src/constant/unicode/*.ts` (categories Pc, Pd, Pe, Pf, Pi,
 * Po, Ps). Open the category listing page linked below (e.g. the Pd
 * "Punctuation, Dash" list), pass the results table's `<tbody>` element to this
 * function in the browser devtools, then paste the returned enum members into
 * the corresponding `*.ts` file. It is a manual, run-in-the-browser aid and is
 * intentionally not wired into any pnpm or CI command.
 *
 * @see https://www.fileformat.info/info/unicode/category/Pd/list.htm
 */
export function extractUnicodeCharacters(tbody) {
  const trList = tbody.querySelectorAll('tr')
  const items = []
  for (let i = 0; i < trList.length; ++i) {
    const tr = trList[i]
    const tdList = tr.querySelectorAll('td')
    const valueText = tdList[0].innerText
    const nameText = tdList[1].innerText
    const url = tdList[0].querySelector('a').href
    if (valueText == null) continue

    const name = nameText.trim().split(/[\s-]/g).join('_')
    const value = valueText.trim().toLowerCase().replace(/^u\+/i, '0x0')
    const item = '  /**\n   * @see ' + url + '\n   */\n  ' + name + ` = ${value},`
    items.push(item)
  }
  return items.join('\n')
}
