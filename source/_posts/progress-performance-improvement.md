layout: post
title: "渐进式的首屏优化方案之概述"
date: 2018-8-9
tags: react
---

首屏载入速度是 web 应用的是个重要性能指标。页面的载入阶段分为 1.白屏 2.首次渲染 3.首次有意义的/可交互的渲染，首屏优化则是减小 1 和 2 所占的时间，让用户更早的可以看到内容并能与之交互。本文主要讨论无缓存情况下的白屏时间优化。

<!--more-->

## 1. 白屏

白屏时间是浏览器发起请求到首次渲染所占的时间。它主要由 DNS 解析的时间，HTTP 连接建立的时间，服务器响应处理时间，TCP 传输延时，首屏代码传输的时间构成，同时它还受可渲染内容在 HTML 中的位置所影响。

其中代码可以控制的部分有服务器响应处理时间，首屏代码传输时间，可渲染内容在 HMTL 中的位置。

### 1.1 header flush 和 chunked encoding

一般来说，网页服务器会在响应完全准备好后再一次性发送给客户端。这是便于处理 HTTP code 和 content length。若是将客户端和服务器看作一个统一的系统，则会发现其中不太合理的地方，即没有把响应拆成多个流水线步骤，导致服务器在准备页面的时候，客户端完全无事可做！

实际上，服务器在准备动态页面的时候，会有查询数据库和其他服务器的开销。在获得结果之前，服务器可以通过 header flush 将 HTTP 头发送给客户端，再通过 chunked encoding 以“流”的形式将一些静态的数据发送给客户端，比如 HTML head，部分的 body，关键渲染路径上的 css 和 js。这样客户端可以一边处理已接收到的数据，服务器一边组织剩余部分的数据。

使用 header flush 到问题在于一旦服务器出错，无法更正已发出的 HTTP code 了，如果需要处理错误，需要借助于客户端的能力。例如可以发送 `<script>window.location.href="/error.html";</script>` 让客户端进行错误页面的跳转。

### 1.2 代码拆分和并行下载

将代码进行拆分，通过并行下载，可能更快地下载首屏代码。由于浏览器对同一域名的并发连接数限制，与网络环境不良时建立 HTTP 连接的开销很大，这让代码下载的并行度并不太好控制。对于移动端浏览器，经常会有不拆分反而是合并首屏代码的情况。[webpack 按组件进行代码分割和合并](http://ladjzero.github.io/blog/2018/06/12/split-and-combine-component-code/) 中有对一个简单的拆分与合并的场景的解释。

### 1.3 可渲染内容优先于 js

可渲染内容在 HTML 中的位置对于首次渲染影响很大。如果首次渲染用于显示 loading 指示器，需要将其尽可能的提前，所以 loading 指示器这部分代码需要放置于 js 前面，以免被 js 下载和执行阻塞显示。

## 2. 首次渲染

首次渲染对于 webapp 来说一般是 loading 指示器等非实际的内容。如果应用的首次可交互渲染时间较长，使用首次渲染可以很好地安抚用户。如果不长，首次渲染的意义不大，甚至可能会由反效果。这个需要具体情况具体分析。

### 2.1 skeleton screen

skeleton screen 即骨架屏，它比单纯的 loading 指示器更接近最终的渲染结构。将组件一一渲染出来，将动态内容懒加载并临时用占位符显示，所以体验上会更好。这个课题可以单独研究。

### 2.2 server side rendering

SSR，即服务端渲染，与骨架屏相比，更进一步，直接将动态内容在服务端渲染成为可直接显示的 HTML 来传送给客户端进行显示。其好处在于无需等待客户端的 js 加载执行，就能显示出最终的界面效果。当然，SSR 听起来很有吸引力，但是技术成本更大，甚至会对现有项目的代码组织结构有所冲击。SSR 是较为复杂的内容，这个课题可以单独研究。

## 3. 渐进式拆分

使用 [webpack 的代码分割功能](https://webpack.js.org/guides/code-splitting/) 可以轻松地将板结在一起的代码解开。在此之上，可以很容易地做到按需加载，以此来剔除掉首屏非关键路径上的代码。

### 3.1 异步加载

代码分割的一个直接后果是，引入了异步逻辑。对于 react 组件，可以使用

```
class AsyncComponent extends Component {
  constructor(props) {
    super(props);

    this.state = { Comp: null }
    import('./my_component').then(module => setState({ Comp: module }))
  }

  render() {
    const { Comp } = this.state;

    return Comp ? <Comp /> : null;
  }
}
```
类似的代码来处理异步加载的模块，并阻断异步逻辑向外的传播。

### 3.2 异步与 SSR

SSR 渲染是一个同步的过程，简单来说，react 的 SSR 仅渲染应用的首次 render 返回的节点树。上面的例子中，AsyncComponent 在 SSR 渲染下会返回 null 对应的 HMTL 代码。所以异步加载与 SSR 是冲突的。不过这句话说对了一半，如果 react 组件的内部没有异步加载代码的逻辑，它所需要的异步组件可以被预加载的话，也是可以做到 SSR 的。[react-loadable](https://github.com/jamiebuilds/react-loadable) 的 v5 版本提供了这样的能力，通过其提供的 babel 和 webpack 插件，react-loadable 可以通过分析构建出来的 chunk 清单来计算出可能被使用到的 chunk 文件信息。预加载这些 chunk，可以让 react-loadable 无需网络 IO 就可以直接渲染真正的组件。

## 总结

首屏优化其实还是一个蛮复杂的问题，总的突破点我认为有三。

其一，用尽各种手段减小首屏关键路径上的代码体积，包含但不仅含移除非关键代码、uglify、gzip。
其二，客户端和服务端看为一体，运用好渲染流水线，不能让客户端闲着。
其三，可显示的内容先于可交互的内容，利用 loading 指示器，skeleton screen，SSR 进一步缩减白屏。

除此以外，还需要运维的帮助，来缩短用代码解决不到的白屏时间，例如通过 DNS 预热来缩短 DNS 解析时间。