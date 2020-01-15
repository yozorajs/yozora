import { TextTokenizer } from '../src/data-node/inline/text'


const tokenizer = new TextTokenizer({} as any, 1)
const results = tokenizer.match('content')
console.log('results:', results)
