import { InlineDataNodeType, DataNodeTokenPosition } from '@yozora/core'
import { InlineDataNodeTokenizer, DataNodeTokenizerContext } from '../types'


/**
 * 内联数据的词法分析器的抽象类
 */
export abstract class BaseInlineDataNodeTokenizer<T extends InlineDataNodeType>
  implements InlineDataNodeTokenizer<T>  {
  public abstract readonly type: T
  public readonly priority: number
  protected readonly context: DataNodeTokenizerContext

  public constructor(context: DataNodeTokenizerContext, priority: number) {
    this.context = context
    this.priority = priority
  }

  public abstract match(content: string): DataNodeTokenPosition[]
}
