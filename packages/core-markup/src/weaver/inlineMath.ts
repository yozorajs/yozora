import type { InlineMath } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

const symbolRegex = /(\$[`]+)/g

export interface IInlineMathMarkupWeaverOptions {
  readonly preferBackTick: boolean
}

/**
 * Inline math content.
 *
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#inlinemath
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/inline-math
 */
export class InlineMathMarkupWeaver implements INodeMarkupWeaver<InlineMath> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false
  protected readonly preferBackTick: boolean

  constructor(options?: IInlineMathMarkupWeaverOptions) {
    this.preferBackTick = options?.preferBackTick ?? true
  }

  public weave(node: InlineMath): INodeMarkup {
    const { value } = node

    let backtickCnt = 0
    for (let match: RegExpExecArray | null = null; ; ) {
      match = symbolRegex.exec(value)
      if (match == null) break

      const len: number = match[1].length ?? 0
      if (backtickCnt < len) backtickCnt = len
    }

    if (backtickCnt === 0) {
      return {
        opener: this.preferBackTick ? '`$' : '$',
        closer: this.preferBackTick ? '$`' : '$',
        content: value,
      }
    }

    const backticks: string =
      backtickCnt === 0 ? (this.preferBackTick ? '`' : '') : '`'.repeat(backtickCnt - 1)
    return {
      opener: backticks + '$ ',
      closer: ' $' + backticks,
      content: value,
    }
  }
}
