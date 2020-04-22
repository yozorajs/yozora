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
  SingleFileTestCaseMaster,
  SingleFileTestCaseMasterProps,
  SingleTestCaseInputItem,
} from './util/single-file-case-master'


type PickPartial<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>
type ParseFunc = (content: string) => DataNode[]


/**
 * 输出文件的数据类型
 */
type OutputData = DataNode[]


/**
 * DataSchema 编译器测试用例辅助类
 */
export class TokenizerParseTestCaseMaster
  extends SingleFileTestCaseMaster<OutputData, OutputData> {
  private readonly parse: ParseFunc
  public constructor(parse: ParseFunc, {
    caseRootDirectory,
    inputField = 'input',
    answerField = 'matchAnswer',
  }: PickPartial<SingleFileTestCaseMasterProps, 'inputField' | 'answerField'>) {
    super({ caseRootDirectory, inputField, answerField })
    this.parse = parse
  }

  // override
  public async consume(inputItem: SingleTestCaseInputItem): Promise<OutputData | never> {
    const { content } = inputItem
    const answer = await this.parse(content)
    return answer
  }

  // override
  public toJSON(data: OutputData): OutputData {
    const stringified = JSON.stringify(data, (key: string, val: any) => {
      switch (key) {
        case 'children':
          return (val == null) ? undefined : val
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
