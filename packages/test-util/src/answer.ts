import type { IYozoraUseCaseAnswer, IYozoraUseCaseAnswers, ParserName } from './types'

/**
 * Resolve each representation separately so a partial override preserves the
 * inherited expectations for the other representations.
 */
export function resolveAnswer<T>(
  answer: IYozoraUseCaseAnswers<T>,
  parserName: ParserName,
): IYozoraUseCaseAnswer<T> {
  const gfm = answer.gfm
  const gfmEx = parserName === 'gfm' ? undefined : answer['gfm-ex']
  const yozora = parserName === 'yozora' ? answer.yozora : undefined
  return {
    html: yozora?.html ?? gfmEx?.html ?? gfm.html,
    markup: yozora?.markup ?? gfmEx?.markup ?? gfm.markup,
    ast: yozora?.ast ?? gfmEx?.ast ?? gfm.ast,
  }
}
