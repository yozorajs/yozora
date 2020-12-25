import { calcDataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BlockDataNodeType,
  BlockTokenizer,
  BlockTokenizerContext,
  BlockTokenizerMatchPhaseStateTree,
  DefaultBlockTokenizerContext,
  FallbackBlockTokenizer,
} from '@yozora/tokenizercore-block'
import {
  DefaultInlineTokenizerContext,
  FallbackInlineTokenizer,
  InlineDataNodeType,
  InlineTokenizer,
  InlineTokenizerContext,
  InlineTokenizerMatchPhaseStateTree,
  RawContent,
} from '@yozora/tokenizercore-inline'
import {
  JsonFileUseCaseMaster,
  JsonFileUseCaseItem,
} from './util/json-file-case-master'


type MatchFunc = (content: string) => (
  | BlockTokenizerMatchPhaseStateTree
  | InlineTokenizerMatchPhaseStateTree
)


/**
 * Output data type
 */
type OutputData = (
  | BlockTokenizerMatchPhaseStateTree
  | InlineTokenizerMatchPhaseStateTree
)


export class TokenizerMatchUseCaseMaster
  extends JsonFileUseCaseMaster<OutputData, OutputData> {
  protected readonly match: MatchFunc

  public constructor(
    match: MatchFunc,
    caseRootDirectory: string,
    answerField = 'matchAnswer',
  ) {
    super(caseRootDirectory, answerField)
    this.match = match
  }

  /**
   * @override
   * @see JsonFileUseCaseMaster#consume
   */
  public async consume(inputItem: JsonFileUseCaseItem): Promise<OutputData | never> {
    const { input } = inputItem
    const answer = this.match(input)
    return answer
  }

  /**
   * @override
   * @see JsonFileUseCaseMaster#toJSON
   */
  public format(data: OutputData): OutputData {
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
  fallbackTokenizer: FallbackInlineTokenizer | null,
  ...tokenizers: InlineTokenizer<InlineDataNodeType>[]
): { context: InlineTokenizerContext, match: MatchFunc } {
  const context = new DefaultInlineTokenizerContext({ fallbackTokenizer })
  for (const tokenizer of tokenizers) {
    if (tokenizer != null) {
      context.useTokenizer(tokenizer)
    }
  }

  const match = (content: string, meta?: any): InlineTokenizerMatchPhaseStateTree => {
    const codePositions = calcDataNodeTokenPointDetail(content)
    const startIndex = 0
    const endIndex = codePositions.length

    const rawContent: RawContent = { codePositions, meta }
    const matchPhaseStateTree = context.match(rawContent, startIndex, endIndex)
    const postMatchPhaseStateTree = context.postMatch(rawContent, matchPhaseStateTree)
    return postMatchPhaseStateTree
  }

  return { context, match }
}


/**
 * map BlockDataNodeTokenizer to MatchFunc
 * @param tokenizer
 */
export function mapBlockTokenizerToMatchFunc(
  fallbackTokenizer: FallbackBlockTokenizer,
  ...tokenizers: BlockTokenizer<BlockDataNodeType>[]
): { context: BlockTokenizerContext, match: MatchFunc } {
  const context = new DefaultBlockTokenizerContext({ fallbackTokenizer })
  for (const tokenizer of tokenizers) {
    if (tokenizer != null) {
      context.useTokenizer(tokenizer)
    }
  }

  const match = (content: string): BlockTokenizerMatchPhaseStateTree => {
    const codePositions = calcDataNodeTokenPointDetail(content)
    const startIndex = 0
    const endIndex = codePositions.length

    const preMatchPhaseStateTree = context.preMatch(codePositions, startIndex, endIndex)
    const matchPhaseStateTree = context.match(preMatchPhaseStateTree)
    const postMatchPhaseStateTree = context.postMatch(matchPhaseStateTree)
    return postMatchPhaseStateTree
  }

  return { context, match }
}
