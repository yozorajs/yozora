import type { Strong } from '@yozora/ast'
import { StrongType } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const _escapeContent: IEscaper = createCharacterEscaper(['*'])

/**
 * Strong represents strong importance, seriousness, or urgency for its contents.
 *
 * @see https://github.com/syntax-tree/mdast#strong
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#strong
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/strong
 */
export class StrongWeaver implements INodeWeaver<Strong> {
  public readonly type = StrongType
  public readonly isBlockLevel = (): boolean => false
  public readonly escapeContent: IEscaper = _escapeContent

  public weave(): INodeMarkup {
    return {
      opener: '**',
      closer: '**',
    }
  }
}
