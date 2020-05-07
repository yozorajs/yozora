import { DataNodeData, DataNodeType } from '../_types/data-node'
import { DataNodeTokenPointDetail } from '../_types/token'
import { BlockTokenizerMatchPhaseStateTree } from './lifecycle/match'
import { BlockTokenizerParseFlowPhaseStateTree } from './lifecycle/parse-flow'
import { BlockTokenizerPreMatchPhaseStateTree } from './lifecycle/pre-match'


/**
 * 块状数据节点的类型
 * Type of BlockDataNode
 */
export type BlockDataNodeType = DataNodeType & string


/**
 * 块状数据节点的数据
 * Data of BlockDataNode
 */
export interface BlockDataNodeData extends DataNodeData {

}


/**
 *
 */
export interface BlockDataNodeTokenizer<
  T extends BlockDataNodeType = BlockDataNodeType,
  > {
  /**
   * The name of the tokenizer
   */
  readonly name: string
  /**
   * 词法分析器的优先级，数值越大，优先级越高
   * The priority of the tokenizer.
   * The larger the value, the higher the priority.
   */
  readonly priority: number
  /**
   * 当前分词器可识别的数据节点类型
   * 用于在解析操作中，快速定位到 match 函数返回的数据中数据节点所对应的分词器
   */
  readonly uniqueTypes: T[]
}


/**
 * 块状数据节点的词法分析器的上下文
 * Context of BlockDataNodeTokenizer
 */
export interface BlockDataNodeTokenizerContext {
  /**
   *
   */
  register(tokenizer: any): void

  /**
   *
   * @param codePositions
   * @param startIndex
   * @param endIndex
   */
  preMatch(
    codePositions: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
  ): BlockTokenizerPreMatchPhaseStateTree

  /**
   *
   * @param tree
   */
  match(
    tree: BlockTokenizerPreMatchPhaseStateTree,
  ): BlockTokenizerMatchPhaseStateTree

  /**
   *
   * @param tree
   */
  postMatch(
    tree: BlockTokenizerMatchPhaseStateTree,
  ): BlockTokenizerMatchPhaseStateTree

  /**
   *
   * @param tree
   */
  parseFlow(
    tree: BlockTokenizerMatchPhaseStateTree,
  ): BlockTokenizerParseFlowPhaseStateTree
}
