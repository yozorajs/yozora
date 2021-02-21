> See [Yozora document][yozora-docs] for more details.

## What is "yozora" ?

The name ***yozora*** is the Roman sound of Japanese ***よぞら***, taken from the
lyrics of the song ***"花鳥風月"*** by the band ***Sekai no Owari***.

Yozora is a monorepo that contains a pluggable markdown parser kernel
[@yozora/parser-core][] and several implemented tokenizers such as
[@yozora/tokenizer-autolink][] for resolving the specific tokens..

## Usage

Yozora provides a parser ***[@yozora/parser-gfm][@yozora/parser-gfm]*** that
implements all the specifications mentioned in the
***[Github Flavor Markdown Spec][gfm-spec]***.

```typescript
import { createExGFMParser } from '@yozora/parser-gfm'

const exParser = createExGFMParser()
exParser.parse('markdown content')
```

See the [API doc][@yozora/parser-gfm] for more details.


## Contact

  * [Github issues](https://github.com/guanghechen/yozora/issues)


## License

  Yozora is [MIT licensed](https://github.com/guanghechen/yozora/blob/master/LICENSE).


[gfm-spec]: https://github.github.com/gfm/
[yozora-docs]: https://yozora.guanghechen.com/docs
[@yozora/parser-core]: https://yozora.guanghechen.com/docs/package/parser-core
[@yozora/parser-gfm]: https://yozora.guanghechen.com/docs/package/parser-gfm
[@yozora/tokenizer-autolink]: https://yozora.guanghechen.com/docs/package/tokenizer-autolink
