import type { InlineMath } from '@yozora/ast'
import { InlineMathType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '@yozora/markup-gfm-ex'

export interface IInlineMathMarkupWeaverOptions {
  readonly preferBacktick: boolean
}

/**
 * Inline math content.
 *
 * @see https://github.com/yozorajs/yozora/tree/v3/packages/ast#inlinemath
 * @see https://github.com/yozorajs/yozora/tree/v3/tokenizers/tokenizer-inline-math
 */
export class InlineMathWeaver implements INodeWeaver<InlineMath> {
  public readonly type = InlineMathType
  public readonly isBlockLevel = (): boolean => false
  protected readonly preferBackTick: boolean

  constructor(options?: IInlineMathMarkupWeaverOptions) {
    this.preferBackTick = options?.preferBacktick ?? false
  }

  public weave(node: InlineMath): INodeMarkup {
    const value = node.value.trim()
    if (this.preferBackTick) return { opener: '`$' + value + '$`' }
    return { opener: `$${value}$` }
  }
}
