// @ts-check
/** @import { IYozoraUseCaseAnswer, IYozoraUseCaseAnswers, ParserName } from './types.mjs' */

/**
 * Resolve each representation separately so a partial override preserves the
 * inherited expectations for the other representations.
 * @template T
 * @param {IYozoraUseCaseAnswers<T>} answer
 * @param {ParserName} parserName
 * @returns {IYozoraUseCaseAnswer<T>}
 */
export function resolveAnswer(answer, parserName) {
  const gfm = answer.gfm
  const gfmEx = parserName === 'gfm' ? undefined : answer['gfm-ex']
  const yozora = parserName === 'yozora' ? answer.yozora : undefined
  return {
    html: yozora?.html ?? gfmEx?.html ?? gfm.html,
    markup: yozora?.markup ?? gfmEx?.markup ?? gfm.markup,
    ast: yozora?.ast ?? gfmEx?.ast ?? gfm.ast,
  }
}
