layout: post
title: "前端微服务化在才云的实践"
date: 2019-6-30
tags:
---

compass 是才云的核心产品，包含了集群资源管理、应用管理、运维管理和告警等一系列功能。更好的微服务运维作为 compass 的产品目标之一，也促使 compass 成为一个由多个微服务所构建成的产品。

与微服务化的后端不同，compass 前端长期以来是一个单体应用。随着功能和开发人员的不断增多，前端的代码构建变得越来越慢，工作流变得越来越复杂。

<!--more-->

为了应对这种情况，也便于业务团队的管理，compass 前端对应后端微服务被进行了拆分。

微前端的优势被 [ThoughtWorks 详细地阐述过](https://insights.thoughtworks.cn/micro-frontends-1/)，如何实现 ThoughtWorks 聊得较少，但也提出了一些重要原则，结合产品特点，我们抛弃了一些原则，也对一些原则作了点不一样的解释


- Be Technology Agnostic，单体应用基于 React 技术栈，微前端也同样如此。不过在 React 技术栈上，单个微前端可以有一些自己技术选择；
- Isolate Team Code，使用分离的代码仓库，但未隔离 runtime；
- Establish Team Prefixes，在需要区分前端模块的地方都可以使用 prefix；
- Favor Native Browser Features over Custom APIs，尽量使用原生实现和 React 生态圈的实现；
- Build a Resilient Site，暂不考虑。

前两点主要基于架构迁移的风险和成本考虑，这是将正在运行的产品迁移到微前端架构的过程中所不得不考虑的问题。

具体来讲，我们是如何做到的？

# 1. 模块设计与原地裁切

要实现微服务不可避免地要先实现代码按功能切分的模块化。这里我们实现了一个简单的模块系统，包含 ModuleRegistry 和 Module。Module 就是一个业务模块，是原有代码的一个薄封装，实现了 ModuleRegistry 定义的生命周期方法。ModuleRegistry 加载 Module 时，首先会实例化 Module，并将 redux store、导航菜单更新方法等作为 context 传递给 Module 的初始化方法。Module 则可以在初始化方法中完成导航菜单的注册、redux reducer 的注册、保存所需的 context 信息等操作。

从这里可以看出，类似于 redux 这种应用于应用全局的技术，需要优先实现 reducer 动态加载等模块化特性。业务上的导航菜单，也需要支持动态加载菜单项。

这些动态加载特性是在真正开始模块实现前需要做的，所以在实施微前端之前，就可以在原有代码仓库中进行模块的裁切了。

# 2. 服务粘合

做完模块化之后，就可以将模块代码拆分到各自的代码仓库中去了，并且可以实现单独的构建和运行。但是如何将分散的前端重新粘合在一起呢？

将 compass 前端按功能模块拆分出去之后，还剩下一些产品主体代码，包括导航菜单、页面框架等。这些公共的代码不属于业务，可以将它们打包为不含业务模块的运行框架。运行框架包含了 ModuleRegistry，和用于服务粘合的代理和服务注入功能。

## 2.1 代理

无论部署多少个微前端实例，它们都须要汇聚为一个单一服务提供给用户使用。所以运行框架须要有代理各微服务的功能。

## 2.2 服务注入

单个微前端实例，除了提供原本就提供的 js css 等静态资源、Node.js 服务之外，还需额外提供一个 `manifest.html` 文件，这是我们的微前端约定的一部分。

`manifest.html` 可以通过不同的技术来生成，可以是静态的，可以是动态变化。但它需要满足一个目的，运行框架产生的页面内联 `manifest.html` 后就可以完成业务模块的注册和使用。所以普通的的 `manifest.html` 实现就是 webpack-html-plugin 输出的文件。但不限于此。

运行框架有两种加载 `manifest.html` 的方式，一是在输出首页的过程中获取各个微前端的 `manifest.html` 后内联如首页中，另一种是输出不含 `manifest.html` 的首页后，由浏览器拉取 `manifest.html` 并嵌入页面中。为了加快首屏速度，我们选择前者来加载 compass 的固有模块，选择后者来加载 addon（一些实验性质的功能，不一定会进入标准 compass 功能列表）。

# 3. TBD