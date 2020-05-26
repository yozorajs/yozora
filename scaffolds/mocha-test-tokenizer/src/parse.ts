import {
  DataNodeTokenPointDetail,
  DataNodeType,
  calcDataNodeTokenPointDetail,
} from '@yozora/tokenizercore'
import {
  BlockTokenizer,
  BlockTokenizerParsePhaseStateTree,
  DefaultBlockTokenizerContext,
} from '@yozora/tokenizercore-block'
import {
  DefaultInlineTokenizerContext,
  InlineDataNode,
  InlineDataNodeType,
  InlineTokenizer,
  InlineTokenizerParsePhaseStateTree,
} from '@yozora/tokenizercore-inline'
import {
  SingleFileTestCaseMaster,
  SingleFileTestCaseMasterProps,
  SingleTestCaseItem,
} from './util/single-file-case-master'


type PickPartial<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>
type ParseFunc = (content: string) => (
  | BlockTokenizerParsePhaseStateTree
  | InlineTokenizerParsePhaseStateTree
)


/**
 * 输出文件的数据类型
 */
type OutputData = (
  | BlockTokenizerParsePhaseStateTree
  | InlineTokenizerParsePhaseStateTree
)


/**
 * DataSchema 编译器测试用例辅助类
 */
export class TokenizerParseTestCaseMaster
  extends SingleFileTestCaseMaster<OutputData, OutputData> {
  private readonly parse: ParseFunc
  public constructor(parse: ParseFunc, {
    caseRootDirectory,
    inputField = 'input',
    answerField = 'parseAnswer',
  }: PickPartial<SingleFileTestCaseMasterProps, 'inputField' | 'answerField'>) {
    super({ caseRootDirectory, inputField, answerField })
    this.parse = parse
  }

  // override
  public async consume(inputItem: SingleTestCaseItem): Promise<OutputData | never> {
    const { input } = inputItem
    const answer = await this.parse(input)
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
  fallbackTokenizer: InlineTokenizer | null,
  ...tokenizers: InlineTokenizer<InlineDataNodeType>[]
): ParseFunc {
  const context = new DefaultInlineTokenizerContext({ fallbackTokenizer })
  for (const tokenizer of tokenizers) {
    if (tokenizer != null) {
      context.useTokenizer(tokenizer)
    }
  }

  return (content: string): InlineTokenizerParsePhaseStateTree => {
    const codePositions = calcDataNodeTokenPointDetail(content)
    const startIndex = 0
    const endIndex = codePositions.length

    const preMatchPhaseStateTree = context.preMatch(codePositions, startIndex, endIndex)
    const matchPhaseStateTree = context.match(codePositions, preMatchPhaseStateTree)
    const postMatchPhaseStateTree = context.postMatch(codePositions, matchPhaseStateTree)
    const parsePhaseMetaTree = context.parse(codePositions, postMatchPhaseStateTree)
    return parsePhaseMetaTree
  }
}


/**
 * map BlockDataNodeTokenizer to ParseFunc
 * @param tokenizer
 */
export function mapBlockTokenizerToParseFunc(
  fallbackTokenizer: BlockTokenizer | null,
  ...tokenizers: BlockTokenizer<DataNodeType>[]
): ParseFunc {
  const context = new DefaultBlockTokenizerContext({
    fallbackTokenizer,
    parseInlineData(
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
  })

  for (const tokenizer of tokenizers) {
    if (tokenizer != null) {
      context.useTokenizer(tokenizer)
    }
  }

  return (content: string): BlockTokenizerParsePhaseStateTree => {
    const codePositions = calcDataNodeTokenPointDetail(content)
    const startIndex = 0
    const endIndex = codePositions.length

    const preMatchPhaseStateTree = context.preMatch(codePositions, startIndex, endIndex)
    const matchPhaseStateTree = context.match(preMatchPhaseStateTree)
    const postMatchPhaseStateTree = context.postMatch(matchPhaseStateTree)
    const preParsePhaseTree = context.preParse(postMatchPhaseStateTree)
    const parsePhaseMetaTree = context.parse(postMatchPhaseStateTree, preParsePhaseTree)
    return parsePhaseMetaTree
  }
}
