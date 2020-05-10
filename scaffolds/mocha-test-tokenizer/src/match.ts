import {
  BlockTokenizer,
  BlockTokenizerMatchPhaseStateTree,
  DefaultBlockTokenizerContext,
} from '@yozora/block-tokenizer-core'
import {
  DataNodeMatchResult,
  DataNodeType,
  DefaultInlineDataNodeTokenizerContext,
  InlineDataNodeTokenizer,
  InlineDataNodeTokenizerConstructor,
  calcDataNodeTokenPointDetail,
} from '@yozora/tokenizer-core'
import {
  SingleFileTestCaseMaster,
  SingleFileTestCaseMasterProps,
  SingleTestCaseItem,
} from './util/single-file-case-master'


type PickPartial<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>
type MatchFunc = (content: string) => BlockTokenizerMatchPhaseStateTree | DataNodeMatchResult[]


/**
 * 输出文件的数据类型
 */
type OutputData = BlockTokenizerMatchPhaseStateTree | DataNodeMatchResult[]


/**
 * DataSchema 编译器测试用例辅助类
 */
export class TokenizerMatchTestCaseMaster
  extends SingleFileTestCaseMaster<OutputData, OutputData> {
  private readonly match: MatchFunc
  public constructor(match: MatchFunc, {
    caseRootDirectory,
    inputField = 'input',
    answerField = 'matchAnswer',
  }: PickPartial<SingleFileTestCaseMasterProps, 'inputField' | 'answerField'>) {
    super({ caseRootDirectory, inputField, answerField })
    this.match = match
  }

  // override
  public async consume(inputItem: SingleTestCaseItem): Promise<OutputData | never> {
    const { input } = inputItem
    const answer = await this.match(input)
    return answer
  }

  // override
  public toJSON(data: OutputData): OutputData {
    const stringified = JSON.stringify(data, (key: string, val: any) => {
      switch (key) {
        case '_unExcavatedContentPieces':
        case '_unAcceptableChildTypes':
        case 'classify':
          return undefined
        case 'children':
          return (val == null || val.length <= 0) ? undefined : val
        default:
          return val
      }
    })
    return JSON.parse(stringified)
  }
}


/**
 * map InlineDataNodeTokenizer to MatchFunc
 * @param tokenizer
 */
export function mapInlineTokenizerToMatchFunc(
  tokenizer?: InlineDataNodeTokenizer,
  FallbackTokenizerOrTokenizerConstructor?: InlineDataNodeTokenizer | InlineDataNodeTokenizerConstructor,
): MatchFunc {
  const context = new DefaultInlineDataNodeTokenizerContext(FallbackTokenizerOrTokenizerConstructor)
  if (tokenizer != null) {
    context.useTokenizer(tokenizer)
  }
  return (content: string): DataNodeMatchResult[] => {
    const codePoints = calcDataNodeTokenPointDetail(content)
    if (codePoints == null || codePoints.length <= 0) return []
    const startIndex = 0
    const endIndex = codePoints.length
    return context.match(codePoints, startIndex, endIndex)
  }
}


/**
 * map BlockDataNodeTokenizer to MatchFunc
 * @param tokenizer
 */
export function mapBlockTokenizerToMatchFunc(
  fallbackTokenizer: BlockTokenizer | null,
  ...tokenizers: BlockTokenizer<DataNodeType>[]
): MatchFunc {
  const context = new DefaultBlockTokenizerContext({ fallbackTokenizer })
  for (const tokenizer of tokenizers) {
    if (tokenizer != null) {
      context.useTokenizer(tokenizer)
    }
  }

  return (content: string): BlockTokenizerMatchPhaseStateTree => {
    const codePositions = calcDataNodeTokenPointDetail(content)
    const startIndex = 0
    const endIndex = codePositions.length

    const preMatchPhaseStateTree = context.preMatch(codePositions, startIndex, endIndex)
    const matchPhaseStateTree = context.match(preMatchPhaseStateTree)
    return matchPhaseStateTree
  }
}
