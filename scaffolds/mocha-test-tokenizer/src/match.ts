import { calcDataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BlockDataNodeType,
  BlockTokenizer,
  BlockTokenizerContext,
  BlockTokenizerMatchPhaseStateTree,
  DefaultBlockTokenizerContext,
} from '@yozora/tokenizercore-block'
import {
  DefaultInlineTokenizerContext,
  InlineDataNodeType,
  InlineTokenizer,
  InlineTokenizerContext,
  InlineTokenizerMatchPhaseStateTree,
  RawContent,
} from '@yozora/tokenizercore-inline'
import {
  SingleFileTestCaseMaster,
  SingleFileTestCaseMasterProps,
  SingleTestCaseItem,
} from './util/single-file-case-master'


type PickPartial<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>
type MatchFunc = (content: string) => (
  | BlockTokenizerMatchPhaseStateTree
  | InlineTokenizerMatchPhaseStateTree
)


/**
 * 输出文件的数据类型
 */
type OutputData = (
  | BlockTokenizerMatchPhaseStateTree
  | InlineTokenizerMatchPhaseStateTree
)


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
  fallbackTokenizer: InlineTokenizer | null,
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
    const preMatchPhaseStateTree = context.preMatch(rawContent, startIndex, endIndex)
    const matchPhaseStateTree = context.match(rawContent, preMatchPhaseStateTree)
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
  fallbackTokenizer: BlockTokenizer | null,
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
