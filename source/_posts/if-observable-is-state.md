layout: post
title: "如果 Observable 本身就是 UI state"
date: 2020-8-21
---

# 什么是 Observable
目前 JavaScript 中还没有内置 Observable，RxJS 是常用的 Observable 的实现。从 RxJS 的定义中，我们可以初步了解 Observable

  {% asset_img 1.png %}

RxJS 定义了 value（值）的产生的个数：single & multiple；value 的传递方式：pull & push。Observable 补齐了其中的 multiple x push 象限。

[A General Theory of Reactivity](https://github.com/kriskowal/gtor) 对 Observable 的定义有些不同：

  | | Singular | Plural |
  |-|----------|--------|
  | Spatial | Value | Iterable<Value> |
  | Temporal | Promise<Value> | Observable<Value> |

不是从 value 的传递方式来区分，而是从“时空”上来区分，这与开发者常接触的“同步和异步”概念更加贴近。Observable 补齐了其中的“复数值 x 时间”象限。

## Promise 是 Observable 的特例
从以上两种定义看来，Promise 是 Observable 的单值特例。
  {% asset_img 2.svg %}


# 一切都是 Value
如果我们把 Iterator Promise Observable 都看作 value 会怎样呢？ 

这听起来有些奇怪，因为通常我们需要用 .next 或 .then 方法来能获取到 value，Iterator Promise Observable 更像是 value wrapper（值的包装器）。

在如今的 JavaScript 中，我们可以通过以下的方式来访问 value wrapper 中的 value：

| |传统的取值|现代的取值|
|-|---------|--------|
|Array & Iterator | for (const index in array) console.log(array[index]) | for (const item of iterator) console.log(item); |
|Value & Promise | const item = value; | const item = await promise; |
|Array & Observable | for (const index in array) console.log(array[index]) | for await (const item of observable) console.log(item);|

现代 JavaScript 的迭代 & 异步原语，让访问 Iterator Promise Observable 内部的 value 和直接访问 value 一样简单。这使得 value wrapper 和 value 的边界变得模糊，激进地，我们可以认为 value wrapper 和 value 等价。

## 渲染 Promise & Observable
如果按照“时空”来划分 value，UI 库则可以直接渲染其中的 spatial value（空间值），例如 React 可以直接渲染 string、array、object 等。通常不能直接渲染 temporal value（时间值 Promise & Observable）原因是 pending 状态的渲染需要由业务来决定。当为 UI 库增加业务上的 temporal value 适配层后，在业务上就可以进行 temporal value 的渲染了。

若将视图代码分为 biz、biz UI components、pure UI components 三层，biz UI components 将会承接较多业务，会接收 temporal value 属性，例如 axios 的响应、search 条件的实时变化事件。pure UI components 与业务无关，几乎只接受 spatial value 属性。

  {% asset_img 3.svg %}

其中 Promise & Observable 适配器典型的实现有：

- vue-async-computed
- vue-promised
- react suspense
- react-refetch
- react-use-promise
- vue-rx
- rx-react

## 用 Promise & Observable 来描述业务
Promise 可以很好地描述一个调用过程：
1. 不确定的返回时间（value 通过 pull 机制传递）
2. 可能成功
3. 可能失败
4. 可能被取消；这部分的[标准还在制定中](https://github.com/tc39/proposal-cancellation)，blurbird 已有相应的[实现](http://bluebirdjs.com/docs/api/cancellation.html)
5. 调用可组合：多个 Promise 可以使用 all race 等方法进行组合，Promise 内部也可以调用其他 Promise

Observable 可以描述一个业务过程：

1. 不确定的结束时间（value 通过 pull 机制传递）
2. 可能成功
3. 可能失败
4. 可能被取消
5. 期间会产生很多事件和值
6. 业务可以组合：多个 Observable 可以用 Observable 操作符灵活地组合

将业务抽象为 Promise & Observable，可以很容易的对业务进行测试和埋点。

对 Observable 的测试主要是测试其 pushed value 和 pulled value 的映射关系。脱离实际的渲染和交互逻辑后，我们可以方便地模拟 push value 的过程，也能对 pulled value 完成断言。

  {% asset_img 4.svg %}


对 Observable 的埋点可以简化为以下流程：

```
observable = createObservable(); /* 业务开始，通常与 UI 初始化事件绑定 */
//...
subscription = observable.subscribe({
  next(x) { /* 事件埋点 */ },
  error(err) { /* 业务失败 */ },
  complete() { /* 业务完成 */ }
});
//...
subscritption.unsubscribe(); /* 业务取消，通常与 UI 销毁事件绑定 */
```

# 响应式 UI 的真相: 从 UI = f(state) 到 App = f(Observable<state>)
React 对前端普及了 UI = f(state) 的理念。让我们从编写 UI 控制器“进化”到编写 state（view model）和 render function。

要成为 App，就要让 UI 动起来，也就是要 state 变化起来。利用“单向数据流”机制，state 的单次更改变得容易追踪。

  {% asset_img 5.svg %}

但是在现实世界中，state 会因为各种事件被无数次更改，事件之间的关系管理成为了新的问题：

- 事件之间的依赖较难处理，通常需要额外的“锁”状态
- 事件发生与结果难以保证顺序一致，需要较复杂的额外机制来保证

  {% asset_img 6.svg %}

如何管理复杂的事件流程，React 等 UI 库并没有给出答案。

若将 state 扩展为“随时间一直产生 state 的 Observable”，UI = f(state) 则“进化”为可以动起来的 App：

```
App = f(observable: Observable<state>) {
  for await (const state of observable) {
    UI = f(state)
  }
}
```

  {% asset_img 7.svg %}

# 如果 Observable 成为语言标准
[Observable 提案](https://github.com/tc39/proposal-observable)的目前状态为 stage 1。当初 ES2015 的 Promise 解决了“异步回调地狱”的问题，结合 ES2017 的 async/await 彻底“杀死”了异步回调。假若 Observable 进入标准，结合 ES2018 的 asynchronous iteration 必将彻底重构事件的处理方式：大部分事件都将抽象为 Observable，与普通 Iterator 一样被处理。有语言标准的背书，Observable 的生态也将更加繁荣，长期来看会比其他事件处理方案会更有优势。