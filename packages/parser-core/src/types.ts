import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'


export interface MatchDataNode {
  /**
   * Typeof data node
   */
  type: string
  /**
   * List of child nodes of current data node
   */
  children?: MatchDataNode[]
}


/**
 * Result of DataNodeParser.match
 */
export interface MatchResult {
  /**
   * The root node identifier
   */
  type: 'root'
  /**
   * Meta data
   */
  meta: Record<string, unknown>
  /**
   * List of child nodes of current data node
   */
  children: MatchDataNode[]
}


export interface ParseDataNode {
  /**
   * Typeof data node
   */
  type: string
  /**
   * List of child nodes of current data node
   */
  children?: ParseDataNode[]
}


/**
 * Result of DataNodeParser.parse
 */
export interface ParseResult {
  /**
   * The root node identifier
   */
  type: 'root'
  /**
   * Meta data
   */
  meta: Record<string, unknown>
  /**
   * List of child nodes of current data node
   */
  children: ParseDataNode[]
}


/**
 * A parser consisting of DataNodeTokenizers
 */
export interface DataNodeParser {
  /**
   * Match contents
   *
   * @param content         source content
   * @param startIndex      start index of content
   * @param endIndex        end index of contents
   * @param codePositions   point detail of content
   */
  match(
    content: string,
    startIndex?: number,
    endIndex?: number,
    codePositions?: DataNodeTokenPointDetail[],
  ): MatchResult

  /**
   * Parse matched results
   *
   * @param content         source content
   * @param startIndex      start index of content
   * @param endIndex        end index of contents
   * @param codePositions   point detail of content
   */
  parse(
    content: string,
    startIndex?: number,
    endIndex?: number,
    codePositions?: DataNodeTokenPointDetail[],
  ): ParseResult
}
