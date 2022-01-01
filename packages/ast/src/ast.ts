/**
 * Variant of a node of yozora AST.
 */
export type YastNodeType = string

/**
 * Syntactic units of the yozora AST.
 * @see https://github.com/syntax-tree/unist#node
 */
export interface IYastNode<T extends YastNodeType = YastNodeType> {
  /**
   * The variant of a node.
   */
  readonly type: T
  /**
   * Location of a node in a source document.
   * Must not be present if a node is generated.
   */
  position?: IYastNodePosition
}

/**
 * Nodes containing other nodes.
 * @see https://github.com/syntax-tree/mdast#parent
 */
export interface IYastParent<T extends YastNodeType = YastNodeType> extends IYastNode<T> {
  /**
   * List representing the children of a node.
   */
  children: IYastNode[]
}

/**
 * Nodes containing a value.
 */
export interface IYastLiteral<T extends YastNodeType = YastNodeType> extends IYastNode<T> {
  /**
   * Literal value.
   */
  value: string
}

/**
 * A reference to resource.
 * @see https://github.com/syntax-tree/mdast#resource
 */
export interface IYastResource {
  /**
   * A URL to the referenced resource.
   */
  url: string
  /**
   * Advisory information for the resource, such as would be
   * appropriate for a tooltip.
   */
  title?: string
}

/**
 * An internal relation from one node to another.
 * @see https://github.com/syntax-tree/mdast#association
 */
export interface IYastAssociation {
  /**
   * It can match an identifier field on another node.
   */
  identifier: string
  /**
   * The original value of the normalized identifier field.
   */
  label: string
}

/**
 * A marker that is associated to another node.
 * @see https://github.com/syntax-tree/mdast#reference
 */
export interface IYastReference {
  /**
   * The explicitness of a reference:
   *  - shortcut: the reference is implicit, its identifier inferred from its content
   *  - collapsed: the reference is explicit, its identifier inferred from its content
   *  - full: the reference is explicit, its identifier explicitly set
   * @see https://github.com/syntax-tree/mdast#referencetype
   */
  referenceType: 'full' | 'collapsed' | 'shortcut'
}

/**
 * Alternative represents a node with a fallback.
 * @see https://github.com/syntax-tree/mdast#alternative
 */
export interface IYastAlternative {
  /**
   * Equivalent content for environments that cannot represent the
   * node as intended.
   */
  alt: string
}

/**
 * One place in the source file.
 * @see https://github.com/syntax-tree/unist#point
 */
export interface IYastNodePoint {
  /**
   * Line in a source file.
   * @minimum 1
   */
  readonly line: number
  /**
   * Column column in a source file.
   * @minimum 1
   */
  readonly column: number
  /**
   * Character in a source file.
   * @minimum 0
   */
  readonly offset?: number
}

/**
 * Location of a node in a source file.
 * @see https://github.com/syntax-tree/unist#position
 */
export interface IYastNodePosition {
  /**
   * Place of the first character of the parsed source region.
   */
  start: IYastNodePoint
  /**
   * Place of the first character after the parsed source region.
   */
  end: IYastNodePoint
  /**
   * start column at each index (plus start line) in the source region,
   * for elements that span multiple lines
   */
  indent?: number[]
}

/**
 * AlignType represents how phrasing content is aligned
 * @see https://github.com/syntax-tree/mdast#aligntype
 */
export type IYastAlignType = 'left' | 'right' | 'center' | null
