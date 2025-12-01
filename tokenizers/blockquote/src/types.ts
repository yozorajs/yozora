import type { Blockquote, BlockquoteCalloutType, BlockquoteType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IBlockToken,
  IPartialBlockToken,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = BlockquoteType
export type INode = Blockquote
export const uniqueName = '@yozora/tokenizer-blockquote'

export interface IToken extends IPartialBlockToken<T> {
  /**
   * Child block tokens.
   */
  children: IBlockToken[]
  /**
   * GitHub callout type (e.g., 'note', 'tip', 'important', 'warning', 'caution').
   */
  callout?: BlockquoteCalloutType
}

export interface IThis extends ITokenizer {
  /**
   * Whether to enable GitHub callout syntax.
   */
  enableGithubCallout: boolean
}

export interface ITokenizerProps extends Partial<IBaseBlockTokenizerProps> {
  /**
   * Whether to enable GitHub callout syntax (e.g., `> [!NOTE]`).
   * @default false
   */
  enableGithubCallout?: boolean
}
