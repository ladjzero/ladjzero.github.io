layout: post
title: "webpack 按组件进行代码分割和合并"
date: 2018-6-12
tags:
---

听起来很奇怪，对 react 组件进行分割，然后合并？

# 背景

假设一个系统中包含 100 种组件 C0,C1,...,C99。提供一个可序列化的描述清单，例如 ['C0', 'C5']，系统可以生成一个包含 C0 和 C5 的页面。一些公司使用类似的系统，用来配置一些简单的、变更可预计的页面，将编码转化配置。

<!--more-->
系统会维护一个组件字典，以便运行时通过组件名来引用对应的组件代码。

```
{
  C0: require('./C0.js'),
  C1: require('./C1.js'),
  ...
  C99: require('./C99.js')
}
```

使用 webpack 进行打包，在不做代码分割的情况下，C0 - C99 的代码也会被打包到整个 bundle。如果页面仅需要其中几个组件的代码，这样的打包方式会造成用户流量的大量浪费。

# 代码分割

通过动态 [import](https://github.com/tc39/proposal-dynamic-import) 可以让 webpack 自动地进行[代码分割](https://webpack.js.org/guides/code-splitting/#dynamic-imports)。

```
{
  C0: () => import('./C0.js'),
  C1: () => import('./C1.js'),
  ...
  C99: () => import('./C99.js')
}
```

这样，webpack 将为各个组件打包出对应的 chunk。这样，调用 `C0()` 可以得到一个可以“resolve 得到 C0 组件”的 Promise。由于采用了异步加载组件的方式，渲染 Cn 组件的代码也需要调整为异步的形式。

```
class Layout extends React.Component {
  constructor(props) {
    super(props)
    this.state = { Comp: null }

    getComponent(props.componentName)
      .then(module => this.setState({
        Comp: module.default,
      }))
  }

  render() {
    const { Comp } = this.state

    if (Comp) {
      return <Comp />
    } else {
      return null
    }
  }
}
```

这种方式可以避免下载与当前页面无关的代码，但是当页面组件较多时，会产生较多的请求。在弱网环境下，这是个严重的问题。

# 代码合并

可以将页面所需的组件代码，合并为一个文件，加塞到 html 中。这样可以只需一次请求，就可以获得当前所需的所有组件代码。

由于组件到组合时动态变化的，无法事先知道，从而无法在 webpack 构建阶段将组件代码合并。所以组件代码的合并时运行时发生的。

chunk file 默认以 chunk id 命名，通过指定 [webpackChunkName](https://webpack.js.org/guides/code-splitting/#dynamic-imports) 以及 `output.chunkFilename` 可以另 chunk file 以 chunkName 命名。

```
{
  C0: () => import(/* webpackChunkName: "C0" */'./C0.js'),
  C1: () => import(/* webpackChunkName: "C1" */'./C1.js'),
  ...
  C99: () => import(/* webpackChunkName: "C99" */'./C99.js')
}
```

```
{
  output: {
    chunkFilename: '[name].js'
  }
}
```


这样 webpack 将会输出 C0.js,...,C99.js 的 chunk file。server 通过页面描述 ['C0', 'C5']，可以从 dist 中找到 C0 和 C5 的组件代码，将其拼接后，再输出到 html 中，置于 main 代码之前。这样页面仅下载了 C0 C5 的代码，并且没有产生额外的网络请求。

# 注意事项

## chunk 丢失

如果 C0 依赖 C1，C0 和 C1 的代码则可能合并到一个 chunk 中，假设为 C0.js。当页面单独引用 C1 时，server 则无法正确地得到 C1 的代码文件。但是这并不会影响页面的工作，当 server 拼接组件代码异常时，会自动 fallback 到本来的 webpack 的异步加载方式。

## 页面跳转

如果通过前端路由，页面 ['C0', 'C5'] 跳转到 ['C0', 'C4', 'C6']，页面会通过 webpack 的异步加载方式自动地拉取 C4 和 C6 相关的 chunk file。所以以上的方案可以用于首屏优化，让首屏仅加载所需的组件代码。

## server 支持

合并代码需要 server 的支持，仅用 nginx 不行，可以再部署一个 node server。