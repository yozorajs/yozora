import { BlockDataNodeMetaData, BlockDataNodeType } from './base'
import {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
} from './lifecycle/match'
import {
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
} from './lifecycle/parse'
import {
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
} from './lifecycle/pre-match'
import { BlockTokenizerPreParsePhaseState } from './lifecycle/pre-parse'
import { PhrasingContentLine } from './phrasing'


/**
 * 块状数据节点的分词器的构造函数的参数
 * Params for BlockTokenizerConstructor
 */
export interface BlockTokenizerConstructorParams<
  T extends BlockDataNodeType = BlockDataNodeType
  > {
  /**
   * The priority of the tokenizer.
   * The larger the value, the higher the priority.
   */
  readonly priority: number
  /**
   * The name of the tokenizer
   */
  readonly name?: string
  /**
   * 当前分词器可识别的数据节点类型
   * 用于在解析操作中，快速定位到 match 函数返回的数据中数据节点所对应的分词器
   */
  readonly uniqueTypes?: T[]
}


/**
 * 块状数据节点的分词器
 *
 * Tokenizer for block data node
 */
export interface BlockTokenizer<T extends BlockDataNodeType = BlockDataNodeType> {
  /**
   * The name of the tokenizer
   */
  readonly name: string
  /**
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
 * Fallback BlockTokenizer
 */
export interface FallbackBlockTokenizer extends
  BlockTokenizer<BlockDataNodeType>,
  BlockTokenizerPreMatchPhaseHook<
    BlockDataNodeType,
    BlockTokenizerPreMatchPhaseState<BlockDataNodeType & any> | any
  >,
  BlockTokenizerMatchPhaseHook<
    BlockDataNodeType,
    BlockTokenizerPreMatchPhaseState<BlockDataNodeType & any> | any,
    BlockTokenizerMatchPhaseState<BlockDataNodeType & any>
  >,
  BlockTokenizerParsePhaseHook<
    BlockDataNodeType,
    BlockTokenizerMatchPhaseState<BlockDataNodeType & any> | any,
    BlockTokenizerParsePhaseState<BlockDataNodeType & any>,
    BlockDataNodeMetaData,
    BlockTokenizerPreParsePhaseState<BlockDataNodeMetaData & any>
  > {
  /**
   *
   * @param opening
   * @param parent
   * @param lines
   */
  createPreMatchPhaseState(
    opening: boolean,
    parent: BlockTokenizerPreMatchPhaseState,
    lines: PhrasingContentLine[],
  ): BlockTokenizerPreMatchPhaseState
}
