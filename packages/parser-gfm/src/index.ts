import {
  ContentsField,
  DataNodeParser,
  DefaultDataNodeParser,
} from '@yozora/parser-core'
import { BlockquoteTokenizer } from '@yozora/tokenizer-blockquote'
import { DeleteTokenizer } from '@yozora/tokenizer-delete'
import { EmphasisTokenizer } from '@yozora/tokenizer-emphasis'
import { FencedCodeTokenizer } from '@yozora/tokenizer-fenced-code'
import { HeadingTokenizer } from '@yozora/tokenizer-heading'
import { ImageTokenizer } from '@yozora/tokenizer-image'
import { IndentedCodeTokenizer } from '@yozora/tokenizer-indented-code'
import { InlineCodeTokenizer } from '@yozora/tokenizer-inline-code'
import { InlineFormulaTokenizer } from '@yozora/tokenizer-inline-formula'
import {
  InlineHtmlCommentTokenizer,
} from '@yozora/tokenizer-inline-html-comment'
import { LineBreakTokenizer } from '@yozora/tokenizer-line-break'
import { LinkTokenizer } from '@yozora/tokenizer-link'
import { LinkDefinitionTokenizer } from '@yozora/tokenizer-link-definition'
import { ListTokenizer } from '@yozora/tokenizer-list'
import { ListBulletItemTokenizer } from '@yozora/tokenizer-list-bullet-item'
import { ListOrderedItemTokenizer } from '@yozora/tokenizer-list-ordered-item'
import { ListTaskItemTokenizer } from '@yozora/tokenizer-list-task-item'
import {
  ParagraphTokenizer,
  PhrasingContentDataNodeType,
} from '@yozora/tokenizer-paragraph'
import { ReferenceImageTokenizer } from '@yozora/tokenizer-reference-image'
import { ReferenceLinkTokenizer } from '@yozora/tokenizer-reference-link'
import { SetextHeadingTokenizer } from '@yozora/tokenizer-setext-heading'
import { TableTokenizer } from '@yozora/tokenizer-table'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { ThematicBreakTokenizer } from '@yozora/tokenizer-thematic-break'
import {
  BlockDataNode,
  DefaultBlockTokenizerContext,
} from '@yozora/tokenizercore-block'
import { DefaultInlineTokenizerContext } from '@yozora/tokenizercore-inline'


export class GFMDataNodeParser extends DefaultDataNodeParser
  implements DataNodeParser {
  public constructor(
    resolveRawContentsField?: (o: BlockDataNode) => ContentsField | null,
  ) {
    // build block context
    const fallbackBlockTokenizer = new ParagraphTokenizer({ priority: 1 })
    const blockContext = new DefaultBlockTokenizerContext({
      fallbackTokenizer: fallbackBlockTokenizer,
    })
      .useTokenizer(new IndentedCodeTokenizer({ priority: 5 }))
      .useTokenizer(new ThematicBreakTokenizer({ priority: 4 }))
      .useTokenizer(new BlockquoteTokenizer({ priority: 3 }))
      .useTokenizer(new ListBulletItemTokenizer({ priority: 3 }))
      .useTokenizer(new ListOrderedItemTokenizer({ priority: 3 }))
      .useTokenizer(new HeadingTokenizer({ priority: 1 }))
      .useTokenizer(new FencedCodeTokenizer({ priority: 1 }))
      .useTokenizer(new TableTokenizer({ priority: 1 }))

      // transforming hooks
      .useTokenizer(new SetextHeadingTokenizer({ priority: 4 }))
      .useTokenizer(new ListTaskItemTokenizer({ priority: 3 }))
      .useTokenizer(new ListTokenizer({ priority: 2 }))
      .useTokenizer(new LinkDefinitionTokenizer({ priority: 1 }))


    // build inline context
    const fallbackInlineTokenizer = new TextTokenizer({ priority: -1 })
    const inlineContext = new DefaultInlineTokenizerContext({
      fallbackTokenizer: fallbackInlineTokenizer,
    })
      .useTokenizer(new InlineHtmlCommentTokenizer({ priority: 4 }))
      .useTokenizer(new InlineCodeTokenizer({ priority: 4 }))
      .useTokenizer(new InlineFormulaTokenizer({ priority: 4 }))
      .useTokenizer(new ImageTokenizer({ priority: 3 }))
      .useTokenizer(new LinkTokenizer({ priority: 3 }))
      .useTokenizer(new ReferenceImageTokenizer({ priority: 3 }))
      .useTokenizer(new ReferenceLinkTokenizer({ priority: 3 }))
      .useTokenizer(new LineBreakTokenizer({ priority: 2 }))
      .useTokenizer(new EmphasisTokenizer({ priority: 1 }))
      .useTokenizer(new DeleteTokenizer({ priority: 1 }))

    // resolve resolveRawContentsField
    if (resolveRawContentsField == null) {
      // eslint-disable-next-line no-param-reassign
      resolveRawContentsField = (o) => {
        if (o.type === PhrasingContentDataNodeType) {
          if (o['contents'] != null) {
            return { name: 'contents', value: o['contents'] }
          }
        }
        return null
      }
    }

    super(blockContext, inlineContext, resolveRawContentsField)
  }
}


export const gfmDataNodeParser = new GFMDataNodeParser()
