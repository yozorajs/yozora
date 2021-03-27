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
  definitions: Record<string, Omit<Definition, 'type'>>
  /**
   * Footnote definition map.
   */
  footnoteDefinitions: Record<string, Omit<FootnoteDefinition, 'type'>>
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
