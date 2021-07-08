<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/main/packages/core-tokenizer#readme">@yozora/core-tokenizer</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/core-tokenizer">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/core-tokenizer.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/core-tokenizer">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/core-tokenizer.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/core-tokenizer">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/core-tokenizer.svg"
      />
    </a>
    <a href="#install">
      <img
        alt="Module formats: cjs, esm"
        src="https://img.shields.io/badge/module_formats-cjs%2C%20esm-green.svg"
      />
    </a>
    <a href="https://github.com/nodejs/node">
      <img
        alt="Node.js Version"
        src="https://img.shields.io/node/v/@yozora/core-tokenizer"
      />
    </a>
    <a href="https://github.com/prettier/prettier">
      <img
        alt="Code Style: prettier"
        src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"
      />
    </a>
  </div>
</header>
<br/>


定义了 Yozora 分词器的类型和它的生命周期函数类型，以及一些用于辅助分词器完成解析
工作的工具函数。


## Install

* npm

  ```bash
  npm install --save @yozora/core-tokenizer
  ```

* yarn

  ```bash
  yarn add @yozora/core-tokenizer
  ```


## Usage

根据解析策略，一共有两类 tokenizer： 块分词器（Block Tokenizer） 和
内联分词器（InlineTokenizer）。 


### Block Tokenizer

块分词器的解析步骤分为三个生命周期：

* `match-block`: 匹配一个块节点，得到一个 `BlockToken`
* `post-match-block`: 过滤或合并同层级的块级节点 （目前实际上仅在 [@yozora/tokenizer-list][] 中使用到）
* `parse-block`: 将一个 `BlockToken` 解析成一个 YAST node

#### match-block phase

在解析块节点过程中是逐行读取内容的。块级数据存在嵌套结构：

```markdown {2}
> This is a blockquote
> - This is a list item in blockquote
> - # This is a setext heading in the list item of the blockquote
> - > ...
```

如上面代码第二行所示，在解析 [ListItem][@yozora/tokenizer-list-item] 时，并不能
获取原文档行内的首字符，而是顺着已有的嵌套结构等待它的祖先元素（如上面的
[Blockquote][@yozora/tokenizer-list-item]） 完成匹配后才能获得匹配机会。为了使得
分词器之间可以无感知的协调工作，在设计块级分词器在 `match-block` 阶段的生命周期
函数时，将嵌套结构的解析逻辑放在 [@yozora/core-parser][] 中，并使用一个数据结构
`PhrasingContentLine` 作为行的实际解析单元：

```typescript
export interface PhrasingContentLine {
  /**
   * Start index of interval in nodePoints.
   */
  startIndex: number
  /**
   * End index of interval in nodePoints.
   */
  endIndex: number
  /**
   * Array of NodePoint which contains all the contents of this line.
   */
  nodePoints: ReadonlyArray<NodePoint>
  /**
   * The index of first non-blank character in the rest of the current line
   */
  firstNonWhitespaceIndex: number
  /**
   * The precede space count, one tab equals four space.
   * @see https://github.github.com/gfm/#tabs
   */
  countOfPrecedeSpaces: number
}
```

此阶段的生命周期函数细分成下列函数（完整的类型定义见 [match-block][lifecycle-match-block]）：

* `eatOpener`: （必选）尝试匹配一个新的块节点。

* `eatAndInterruptPreviousSibling`: （可选）尝试打断前一个兄弟节点，并匹配一个新
  的块节点。

* `eatContinuationText`: （可选）尝试继续匹配当前块节点，即将此时的
  `PhrasingContentLine` 追加到当前块节点内。此阶段可能有很多种结果，根据返回结果
  中 `status` 的值来做区分：

  - `notMatched`: 未匹配到

  - `closing`: 匹配到且这是当前块节点的最后一行（即当前块节点处于饱和状态，马上
    要闭合了） 

  - `opening`: 匹配到，且还能继续匹配

  - `failedAndRollback`: 匹配失败，并且要回滚之前行的内容（为了方便起见，假设了
    回滚操作不影响此前已满足的嵌套结构）

  - `closingAndRollback`: 匹配失败，但只有最后一行需要回滚，当前节点仍是一个有效
    的节点且即将关闭

* `eatLazyContinuationText`: （可选）尝试匹配 Laziness Continuation Text，实际
  只有 [@yozora/tokenizer-paragraph][] 需要实现此方法，可参见 
  https://github.github.com/gfm/#phase-1-block-structure step3

* `onClose`: （可选）当前节点关闭前时被调用，用于执行一些清理操作

* `extractPhrasingContentLines`: （可选）将一个当前分词器产生的 Block Token
  转成 `PhrasingContentLines[]`，在匹配此类型节点可能出现回滚时才需要实现此方法

* `buildBlockToken`: （可选）将 `PhrasingContentLines[]` 转成一个 Block Token，
  在匹配此类型节点可能出现回滚时才需要实现此方法

#### post-match-block phase

此阶段的生命周期函数细分成下列函数（完整的类型定义见 [post-match-block][lifecycle-post-match-block]）：

* `transformMatch`: （必选）将 [match-block][lifecycle-match-block] 阶段得到的树
  中某一层级的兄弟节点转成新的块节点列表。实际上只在 [@yozora/tokenizer-list][]
  中实现了此生命周期函数

#### parse-block phase

此阶段的生命周期函数细分成下列函数（完整的类型定义见 [parse-block][lifecycle-parse-block]）：

* `parseBlock`: 将一个 Block Token 转成 Yast Node

---

### Inline Tokenizer

内联解析器的解析步骤分为两个生命周期

* `match-inline`: 匹配内联文本，得到一个 `InlineToken`
* `parse-inline`: 将一个 `InlineToken` 解析成一个 YAST node

#### match-inline phase

在一个块节点闭合后可以开始匹配内联节点，因此匹配内联节点时得到的是一个连续的文本，
没有“行”的概念。但是内联节点是存在优先级的，比如 link 比 emphasis 拥有更高的优先
级（可参见 https://github.github.com/gfm/#example-529）。为了使得分词器之间可以
无感知的协调工作，在设计内联分词器在 `match-inline` 阶段的生命周期函数时，将优先
级相关的逻辑放在 [@yozora/core-parser][] 中处理，每个分词器仅提供四种类型的分隔
符： `opener`, `both`, `closer`, `full`。然后由 [@yozora/core-parser][] 中的处理
器完成协调工作。

此阶段的生命周期函数细分成下列函数（完整的类型定义见 [match-inline][lifecycle-match-inline]）：

* `findDelimiter`: （必选） 找到一个分隔符
* `isDelimiterPair`: （可选） 检查给定的两个分隔符是否可以匹配
* `processDelimiterPair`: （可选） 处理匹配的两个分隔符。如 [@yozora/tokenizer-emphasis][]
* `processSingleDelimiter`: （可选） 处理单个分隔符。如 [@yozora/tokenizer-text][]

#### parser-inline phase

此阶段的生命周期函数细分成下列函数（完整的类型定义见 [parse-inline][lifecycle-parse-inline]）：

* `processToken`: （必选）将一个 Inline Token 转成 Yast Node

## Related

* [homepage][]

* [@yozora/template-tokenizer][] 用于快速创建一个 Yozora Tokenizer

* Block Tokenizer Lifecycle
  - [match-block][lifecycle-match-block]
  - [post-match-block][lifecycle-post-match-block]
  - [parse-block][lifecycle-parse-block]

* Inline Tokenizer Lifecycle
  - [match-inline][lifecycle-match-inline]
  - [parse-inline][lifecycle-parse-inline]



[homepage]: https://github.com/yozorajs/yozora/tree/main/packages/core-tokenizer#readme
[lifecycle-match-block]: https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/lifecycle/match-block.ts
[lifecycle-match-inline]: https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/lifecycle/match-inline.ts
[lifecycle-parse-block]: https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/lifecycle/parse-block.ts
[lifecycle-parse-inline]: https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/lifecycle/parse-inline.ts
[lifecycle-post-match-block]: https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/lifecycle/post-match-block.ts
[@yozora/core-parser]: https://www.npmjs.com/package/@yozora/core-parser
[@yozora/template-tokenizer]: https://www.npmjs.com/package/@yozora/template-tokenizer
[@yozora/tokenizer-emphasis]: https://www.npmjs.com/package/@yozora/tokenizer-emphasis
[@yozora/tokenizer-list-item]: https://www.npmjs.com/package/@yozora/tokenizer-list-item
[@yozora/tokenizer-list]: https://www.npmjs.com/package/@yozora/tokenizer-list
[@yozora/tokenizer-paragraph]: https://www.npmjs.com/package/@yozora/tokenizer-paragraph
[@yozora/tokenizer-text]: https://www.npmjs.com/package/@yozora/tokenizer-text
