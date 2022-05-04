import type { Delete } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * Delete represents contents that are no longer accurate or no longer relevant.
 *
 * @see https://github.com/syntax-tree/mdast#delete
 * @see https://github.github.com/gfm/#strikethrough-extension-
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#delete
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/delete
 */
export class DeleteMarkupWeaver implements IMarkupWeaver<Delete> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false

  public weave(): IMarkup | string {
    return {
      opener: '~~',
      closer: '~~',
    }
  }
}
