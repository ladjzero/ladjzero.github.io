layout: post
title: "一种代码模板与可视化编辑器混合的前端开发方式"
date: 2021-6-15
tags:
---

“貌似一提到 lowcode，就很容易让人想起可视化编辑。哎~”

<!--more-->

# 什么是代码模板与可视化编辑器

## 代码模板

代码模板本质上是业务开发者将续写的代码。使用「Copy & Paste」和类似「create from template」的命令，可以实现模板的复用。

## 可视化编辑器

代码中可以可视化的部分，可以由可视化编辑器来编辑 。借助于 WYSIWYG （所见即所得）的特性，这部分代码可以被快速编写和调试，例如设计布局、调整外观。例如浏览器的 devtool 提供了 flex 布局和 transition 编辑器。

> {% asset_img 889298620.png %}
flex 布局编辑器

> {% asset_img 889298620.png %}
transition 编辑器

# 目标

通用 General Purpose。适用于各类前端开发技术和各类需求，但不意味着在任何场景下都能取得正向收益。

互操作性 Interoperability。可视化编辑器输入和输出的语言与代码模板中的语言一致。由于两者作用于同一语言上，所以在重叠的部分。

## 为什么要通用

行业中几乎没有通用的方案，仅在各个企业内部有集成了各类服务的可视化编辑方案，例如云凤蝶。

这类方案提效的方式并不是优化开发的工具链，而是「集成各类服务」。这就造成这个方案限定了非常具体的「开发上下文」，造成两个后果：

1. 兼容性不高，难以与其他技术混合使用，有明显的「排他性」

2. 扩展性不足，若为了满足扩展性又会发展出另一门「语言」，进一步加深兼容性问题

> 这些工具的特点就是可以用 1% 的时间完成 80% 的功能，刚开始用的时候都直呼这就是未来。然而 Neal Ford 发现了“#last10%rule"，就是最后的 10% 会付出非常大的代价，而用户总是需要 100% 的功能。
https://zhuanlan.zhihu.com/p/357411780

创建另一种仅能在内部使用的可视化编辑方案是无趣的、没有希望的。

## 为什么要互操作性

互操作性保证开发者可以完全控制代码，例如为可视化编辑器输出的代码编写业务逻辑。

> 案例分析
https://github.com/jaweii/Vue-Layout 是一个通过拖拽操作来生成布局的应用。它的功能非常单一，仅能将组件排布到页面上，看似「毫无用处」。但它可以输出 vue 代码，这是可以供开发者续写的代码，并非 Dreamweaver 等软件生成的「面条代码」。

> It’s true that in the past Dreamweaver generated superfluous, even bad, spaghetti-like HTML. But that was mainly the fault of Dreamweaver’s Layout Mode, which was rooted in the days of table layout.
https://www.quora.com/Do-professional-web-development-companies-use-Adobe-Dreamweaver-today

# 实现一个功能子集

## 语言范围

我们可以先仅针对 Typescript（包含 JSX 特性）语言进行实现，同时针对使用 antd 的 JSX 代码部分进行可视化编辑。

> antd 相当于是就是构建了基于 JSX 的 DSL ，在中后台前端开发领域，通过抽象基础的交互展示逻辑，牺牲了极少的的可扩展性，通用性和灵活性都达到了一定程度。
https://zhuanlan.zhihu.com/p/179488071

例如利用 Row Col 两个组件来实现网格布局，通过可视化编辑器，可以直接修改 Row Col 组件的属性，调整 Row Col 组件的个数，并将改动同步到源代码中。利用构建系统的 HMR（hot module replacement）技术，源代码中的改动又能实时地反应到界面上。
> {% asset_img 889527031.svg %}

## 可视化编辑范围

可视化编辑范围的实现分为两个阶段：

1. antd + JSX 编辑器。仅支持 antd 组件的属性编辑、组件的添加与删除。其中属性仅支持数据数据类型及其集合，例如 number 和 Array<number>

2. 模板自定义编辑器。支持模板中申明可以进行可视化编辑的代码范围，模板可能需要提供编辑器实现，例如 RxJS pipeline

## 自定义可视化编辑器

TBD.

## 如何服务化

参考 https://github.com/conwnet/github1s 项目。

