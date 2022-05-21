import type { FootnoteDefinition } from '@yozora/ast'
import { FootnoteDefinitionType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * FootnoteDefinition represents content relating to the document that is outside its flow.
 *
 * @see https://github.com/syntax-tree/mdast#footnotedefinition
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#footnotedefinition
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/footnote-definition
 */
export class FootnoteDefinitionMarkupWeaver implements INodeMarkupWeaver<FootnoteDefinition> {
  public readonly type = FootnoteDefinitionType
  public readonly isBlockLevel = (): boolean => true

  public weave(node: FootnoteDefinition): INodeMarkup {
    return { opener: `[^${node.label}]: `, indent: '    ' }
  }
}
