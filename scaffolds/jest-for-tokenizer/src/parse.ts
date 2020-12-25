import {
  DataNodeType,
  calcDataNodeTokenPointDetail,
} from '@yozora/tokenizercore'
import {
  BlockDataNodeType,
  BlockTokenizer,
  BlockTokenizerContext,
  BlockTokenizerParsePhaseState,
  BlockTokenizerParsePhaseStateTree,
  BlockTokenizerPostParsePhaseHook,
  DefaultBlockTokenizerContext,
  FallbackBlockTokenizer,
} from '@yozora/tokenizercore-block'
import {
  DefaultInlineTokenizerContext,
  FallbackInlineTokenizer,
  InlineDataNode,
  InlineDataNodeType,
  InlineTokenizer,
  InlineTokenizerContext,
  InlineTokenizerParsePhaseStateTree,
  RawContent,
} from '@yozora/tokenizercore-inline'
import {
  JsonFileUseCaseMaster,
  JsonFileUseCaseItem,
} from './util/json-file-case-master'


type ParseFunc = (content: string) => (
  | BlockTokenizerParsePhaseStateTree
  | InlineTokenizerParsePhaseStateTree
)


/**
 * Output data type
 */
type OutputData = (
  | BlockTokenizerParsePhaseStateTree
  | InlineTokenizerParsePhaseStateTree
)


export class TokenizerParseUseCaseMaster
  extends JsonFileUseCaseMaster<OutputData, OutputData> {
  protected readonly parse: ParseFunc

  public constructor(
    parse: ParseFunc,
    caseRootDirectory: string,
    answerField = 'parseAnswer',
  ) {
    super(caseRootDirectory, answerField)
    this.parse = parse
  }

  /**
   * @override
   * @see JsonFileUseCaseMaster#consume
   */
  public async consume(inputItem: JsonFileUseCaseItem): Promise<OutputData | never> {
    const { input } = inputItem
    const answer = await this.parse(input)
    return answer
  }

  /**
   * @override
   * @see JsonFileUseCaseMaster#toJSON
   */
  public format(data: OutputData): OutputData {
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
  fallbackTokenizer: FallbackInlineTokenizer | null,
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
  fallbackTokenizer: FallbackBlockTokenizer,
  blockTypesToDeepParse: BlockDataNodeType[],
  ...tokenizers: BlockTokenizer<DataNodeType>[]
): { context: BlockTokenizerContext, parse: ParseFunc } {
  const inlineDataTokenizer: BlockTokenizer & BlockTokenizerPostParsePhaseHook = {
    name: '__inline-data__',
    priority: 0,
    uniqueTypes: [],
    transformParse: (meta, states) => {
      return states.map(o => {
        const u = o as BlockTokenizerParsePhaseState & { contents: any[] }
        if (!blockTypesToDeepParse.includes(u.type) || !Array.isArray(u.contents)) return u

        const inlineDataNode = {
          type: 'TEXT',
          content: u.contents
            .slice(0, u.contents.length)
            .map(c => String.fromCodePoint(c.codePoint))
            .join(''),
        } as InlineDataNode

        u.contents = [inlineDataNode]
        return u
      })
    }
  }

  const context = new DefaultBlockTokenizerContext({ fallbackTokenizer })
  for (const tokenizer of tokenizers) {
    if (tokenizer != null) {
      context.useTokenizer(tokenizer)
    }
  }
  context.useTokenizer(inlineDataTokenizer)

  const parse = (content: string): BlockTokenizerParsePhaseStateTree => {
    const codePositions = calcDataNodeTokenPointDetail(content)
    const startIndex = 0
    const endIndex = codePositions.length

    const preMatchPhaseStateTree = context.preMatch(codePositions, startIndex, endIndex)
    const matchPhaseStateTree = context.match(preMatchPhaseStateTree)
    const postMatchPhaseStateTree = context.postMatch(matchPhaseStateTree)
    const preParsePhaseTree = context.preParse(postMatchPhaseStateTree)
    const parsePhaseStateTree = context.parse(postMatchPhaseStateTree, preParsePhaseTree)
    const postParsePhaseStateTree = context.postParse(parsePhaseStateTree)
    return postParsePhaseStateTree
  }

  return { context, parse }
}
