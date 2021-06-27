emphasis: **foo "*bar*" foo**

autolink(extension): http://example.com

autolink: <foo@bar.example.com>

Setext headings
=========

Task List Items (extension):

- [x] foo
  - [-] bar
  - [x] baz
- [ ] bim

> This is a blockquote
>
> with multiple lines.

```typescript
const a = 'a'
const b = 'b'
console.log('a + b:', a + b)
console.log('This is a typescript code snippets')
```

This is a math block:

$$\\lvert f(x)-A \\rvert = \\left\\lvert \\frac{x^2-1}{x-1}-2 \\right\\rvert = \\lvert x+1-2 \\rvert = \\lvert x-1 \\rvert  < \\epsilon$$

:::tip
> ### 将进酒
>
> 君不见黄河之水天上来，奔流到海不复回。
> 君不见高堂明镜悲白发，朝如青丝暮成雪。
> 人生得意须尽欢，莫使金樽空对月。
> 天生我材必有用，千金散尽还复来。
> 烹羊宰牛且为乐，会须一饮三百杯。
> 岑夫子，丹丘生，将进酒，杯莫停。
> 与君歌一曲，请君为我倾耳听。
> 钟鼓馔玉不足贵，但愿长醉不复醒。
> 古来圣贤皆寂寞，惟有饮者留其名。
> 陈王昔时宴平乐，斗酒十千恣欢谑。
> 主人何为言少钱，径须沽取对君酌。
> 五花马、千金裘，呼儿将出换美酒，与尔同销万古愁
:::

---

# heading1
## heading2
### heading3
#### heading4
##### heading5
###### heading6

---

This is a footnote ^[something....].

[^foo-2]: This is a footnote definition.

This is a footnote reference [^foo-2]

---

Definitions:

[foo]: /url "title"
[bar]: /bar "title2"
[baz]: /waw

[foo][bar][baz]
[foo] [bar][baz]
[foo][]

![foo][]

[foo](/url)
![foo](/url.jpg)
