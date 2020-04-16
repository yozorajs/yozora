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
import fs from 'fs-extra'
import {
  FileTestCase,
  FileTestCaseMaster,
  FileTestCaseMasterProps,
} from './util/file-case-master'


type PickPartial<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>
type MatchFunc = (content: string) => DataNodeMatchResult[]


/**
 * 输入文件的数据类型
 */
type InputData = {
  type: DataNodeType
  cases: Array<{
    content: string
    description?: string
    expectedHtml?: string
    reason?: string
  }>
}


/**
 * 输出文件的数据类型
 */
type OutputData = Array<{
  content: string
  answer: DataNodeMatchResult[]
}>


/**
 * DataSchema 编译器测试用例辅助类
 */
export class TokenizerMatchTestCaseMaster
  extends FileTestCaseMaster<OutputData, OutputData> {
  private readonly match: MatchFunc
  public constructor(match: MatchFunc, {
    caseRootDirectory,
    inputFileNameSuffix = '.input.json',
    answerFileNameSuffix = '.match.answer.json',
  }: PickPartial<FileTestCaseMasterProps, 'inputFileNameSuffix' | 'answerFileNameSuffix'>) {
    super({ caseRootDirectory, inputFileNameSuffix, answerFileNameSuffix })
    this.match = match
  }

  // override
  public async consume(kase: FileTestCase): Promise<OutputData | never> {
    const { inputFilePath } = kase
    const input: InputData = await fs.readJSON(inputFilePath)
    const results: OutputData = []
    for (const { content } of input.cases) {
      const answer = this.match(content)
      results.push({ content, answer })
    }
    return results
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
