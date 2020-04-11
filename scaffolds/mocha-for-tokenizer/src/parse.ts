import fs from 'fs-extra'
import {
  BlockDataNodeData,
  BlockDataNodeTokenizer,
  BlockDataNodeTokenizerConstructor,
  DataNode,
  DataNodeTokenPointDetail,
  DataNodeType,
  DefaultBlockDataNodeTokenizerContext,
  DefaultInlineDataNodeTokenizerContext,
  InlineDataNode,
  InlineDataNodeTokenizer,
  InlineDataNodeTokenizerConstructor,
  calcDataNodeTokenPointDetail,
} from '@yozora/tokenizer-core'
import {
  FileTestCase,
  FileTestCaseMaster,
  FileTestCaseMasterProps,
} from './util/file-case-master'


type PickPartial<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>
type ParseFunc = (content: string) => DataNode[]


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
  answer: DataNode[]
}>


/**
 * DataSchema 编译器测试用例辅助类
 */
export class TokenizerParseTestCaseMaster
  extends FileTestCaseMaster<OutputData, OutputData> {
  private readonly parse: ParseFunc
  public constructor(parse: ParseFunc, {
    caseRootDirectory,
    inputFileNameSuffix = '.input.json',
    answerFileNameSuffix = '.parse.answer.json',
  }: PickPartial<FileTestCaseMasterProps, 'inputFileNameSuffix' | 'answerFileNameSuffix'>) {
    super({ caseRootDirectory, inputFileNameSuffix, answerFileNameSuffix })
    this.parse = parse
  }

  // override
  public async consume(kase: FileTestCase): Promise<OutputData | never> {
    const { inputFilePath } = kase
    const input: InputData = await fs.readJSON(inputFilePath)
    const results: OutputData = []
    for (const { content } of input.cases) {
      const answer = this.parse(content)
      results.push({ content, answer })
    }
    return results
  }

  // override
  public toJSON(data: OutputData): OutputData {
    const stringified = JSON.stringify(data, (key: string, val: any) => {
      switch (key) {
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
 * map InlineDataNodeTokenizer to ParseFunc
 * @param tokenizer
 */
export function mapInlineTokenizerToParseFunc(
  tokenizer?: InlineDataNodeTokenizer,
  FallbackTokenizerOrTokenizerConstructor?: InlineDataNodeTokenizer | InlineDataNodeTokenizerConstructor,
): ParseFunc {
  const context = new DefaultInlineDataNodeTokenizerContext(FallbackTokenizerOrTokenizerConstructor)
  if (tokenizer != null) {
    context.useTokenizer(tokenizer)
  }
  return (content: string): DataNode[] => {
    const codePoints = calcDataNodeTokenPointDetail(content)
    if (codePoints == null || codePoints.length <= 0) return []
    const startIndex = 0
    const endIndex = codePoints.length
    const matchResults = context.match(codePoints, startIndex, endIndex)
    return context.parse(codePoints, startIndex, endIndex, matchResults)
  }
}


/**
 * map BlockDataNodeTokenizer to ParseFunc
 * @param tokenizer
 */
export function mapBlockTokenizerToParseFunc(
  tokenizer?: BlockDataNodeTokenizer<DataNodeType, BlockDataNodeData, any, any>,
  FallbackTokenizerOrTokenizerConstructor?: BlockDataNodeTokenizer | BlockDataNodeTokenizerConstructor,
): ParseFunc {
  const context = new DefaultBlockDataNodeTokenizerContext(
    FallbackTokenizerOrTokenizerConstructor,
    undefined,
    {
      inlineDataNodeParseFunc(
        codePoints: DataNodeTokenPointDetail[],
        startIndex: number,
        endIndex: number,
      ): InlineDataNode[] {
        const result = {
          type: 'TEXT',
          content: codePoints
            .slice(startIndex, endIndex)
            .map(c => String.fromCodePoint(c.codePoint))
            .join(''),
        } as InlineDataNode
        return [result]
      },
    },
  )
  if (tokenizer != null) {
    context.useTokenizer(tokenizer)
  }
  return (content: string): DataNode[] => {
    const codePoints = calcDataNodeTokenPointDetail(content)
    if (codePoints == null || codePoints.length <= 0) return []
    const startIndex = 0
    const endIndex = codePoints.length
    const matchResults = context.match(codePoints, startIndex, endIndex)
    return context.parse(codePoints, startIndex, endIndex, matchResults)
  }
}
