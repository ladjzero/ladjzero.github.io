layout: post
title: "事件回调函数，破坏前端业务组织的万恶之源"
date: 2020-9-30
---

# 前端的业务

前后端分离的开发模式下，前端本质上业务系统剥离出来的视图系统，主要处理用户参与的部分业务，即 UI 业务。

非常典型的前端应用是 webapp，在 UI 复杂度和业务复杂度的四象限中，webapp 的业务复杂度低，但 UI 复杂度高。

{% asset_img 0.svg %}

<!--more-->

## 弱业务的属性

对于前端，无论是采用何种 MV* 范式，其中 Model 往往都不是指业务领域的 Model。因为前端所谓的 Model，绝大部分情况下是后端的 View Model。业务领域的 Model 和相关的业务流程绝大部分情况对前端来说是黑盒，这是前后端分离架构所决定的。

进一步地，前端甚至可抛弃掉与后端 View Model 映射的 Model 层，原因在于：

1. 增加了前后端的对齐成本

2. 与 API service 函数相比，受益不明显

3. 在有良好 API 规范的情况下，例如 RESTful 或 GraphQL，API service 函数也显得多余

## 强业务的现实

由于 Model 的弱化，前端对业务的处理往往在 View 中一并完成了。

随着业务的复杂性增高，渗透到前端的业务也可能变得更复杂。试图在 View 中同时解决 UI 复杂度和业务复杂度，很可能因 UI 交互和业务流程互相交叉，代码结构变得混乱，导致两个问题都解决不好。

在此情况下，必须优先降低其中一个复杂度：

1. 降低业务复杂度，避免后端的业务流程渗透到前端

2. 降低 UI 实现的复杂度，使用足以面对复杂场景的新范式

在快速的市场变化中，为了满足产品的快速交付，部分后端业务可能会“临时”放到前端。这从项目整体的效果来看有可以是更优的。不过临时方案一旦上线，就成了固定方案了，使得前端不断积累业务逻辑。推进“临时方案”的重构可能因为团队组织结构的问题会不太容易实施，所以“降低 UI 实现的复杂度”可能是更“现实”的方案。

# 前端业务组织的关键

流程图是一种实用的流程设计工具。它非常容易被理解，同时也很容易转换为代码。但是在前端开发中，编写出可以与流程图对应的代码却十分不易，其主要的原因就是事件回调函数。因为它们由 UI 框架来调度，

1. 使得业务代码无法利用 for break goto 等编程语句来描述业务流程

2. 回调函数之间没有明确的因果关系

3. 回调函数之间无法直接传递数据，需要利用作用域很大的共享状态来局部的信息传递

{% asset_img 1.png %}

## 立即模式

绝大部分情况下，webapp 用于绘制 UI 的接口是 DOM，它是“保留模式（retained mode）”的 GUI 接口。这种模式的优势有：

1. 使用 widget tree 来编排 UI，对布局友好

2. widget 有自己的内部状态，简化用户代码的状态维护

3. 用户交互事件需要使用回调函数来处理，简化了事件目标的检测

随着 UI 复杂度的上升，“保留模式”提供的优势将逐渐不能覆盖其劣势。“立即模式（immediate mode）”则是不错的替代方案，这种模式的特点是：

1. 没有 widget 来映射 UI，内存占用不随 UI 复杂性显著上升

2. 绝大部分状态都需要用户代码来维护，渲染函数几乎都是无状态的

3. 需要在用户代码中实现 Event Loop，不需要回调函数来处理各种事件

> 立即模式的代码示例
> https://eliasnaur.com/blog/immediate-mode-gui-programming
> https://github.com/ocornut/imgui

## 受控组件和无状态组件

事件回调函数的主要作用是将组件内部的信息同步到外部。若去掉事件回调函数，组件内部的状态必须外移，或者完全受外部控制。

React 试图在 DOM 上实现大部分立即模式的编程体验，其核心理念是 view = render(state)。受控组件和无状态组件作为在 React 中提倡的实现方式，可以大大提升业务的可维护性。

## 事件即数据

Saga 和 Rxjs 都非常成熟的事件处理方案，前者的核心理念是 effects as data，后者是 events as data。在实际使用上，都可以使用各自的流程操作符处理事件流，区别在于 Saga 引入的是命令式处理风格，Rxjs 则是申明式风格。

这类“方案”的理念将事件回调函数退化为一个无任何业务逻辑的函数，令其作用仅仅是将 View 中发生的事件带入到“方案”的流程中，从而实现业务流程的“去事件回调函数化”。理论上也实现了立即模式中的“用户态” Event Loop。

## MVP 模式

MVP 是广泛应用在 Android 开发中的 MV* 模式，它将几乎将所有 View 的事件都代理到了 Presenter。在此模式下，业务流程可以完全集中在 Presenter 中编排。

{% asset_img 2.svg %}


# 现实中的案例

## Window.confirm

{% asset_img 3.png %}

若要使用 Vue 实现 confirm 效果，有两种方式：在模板中使用 confirm 组件，以及直接在流程代码中使用 confirm 函数。

```
<confirm :visible="visible" @ok="open('exit.html')">
  Do you really want to leave?
</confirm>

if (await confirm("Do you really want to leave?")) {
	window.open("exit.html", "Thanks for Visiting!");
}
```

第二种方式的好处是减少了 visible 状态的维护。

## 表单提交

```
<template>
	<div>
    <form @sumit="submit">
      <button type="submit" :disabled="disabled">提交</button>
    </form>
    <dialog :visible="id" @ok="ok" okText="查看">
    	创建成功
    </dialog>
  </div>
</template>
<script>
export default {
	data: {
  	disabled: false,
    formData: {},
    id: null,
  },
	methods: {
  	formValidate() { ... },                                      // formValidate 验证 view model 上的数据
    ok() {
    	router.push('/detail/' + this.id);
    },
    submit() {
    	if (this.disabled) return;
    
    	this.disabled = true;
      
      this.formValidate((err) => {
      	if (!err) {
        	fetch('/save', this.formData)
          	.then(resp => {
            	if (resp && resp.id) {
              	this.id = resp.id;
              }
            })
          	.catch(() => {
            	this.disabled = false;
            })
        }
      });
    }
  }
}
</script>
```
```
for await (const evt of this.submit$) {                              // submit$ 是提交按钮提交的事件流
  if (!await this.formValidate()) continue;                          // formValidate 验证 view model 上的数据

  const resp = await fetch('/save', this.formData).catch(() => null);

  if (resp && resp.id && await confirm('创建成功', { okText: '查看'})) {
    router.push('/detail/' + resp.id);
    return;
  }
}
```

第二种方式天然地免除了 disabled 状态的维护（仅做到方式重复提交），还简化了 id 的传递，避免维护“回调下上文状态”。因为 fetch 和 router.push 在同一个函数上下文中，利用作用域即可实现状态的共享。

# 总结

事件回调函数使前端的 UI 复杂度增高，立即模式是一种无事件回调函数的 GUI 接口模式。在保持模式的 DOM 上层，可以利用 React 之类的 UI 库和 Rxjs 之类的事件处理库，获得立即模式无事件回调函数的编程体验。利用 MVP 等范式，可以将所有业务都收拢于一处，利用编程语言的 if for goto 等控制语句，如同描述流程图一般地对其进行有效组织。

# 参考资料

[Immediate Mode GUI Programming](https://eliasnaur.com/blog/immediate-mode-gui-programming)
[Redux-Saga V.S. Redux-Observable](https://hackmd.io/@2qVnJRlJRHCk20dvVxsySA/H1xLHUQ8e)
[Gio](https://gioui.org/)
[Hacker News: Immediate Mode GUI](https://news.ycombinator.com/item?id=19744513)
