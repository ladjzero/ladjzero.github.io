layout: post
title: "defer 脚本的执行顺序"
date: 2019-3-14
tags:
---

{% asset_img deferasync.png %}

以下代码的输出顺序是什么？顺序是稳定的吗？

```html
<html>
<body>
  <script defer async src="defer.js"></script>
  <script src="index.js"></script>
</body>
</html>
```

```javascript
// defer.js
console.log(document.readyState, 'defer.js');
```

```javascript
// index.js
console.log(document.readyState, 'index.js');
```


<!--more-->

这个问题来源于这样的场景：index.js 是主程序入口，defer.js 是扩展组件，index.js 需要通过观察 script 标签知晓可能加载的扩展组件会，但是不被扩展组件的加载阻塞。

# 结果

在 Firefox 或 Chrome 中不断的刷新页面，可能得到的输出结果为

```
loading defer.js
loading index.js
```

或

```
loading index.js
interactive defer.js
```

# defer

[HTML spec](https://www.w3.org/TR/html52/semantics-scripting.html#element-attrdef-script-defer) 将有 defer 属性的脚本描述为 “be fetched in parallel and evaluated when the page has finished parsing”。

[MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) 中则描述为 “be executed after the document has been parsed, but before firing DOMContentLoaded.”

可以肯定的是，defer 脚本会在文档解析完成后才会执行。由于同步脚本会阻塞文档解析，上例中 `<script src="index.js"></script>` 执行完成后，`<body>` 元素才能闭合，整个文档才能解析完成。

所以 `index.js` 应当比 `defer.js` 更先执行。

# 同时使用 async 和 defer

经过上面的分析，会发现第一种输出结果是不符合预期的。因为 `defer.js` 属性除了 defer 还有 async，是 async 影响了最终的执行顺序。

async 和 defer 可以一起使用，这种用法也非常常见。这种写法可以在新旧浏览器上实现外部脚本的非阻塞下载。对于现代浏览器上，async 的优先级更高。对于老旧浏览器，由于无法识别 async，则会 fallback 到 defer。

正是如此，在 Firefox 或 Chrome 中 `<script defer async src="defer.js"></script>` 等价于 `<script async src="defer.js"></script>`。将 async 去掉后，执行结果变为稳定的

```
loading index.js
interactive defer.js
```

由 [Chris Moschini](https://stackoverflow.com/a/10731231/1413893) 提供的信息显示，defer 的行为在不同的浏览器上也会有些许差异（这很有可能，但需要进一步详细地验证），最好利用 DOMContentLoaded 事件，而非利用 defer 特性，来控制脚本的执行时机。

# 结论

async defer 的解析文章网络已经有很多了，而且 async defer 一起使用也很常见。

在我的固有印象中，defer 比 async 更“高级”，所以优先级更高。因为除了让脚本的加载不会阻塞页面解析，defer 还可以保证脚本在文档解析完成后，按照定义顺序依次执行。当发现效果不符合预期，难以直接从网络上的问答和文章中找到真相（因为更多是特性介绍），也难以否定固有印象，导致不能顺利地解决问题。

事先摒除固有印象，并从一手资料寻找答案，问题则可以被更直接地解决。实际上在 [HTML spec](https://www.w3.org/TR/html52/semantics-scripting.html#element-attrdef-script-defer) 中有详细描述 async 和 defer 的关系

> For classic scripts, if the async attribute is present, then the classic script will be fetched in parallel to parsing and evaluated as soon as it is available (potentially before parsing completes). If the async attribute is not present but the defer attribute is present, then the classic script will be fetched in parallel and evaluated when the page has finished parsing. If neither attribute is present, then the script is fetched and evaluated immediately, blocking parsing until these are both complete.

写作代码来看就是

```javascript
if (isAsync) {
  loadAsAsync();
} else if (isDefer) {
  loadAsDefer();
} else {
  loadAsSync();
}
```
