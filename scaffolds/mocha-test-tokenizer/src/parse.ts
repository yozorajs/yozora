import {
  DataNodeTokenPointDetail,
  DataNodeType,
  calcDataNodeTokenPointDetail,
} from '@yozora/tokenizercore'
import {
  BlockDataNodeMetaData,
  BlockDataNodeType,
  BlockTokenizer,
  BlockTokenizerContext,
  BlockTokenizerParsePhaseState,
  BlockTokenizerParsePhaseStateTree,
  DefaultBlockTokenizerContext,
} from '@yozora/tokenizercore-block'
import {
  DefaultInlineTokenizerContext,
  InlineDataNode,
  InlineDataNodeType,
  InlineFallbackTokenizer,
  InlineTokenizer,
  InlineTokenizerContext,
  InlineTokenizerParsePhaseStateTree,
  RawContent,
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
  fallbackTokenizer: InlineFallbackTokenizer | null,
  ...tokenizers: InlineTokenizer<InlineDataNodeType>[]
): { context: InlineTokenizerContext, parse: ParseFunc } {
  const context = new DefaultInlineTokenizerContext({ fallbackTokenizer })
  for (const tokenizer of tokenizers) {
    if (tokenizer != null) {
      context.useTokenizer(tokenizer)
    }
  }

  const parse = (content: string, meta?: any): InlineTokenizerParsePhaseStateTree => {
    const codePositions = calcDataNodeTokenPointDetail(content)
    const startIndex = 0
    const endIndex = codePositions.length

    const rawContent: RawContent = { codePositions, meta }
    const matchPhaseStateTree = context.match(rawContent, startIndex, endIndex)
    const postMatchPhaseStateTree = context.postMatch(rawContent, matchPhaseStateTree)
    const parsePhaseMetaTree = context.parse(rawContent, postMatchPhaseStateTree)
    return parsePhaseMetaTree
  }

  return { context, parse }
}


/**
 * map BlockDataNodeTokenizer to ParseFunc
 * @param tokenizer
 */
export function mapBlockTokenizerToParseFunc(
  fallbackTokenizer: BlockTokenizer | null,
  blockTypesToDeepParse: BlockDataNodeType[],
  ...tokenizers: BlockTokenizer<DataNodeType>[]
): { context: BlockTokenizerContext, parse: ParseFunc } {
  const parseInlineData = (
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    meta: BlockDataNodeMetaData,
  ): InlineDataNode[] => {
    const result = {
      type: 'TEXT',
      content: codePoints
        .slice(startIndex, endIndex)
        .map(c => String.fromCodePoint(c.codePoint))
        .join(''),
    } as InlineDataNode
    return [result]
  }

  const parseInlineContents = (o: BlockTokenizerParsePhaseState, meta: BlockDataNodeMetaData) => {
    const u = o as BlockTokenizerParsePhaseState & { contents: any[] }
    if (
      blockTypesToDeepParse.includes(u.type) &&
      Array.isArray(u.contents) != null
    ) {
      u.contents = parseInlineData(u.contents, 0, u.contents.length, meta)
      return
    }

    // recursively parse
    if (u.children != null) {
      for (const v of u.children) {
        parseInlineContents(v, meta)
      }
    }
  }

  const context = new DefaultBlockTokenizerContext({ fallbackTokenizer })
  for (const tokenizer of tokenizers) {
    if (tokenizer != null) {
      context.useTokenizer(tokenizer)
    }
  }

  const parse = (content: string): BlockTokenizerParsePhaseStateTree => {
    const codePositions = calcDataNodeTokenPointDetail(content)
    const startIndex = 0
    const endIndex = codePositions.length

    const preMatchPhaseStateTree = context.preMatch(codePositions, startIndex, endIndex)
    const matchPhaseStateTree = context.match(preMatchPhaseStateTree)
    const postMatchPhaseStateTree = context.postMatch(matchPhaseStateTree)
    const preParsePhaseTree = context.preParse(postMatchPhaseStateTree)
    const parsePhaseMetaTree = context.parse(postMatchPhaseStateTree, preParsePhaseTree)

    // deep parse
    if (blockTypesToDeepParse.length > 0) {
      parseInlineContents(parsePhaseMetaTree, preParsePhaseTree.meta)
    }

    return parsePhaseMetaTree
  }

  return { context, parse }
}
