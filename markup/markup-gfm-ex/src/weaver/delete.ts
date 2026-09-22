import type { Delete } from '@yozora/ast'
import { DeleteType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '@yozora/markup'

/**
 * Delete represents contents that are no longer accurate or no longer relevant.
 *
 * @see https://github.com/syntax-tree/mdast#delete
 * @see https://github.github.com/gfm/#strikethrough-extension-
 * @see https://github.com/yozorajs/yozora/tree/v3/packages/ast#delete
 * @see https://github.com/yozorajs/yozora/tree/v3/tokenizers/tokenizer-delete
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
