import type { Delete } from '@yozora/ast'
import { DeleteType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'

/**
 * Delete represents contents that are no longer accurate or no longer relevant.
 *
 * @see https://github.com/syntax-tree/mdast#delete
 * @see https://github.github.com/gfm/#strikethrough-extension-
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#delete
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/delete
 */
export class DeleteWeaver implements INodeWeaver<Delete> {
  public readonly type = DeleteType
  public readonly isBlockLevel = (): boolean => false

  public weave(): INodeMarkup {
    return {
      opener: '~~',
      closer: '~~',
    }
  }
}
