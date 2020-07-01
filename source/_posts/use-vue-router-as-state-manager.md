layout: post
title: "你甚至可以用 Vue Router 来做状态管理"
date: 2020-7-1
tags:
---
# 引言
Vuex 是 Vue 生态中一个流行的状态管理工具，它与 React 生态中的 Redux 类似，有简单优雅的设计。

然而事情总不会完美，要体验 Vuex/Redux 的优雅却是需要付出代价的：

1. 可能面临大量的模板代码
2. 可能需要手动管理 Vuex/Redux 中数据的生命周期
3. 可能过多地暴露 view 的数据细节（因为 Vuex/Redux 上的数据是全局可访问的）

Vue Router 是 Vue 官方钦定的 SPA 路由实现。对它加以“妙用”，甚至可以实现简易的类似 Vuex 的状态管理。

<!--more-->

# URL 作为初始化状态
在讨论 SPA 之前，我们先回到传统的多页面应用场景。

在多页应用中，无论对于服务端还是客户端，页面 URL 是个非常重要的初始化信息。因此页面之间的流转，状态主要都是通过 URL 来进行传递。这是一个非常简单且有效的机制，带来两个好处：

1. 用户刷新页面后，页面可以回到当前页面的初始状态
2. 使用相同的 URL 可以获得相同的页面初始状态，有助于问题排查

{% asset_img drawio.svg %}

# SPA 中利用 URL 来管理状态
如果在 SPA 中使用 URL 来传递页面之间（或组件之间）的流转信息，还能额外获得的好处：

1. 获得了一个很显式的、很容易 debug 的机制，来解除页面之间、组件之间交互的耦合
2. 将长流程分解为可以“暂存”的短流程，降低流程逻辑的复杂性
3. 获得了组件间的通信能力
4. URL 与页面的生命周期同步

## 解耦组件交互
给一个简单的页面，包含一个“搜索框”和“结果列表”：

{% asset_img "drawio (1).svg" %}

两者的组织关系可以有：

1. 直接引用：Search 组件获得 Results 组件的“引用”，直接发送 keyword 信息来命令 Results 组件获取查询列表；这是一种很差的设计方式，组件耦合严重，Results 还泄露了内部抽象
2. 有状态的容器组件：Search 和 Results 组件由容器组件管理，容器组件获得 Search 组件输出的 keyword 信息，再输出给 Results 组件；这很不错，是典型的组件通信方式
3. 路由：Search 组件将 keyword 发送到 URL 上，Results 组件响应 URL 的变化，获得其中的 keyword 信息；这种方式的好处是

    a. 无需一个有状态的容器组件
    
    b. keyword 信息不在内存中，而是直观地展现在 URL 上

{% asset_img "drawio (2).svg" %}

## 长流程拆解为短流程
给一个长业务流程，其中包含子流程 A B C：
{% asset_img "drawio (3).svg" %}

流程之间的跳转需要额外的信息，例如 A → B 需要 order id，B → C 需要 customer id。如果跳转信息记录在内存中，会导致 B C 流程无法单独测试，都必须先从 A 流程开始，依次流转到 B C。

{% asset_img "drawio (4).svg" %}

若将 order id 和 customer id 记录在 URL 中，则流程 A B C 都可以进行单独测试，降低了整个流程的测试难度。

## 组件间通信
在使用 Vue Router 的项目中，任何组件都可以通过 this.$route 和 this.$router 访问当前路由和路由器。前者包含了 URL 中的参数信息，后者提供了修改 URL 的方法。借助于两者，组件之间可以实现通信。

## 使用 Vue Router 来管理状态
整体思路与 Vuex/Redux 是一致的：

{% asset_img "drawio (5).svg" %}

由于涉及到 URL 读写，Vue Router 的方案中需要额外处理状态的序列化和反序列化问题。对于使用 query string 来保存状态的场景来说，好消息是 Vue Router 支持覆盖默认的 parseQuery stringifyQuery 以应对状态的初始化，坏消息是 this.$router.push/replace 一个 query object 时，需要确保刷新页面后可以获得同样的 query object 内容不变，即

`_.isEqual(queryObject, parseQuery(stringifyQuery(queryObject))) === true`

# 适用场景与局限性
使用 Vue Router 来做状态管理，本质上与 Vuex/Redux 的数据流理念是一致的。需求由强到弱，甚至到不适用的场景依次有：

1. 需要刷新页面保留状态的场景，URL 是比 LocalStorage Cookie 等更简单更易用的方式
2. 需要页面/组件间简单的通信，URL 仍是一种简单有效的选择
3. 状态数据大、变化频度高的场景，使用 URL 不仅会让 URL 难读，而且页面性能也会受到影响