import {
  BlockDataNodeData,
  BlockDataNodeTokenizer,
  BlockDataNodeTokenizerConstructor,
  DataNodeMatchResult,
  DataNodeType,
  DefaultBlockDataNodeTokenizerContext,
  DefaultInlineDataNodeTokenizerContext,
  InlineDataNodeTokenizer,
  InlineDataNodeTokenizerConstructor,
  calcDataNodeTokenPointDetail,
} from '@yozora/tokenizer-core'
import {
  SingleFileTestCaseMaster,
  SingleFileTestCaseMasterProps,
  SingleTestCaseInputItem,
} from './util/single-file-case-master'


type PickPartial<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>
type MatchFunc = (content: string) => DataNodeMatchResult[]


/**
 * 输出文件的数据类型
 */
type OutputData = DataNodeMatchResult[]


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
  public async consume(inputItem: SingleTestCaseInputItem): Promise<OutputData | never> {
    const { content } = inputItem
    const answer = await this.match(content)
    return answer
  }

  // override
  public toJSON(data: OutputData): OutputData {
    const stringified = JSON.stringify(data, (key: string, val: any) => {
      switch (key) {
        case '_unExcavatedContentPieces':
        case '_unAcceptableChildTypes':
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
  tokenizer?: BlockDataNodeTokenizer<DataNodeType, BlockDataNodeData, any, any>,
  FallbackTokenizerOrTokenizerConstructor?: BlockDataNodeTokenizer | BlockDataNodeTokenizerConstructor,
): MatchFunc {
  const context = new DefaultBlockDataNodeTokenizerContext(
    FallbackTokenizerOrTokenizerConstructor,
    undefined,
  )
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
