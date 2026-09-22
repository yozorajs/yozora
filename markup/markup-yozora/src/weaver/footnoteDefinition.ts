import type { FootnoteDefinition } from '@yozora/ast'
import { FootnoteDefinitionType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '@yozora/markup'

/**
 * FootnoteDefinition represents content relating to the document that is outside its flow.
 *
 * @see https://github.com/syntax-tree/mdast#footnotedefinition
 * @see https://github.com/yozorajs/yozora/tree/v3/packages/ast#footnotedefinition
 * @see https://github.com/yozorajs/yozora/tree/v3/tokenizers/tokenizer-footnote-definition
 */
export class FootnoteDefinitionWeaver implements INodeWeaver<FootnoteDefinition> {
  public readonly type = FootnoteDefinitionType
  public readonly isBlockLevel = (): boolean => true

  public weave(node: FootnoteDefinition): INodeMarkup {
    return { opener: `[^${node.label}]: `, indent: '    ' }
  }
}
