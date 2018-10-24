layout: post
title: "React 的”调和“过程"
date: 2018-10-23
tags:
---

{% asset_img how-to-reconcile-broken-relationships-series-link.png %}

Reconcile 是个含义丰富的动词，有调和的意思，在 React 中其含义应当是 `to make consistent`，即”使一致“。

<!--more-->

# 1. Virtual DOM

Virtual DOM 是与真实 DOM 时刻同步的，用于描述 UI 的数据结构。

除了 React，仅仅针对于 Virtual DOM 存在许多其他实现，例如 [virtual-dom](https://github.com/Matt-Esch/virtual-dom)，[Snabbdom](https://github.com/snabbdom/snabbdom)，[simple-virtual-dom](https://github.com/livoras/simple-virtual-dom)。其他 React 兼容/模拟库，也有自己的 Virtual DOM 实现，例如 [preact](https://github.com/developit/preact), [inferno](https://github.com/infernojs/inferno)。

有别于 DOM，Virtual DOM 是不可变的（immutable）数据结构，对它的更新就用新的版本完全覆盖掉旧的版本。所以取代了命令式，它带来了声明式的 DOM 更新方式，让开发者摆脱了 DOM 操作的细节。潜在地，它还带来了 DOM 读写分离特性，即从 Virtual DOM 内存读，向 DOM 批量写（同步），这可以减少浏览器的不必要渲染。

Virtual DOM 实现往往还包括 diff 和 patch 方法。diff 用于比较两个 Virtual DOM 的差异，得到用于更新 DOM 的指令。而 path 则对 DOM 应用这些指令。

从 React 实现中的数据类型来讲，Virtual DOM 可以对应 ReactElement 数据类型。ReactElement 是纯数据类型，主要的属性有 type 和 props，其中 props 的 children 属性的可以是 ReactElement 和 ReactElement 数组。所以 ReactElement 可以组织成与 DOM 结构一一对应的 ReactElement Tree。

例如
```
{
  type: 'section',
  props: {
    className: 'detail',
    children: [
      {
        type: 'h1',
        props: {
          children: 'Title'
          style: {
            fontWeight: 'bold'
          }
        }
      },
      {
        type: 'p',
        props: {
          children: 'Content...'
        }
      }
    ]
  }
}
```
就与
```
<section class="detail">
  <h1 style="font-weight:bold">Title</h1>
  <p>Content</p>
</section>
```
等价。

# 2. 折叠 Virtual DOM Tree

使用 Virtual DOM Tree 来表达 DOM Tree 的好处是可以完全在 JavaScript 层面完成组件的封装。这比基于 HTML 模板的组件有更强大的逻辑表达能力，比 Web Components 的组件化技术有更好的兼容性。

形象地讲，基于 Virtual DOM 的组件化，就是将 Virtual DOM 的子树折叠成一个复合节点。折叠结构的选择主要基于对组件的直觉、代码复用性、单个结构的复杂度以及结构之间的逻辑耦合。

React 提供的 React.Component 和 React.PureComponent 接口，提供了用于”折叠“ Virtual DOM 的功能。

# 3. 展开 Virtual DOM Tree

内在地，当 React 要进行 Virtual DOM 到 DOM 的同步时，组件会被展开为能与 DOM 对应的简单节点。与负责折叠的 React.Component React.PureComponent 相对应，React 内部的 ReactCompositeComponent 则专门负责展开。”内外“组件实例的对应关系在 ReactInstanceMap 中维护。

React 内部有 ReactDOMComponent（通用名称是 ReactHostComponent）和 ReactCompositeComponent 类型，它们实现了 ReactElement 的渲染（挂载、更新和卸载）。其中 ReactDOMComponent 负责平台原生的简单节点的渲染，ReactCompositeComponent 则是负责折叠后的复合节点的渲染。

# 4. 调和 Virtual DOM 与 DOM

这里将 ReactDOMComponent 与 ReactCompositeComponent 统称做 ReactComponent。ReactComponent 内部维护了渲染的 DOM 节点的引用，_hostNode，以及子组件的引用，_renderedChildren 和 _renderedComponent。

ReactComponent 的 mountComponent，unmountComponent 和 updateComponent 方法实现了从 Virtual DOM 到 DOM 的同步。其中 mountComponent，unmountComponent 是相对较简单的递归过程，updateComponent 则复杂得多。

ReactDOMComponent 的 updateComponent 首先是要对 _hostNode 进行更新，然后对 _renderedChildren 中的节点进行更新。对于其中 key 和类型都相同的节点，进行递归调用其 updateComponent 完成更新；其他情况，需要使用 mountComponent 和 unmountComponent 来完成节点的增加、删除、替换和移动。

ReactCompositeComponent 的 updateComponent 则有些差异。若 key 和节点类型没有变化，则递归调用 _renderedComponent 的 updateComponent 完成更新，否则对 _hostNode 使用 unmountComponent 和 mountComponent 完成替换。

# 总结

React 并没有明确的 diff 和 patch 阶段。开发者利用 ReactComponent，可以把 Virtual DOM Tree 封装折叠起来。渲染时，Reconcile 过程将一边展开 ReactComponent，一边依据节点类型和 key 进行比较（diff），一边进行更新（patch），以保证 Virtual DOM 与 DOM 一致。
