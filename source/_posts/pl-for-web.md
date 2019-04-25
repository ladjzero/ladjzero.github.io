layout: post
title: "随笔：编程语言知识在 web 前端的应用"
date: 2019-4-25
tags:
---

作为软件开发者，熟练地运用编程语言，可以实现各种软件来满足各样的需求。但是创造和扩展一种编程语言却不容易，因为这是计算机科学中很复杂的部分，这种复杂让人有望洋兴叹之感。

<!--more-->

随着 Node.js 的诞生，web 前端开进了高速进化的车道。各种软件和各种设计模式，如文艺复兴一般，在前端领域重新走了一遭，从而产生“[任何可以使用JavaScript来编写的应用，最终会由JavaScript编写](https://blog.codinghorror.com/the-principle-of-least-power/)”的说法。

不出所料，编程语言作为一种特殊的软件，竟然也在前端领域中被锻造了一次又一次。对此影响最大的可能是 Babel 和 Webpack 的诞生。

Babel 和 Webpack 本身并不是新的编程语言，而是“编译器”和“打包器”。使用 Babel，你可以使用 JavaScript 最新的但未完全标准化的语言特性。通过 Babel 的转译，新语法会被翻译为旧语法，从而实现在较旧或标准平台上的运行。Webpack 作为“打包器”，更像 C/C++ 编译工具链中的链接器，但是它仍具有代码转换的作用。使用 Webpack Loader，可以让 Webpack 处理非 JavaScript 语言文件，甚至可与 Babel 配合将新 JavaScript 转译为旧 JavaScript；使用 Webpack Plugin，还可以进一步重新编排 JavaScript 模块的依赖关系，甚至调整源码 —— Webpack 底层依赖的 [acorn](https://github.com/acornjs/acorn) 扮演了至关重要的作用。

高级编程语言是解决复杂问题的有利工具。利用 Babel，React 得以扩展 JavaScript 实现 jsx 语法，这也是促成 React 流行的原因之一。与 Babel 类似，tsc 是 TypeScript 编译到 JavaScript 的编译器。TypeScript 为 JavaScript 带来了静态类型，为大型项目的开发增添了一份可靠的保障。最新的 [Babel 7 甚至还支持了 TypeScript 的编译](https://devblogs.microsoft.com/typescript/typescript-and-babel-7/)。

为了熟悉一些 Babel 的编译原理非常重要的概念 —— 抽象语法树 AST，我做了一个[用 JavaScript 来实现 JavaScript](https://github.com/ladjzero/js-ast-interpreter) 的练习。采用 acorn 来进行源代码到 AST 的转换，然后用 JavaScript 编写程序来解释 AST，从而实现源代码的执行。

稍微熟悉 AST 之后，我尝试写一些 Babel 或 Webpack 插件，用于解决工作中一些问题，例如抽取代码中需国际化的文本为语言包文件。这大大扩展了我的工作边界，从日业务代码的开发扩展到了开发工具链的开发和优化。

因为有了一点点编程语言的知识，在团队引入 GraphQL 时我更加关注其语言本身的部分，而不是其服务器和客户端的实现。目前 GraphQL 语言本身只有一个官方实现，是 JavaScript 编写的。语言特性还比较基础，如果语言特性不够用时，可以通过编写指令来扩展语言功能。利用一些之前习得的知识，我编写了一些指令来增强 GraphQL，避免了编写迂回的、复杂的查询语句。

前不久在 LeetCode 上刷到一个 [Lisp 语法解析](https://leetcode-cn.com/problems/parse-lisp-expression/)的题，高难度。本以为沿用三脚猫的功夫可以搞定，没想到最后吃瘪了。花了很多天，断断续续地解，虽然最终解决了，但也意识到编程语言真是一个复杂但系统的学问。

计算机领域的很多子领域，都可以让人穷尽毕生精力研究，每当我认为在日常工作比较无聊没有难度的时候，我会试着学习编程语言，毕竟它不是没用的技能。有了它，我可以更多地感受 web 前端进化狂热的浪潮，更多地做“不可思议”的解决方案。
