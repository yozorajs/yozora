import type { Root } from '@yozora/ast'
import { RootType } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * Root node of the AST.
 * @see https://github.com/syntax-tree/unist#root
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#root
 */
export class RootMarkupWeaver implements INodeMarkupWeaver<Root> {
  public readonly type = RootType
  public readonly isBlockLevel = (): boolean => true
  public readonly escapeContent: IEscaper = _escapeContent

  public weave(): INodeMarkup {
    return {}
  }
}

const _escapeContent: IEscaper = content => {
  return content
    .replace(/((?:^|\n)[ \t]*)([>])/g, '$1\\$2') // for blockquote
    .replace(/((?:^|\n)[ \t]*)([#]{1,6}(?:[ \t]|$))/g, '$1\\$2') // for heading
    .replace(/((?:^|\n)[ \t]*)([=]{3,})[ \t]*(\n|$)/g, '$1\\$2$3') // for setext heading
    .replace(/((?:^|\n)[^\n#]+[ \t]+)([#]+(?:\n|$))/g, '$1\\$2') // for heading
    .replace(/(\n)([-*+][ \t]+\S)/g, '$1\\$2') // for list
    .replace(/(\n)([-_*])([ \t]*\2[ \t]*\2(?:[ \t]|\2)*(?:\n|$))/g, '$1\\$2$3') // for thematicBreak
    .replace(/(\\+)$/, m => (m.length & 1 ? m + '\\' : m))
}
