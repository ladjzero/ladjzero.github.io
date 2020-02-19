layout: post
title: "理解 JavaScript 中的梗"
date: 2020-2-18
tags: JavaScript
---

{% asset_img javascript-memes.jpg %}

<!--more-->

1. typeof NaN === "number"

NaN 同 Number.NaN 一样，都是表示 Not A Number。从 Number.NaN 可以推测 NaN 是数字类型。

但实际上 NaN 不是 JavaScript 创造的。[IEEE 754](https://en.wikipedia.org/wiki/IEEE_754) 中将 NaN 定义为一种“特殊”的数字。

2. 9999999999999999 === 10000000000000000

JavaScript 中所有算数都是 IEEE 754 定义的双精度浮点数（[链接](https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type)），其可以表示的最大整数和浮点数分别在 JavaScript 中定义为 Number.MAX_SAFE_INTEGER（9007199254740991, 2^53-1） 和 Number.MAX_VALUE。

超出 9007199254740991 后，双精度浮点数只能表示偶数了，而且在不同范围内，步进还不相同。例如在 2^53 到 2^54，步进为 2。

```
> Number.MAX_SAFE_INTEGER
< 9007199254740991
> Number.MAX_SAFE_INTEGER + 1
< 9007199254740992
> Number.MAX_SAFE_INTEGER + 2
< 9007199254740992
> Number.MAX_SAFE_INTEGER + 3
< 9007199254740994
> Number.MAX_SAFE_INTEGER + 4
< 9007199254740996
> Number.MAX_SAFE_INTEGER + 5
< 9007199254740996
```

所以双精度浮点数无法表示 9999999999999999，只能将 9999999999999999 近似为 10000000000000000。

3. 0.1 + 0.2 != 0.3

同样是浮点数的问题。双精度浮点数除了不能准确表示 9999999999999999 之类的整数，也不能准备表示 0.1 之类的小数。

小数的加减法，往往都是“随缘”算法。将 0.1 到 0.5 的几个小数打印为二进制：

```
> (0.1).toString(2)
< "0.0001100110011001100110011001100110011001100110011001101"
> (0.2).toString(2)
< "0.001100110011001100110011001100110011001100110011001101"
> (0.3).toString(2)
< "0.010011001100110011001100110011001100110011001100110011"
> (0.4).toString(2)
< "0.01100110011001100110011001100110011001100110011001101"
> (0.5).toString(2)
< "0.1"
```

除了 0.5，其余几个在二进制下都是无限不循环小数，在浮点数表示法中都会损失精度。

4. Math.max() === -Infinity

这个其实不算是坑，如果是 Number.MAX_VALUE === -Infinity 那才算坑。可以将 Math.max 理解为有一个隐参数 -Infinity，决定了返回值的下限。

5. 加号问题

JavaScript 中加号有三个用途，一元运算符、二元运算符的算数加法和字符串拼接。无论是什么用途，都要求运算的值为**原始类型**，或可被转换成原始类型的对象。

依据**提示**，对象可转化为 string 或 number。提示分为 **string** 和 **number** 和 **default**，其中 default 会以 number 进行处理。在两元运算中，运算值既可以是 string 也可以是 number，所以转换的提示为 default。具体的转换还依赖于对象的 `toString` 和 `valueOf` 方法。详细的算法可以可以在[这里](https://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive)找到。

一些例子：

```
> ({ valueOf() { return 1 }}) + 1
< 2
> ({ toString() { return '2' }}) + 1
< "21"
> ({ valueOf() { return 1 }}) + ({ valueOf() { return 2 } })
< 3
> ({ toString() { return '2' }, valueOf() { return 1 } }) + 1
< 2
> ({ toString() { return '2' }, valueOf() { return 1 } }) + '1'
< "11"
```

所以 `[]+[]` => `""+""` => `""`;
`[]+{}` => `"" + "[object Object]"` => `"[object Object]"`。

当加号的左右的运算值都为基本类型，并且其中一个为 string，则会应用字符串拼接算法，否则应用算数加法。运算过程中还可能发生基本类型之间的隐式转换。

所以 `true+true+true` => `1+1+1` => 3；
`!+[]+[]+![]` => `(!+[])+[]+(![])` => `(!0)+[]+(![])` => `true+""+false` => `"truefalse"`。

这里比较费解的是，为何 `{}+[]` 等于 `0`？原因是这里的 `{}` 会识别为空语句块，从而 `+` 用作一元运算符，其含义是将运算值转换为 number。所以 `{}+[]` => `+[]` => `+""` => 0。

`{}` 识别为空对象还是空语句块，有一个**大体**的规则：若语句（statement）以 `{` 开头，则识别为语句块，否则识别为对象。当然生成中应当避免这类有歧义的写法，况且`{}`在各个 JavaScript 引擎中也有些差异，例如 `{}+{}` 在 Firefox 下可能输出 `NaN`，而在 Safari 下可能输出为 `"[object Object][object Object]"`

5. 相等问题

JavaScript 提供了 `==` 和 `===` 两个比较运算符。前者会将运算值转化为相同类型再应用 `===`，后者等价于 C Java 等编程语言中的 `==`。

所以 `==` 可以进行对象和原始类型的比较：

```
> 1 == { valueOf() { return  1 } }
< true
> 1 == { toString() { return  '1' } }
< true
> [] == 0
< true
```

值得一提的是，JavaScript 中还存在其他的比较算法 `SameValue` 和 `SameValueZero`。前者可通过 `Object.is` 来直接使用，后者可以通过 `Array.prototype.includes` 的方法来间接使用。

具体的例子如下：

```
> NaN == NaN
< false
> NaN === NaN
< false
> Object.is(NaN, NaN)
< true
> [NaN].includes(NaN)
< true
> Object.is(0, -0)
< false
> [0].includes(-0)
< true
```