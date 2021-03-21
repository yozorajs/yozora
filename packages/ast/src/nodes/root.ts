import type { YastParent } from '../ast'
import type { Definition } from './definition'
import type { FootnoteDefinition } from './footnote-definition'

export const RootType = 'root'
export type RootType = typeof RootType

/**
 * Meta data of the AST.
 */
export interface RootMeta {
  /**
   * Resource definition map.
   */
  definition: Record<string, Definition>
  /**
   * Footnote definition map.
   */
  footnoteDefinition: Record<string, FootnoteDefinition>
  /**
   * Additional data.
   */
  [key: string]: unknown
}

/**
 * Root node of the AST.
 * @see https://github.com/syntax-tree/unist#root
 */
export interface Root<Meta extends RootMeta = RootMeta>
  extends YastParent<RootType> {
  /**
   * Meta data.
   */
  meta: Meta
}
