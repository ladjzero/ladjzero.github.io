layout: post
title: "前端微服务化在才云的实践"
date: 2019-6-30
tags:
---

compass 是才云的核心产品，包含了集群资源管理、应用管理、运维管理和告警等一系列功能。微服务作为 compass 的服务目标之一，也是才云构建自身产品的一种“本能”的思考方式。随着产品功能的不断丰富，技术栈的不断扩充，compass 的前端 compass-web 面临着一个挑战：如何将越来越大的单体应用微服务化。

<!--more-->

与微服务化的后端不同，compass-web 长期以来是一个单体应用。为了便于团队管理，compass-web 按照业务小组被划分为多个独立部署的模块。这种微服务式的前端组织方式，可以被称为“微前端”。

微前端的优势被 [ThoughtWorks 详细地阐述过](https://insights.thoughtworks.cn/micro-frontends-1/)，其中提出了一些重要原则。结合自身产品特点，我们抛弃了一些原则，也对保留的一些原则作了新的解释：

- Be Technology Agnostic;

  对于从单体迁移到微前端架构的应用来说，一开始就支持异构的模块是不明智的。不考虑异构，反而将技术栈缩小为以 React 为中心。这是我们根据目前的产品规模和人员成本所做出的的决定；

- Isolate Team Cod;

  为了更好地配合 CICD 和业务组的开发节奏，我们为每个模块使用了独立的代码仓库。但是我们仍允许模块在运行时进行有限的共享；

- Establish Team Prefixes;
- Favor Native Browser Features over Custom APIs;

- Build a Resilient Site;

  原文中是指服务器渲染和渐进式增强，但这并不适用于我们的产品。

具体而言，我们是这么做的。

# 1 微前端协议

架构是产品冰山之下的部分。从单体迁移到微前端架构，需要确保产品现有功能和体验不受影响。为了让各模块能一如往常一样协同工作，需要为之设计一套协议，它分为两个层次：服务聚合和服务协同。

# 2 服务聚合

服务聚合指的是将众多微前端粘合为一个整体：即使不同功能来自于不同服务，但在用户体验上，仍是使用的同一个应用。

在实施微前端后，compass-web 被分解为了”瘦身后的 compass-core-web“ 和业务相关 feature-web。其中 compass-core-web 除了提供 feature-web 的运行时框架外，还是一个用于服务聚合的网关。虽然 compass-core-web 接替了 compass-web 的位置，但是从外面看来，compass-web 似乎未曾改变过。

{% asset_img 1.png %}

## 2.1 模块设计

微前端的一个前置条件是代码的模块化。我们为此实现了一个简单的模块系统，包含 ModuleRegistry 和 Module 这两个概念。

compass-core-web 提供的运行时包含了 ModuleRegistry，feature-web 则包含 Module。通过服务聚合，compass-core-web 与 feature-web 的代码将一并送达客户端，Module 将被陆续地注册到 ModuleRegistry，业务功能也被陆续初始化。

在原有应用中，框架指的是提供应用初始化、redux store、路由、导航菜单等全局性功能的代码。要让应用运行起来，框架需要直接从业务代码获得功能代码，包括 redux reducer、路由配置、导航菜单项等，要让应用可以按模块拆分，框架还需能动态加载它们。

将可被动态加载的 redux reducer、路由配置、导航菜单和对应的 React 组件等代码，迁移到新的代码仓库，利用 Module 将这些代码进行汇总形成新的入口代码，即形成了 Module 的基本封装。细节上，Module 需实现了 ModuleRegistry 定义的 register 方法，在被 ModuleRegistry 加载时，Module 会被实例化，register 方法将被调用。redux reducer、路由配置、导航菜单等的更新方法会被作为 register 方法的参数，从 ModuleRegistry 传递给 Module，从而完成框架加载功能代码的过程。

一个 Module 的实现代码大致如下：

```javascript
import reducers from './reducers';
import routes from './routes';
import menus from './menus';

class FeatureModule extends Module {
  register({ store, patchReducer, patchRoute, patchMenu }) {
    this.store = store;
    patchReducer({ feature: reducers });
    patchRoute(routes);
    patchMenu(menus);
    // initialize feature-web ...
  }
}
```

## 2.2 服务聚合

在完成模块化之后，原有应用的代码则被拆分为 feature-web 分散到多个代码仓库中去了。feature-web 可以实现单独的开发和构建，因为缺少 compass-core-web 提供的框架，它仍不能单独运行。所以在运行时，需要把 compass-core-web 和 feature-web 重新聚合在一起。

### 2.2.1 服务代理

无论部署多少个 feature-web，compass-core-web 都是唯一的服务输出方。所以 compass-core-web 要有代理各 feature-web 服务的能力。

代理可以分为一静一动。对于静态资源，feature-web 可以使用 webpack 来进行构建，统一为所有静态资源加上 feature 前缀。对于动态接口，比如 Node.js 实现的 RESTful 接口，feature-web 可以为 api 加上 featuer 前缀。通过 feature 前缀，compass-core-web 可以实现按 feature 进行代理。

### 2.2.2 服务注入

feature-web 除了提供的 js css 等静态资源、Node.js 服务之外，还需额外提供一个 `manifest.html` 文件，这是“微前端协议”的一部分。

`manifest.html` 可以通过不同的技术来生成，可以是静态的，也可以是动态的。但它需要满足一个要求：仅需在页面中内联 feature-web 的 `manifest.html`，客户端就能获得所有 feature-web 的静态资源。

compass-core-web 有两种加载 `manifest.html` 的方式，服务端加载和客户端加载。前者是在 compass-core-web 输出 html 前，在服务端获取各个 feature-web 的 `manifest.html` 并内联到 html 文档中；后者是浏览器加载无 `manifest.html` 的 html 文档后，再请求各个 feature-web 的 `manifest.html` 并嵌入页面中。在生产环境中，我们同时采用了两种方式。为了加快首屏速度，使用服务端加载来加载 compass 的固有模块，使用客户端加载来加载 plugin 模块（一些实验性质的功能，不一定会进入标准 compass 产品）。

{% asset_img 2.png %}
<small>内联到 html 文档中的 a-web manifest</small>

# 3. 服务协同

服务聚合并不限制前端的技术选型，对于使用 Vue 或 Angular、甚至非 MVVM 架构的前端应用仍然适用。服务协同则需要根据所选技术栈来深度定制。

## 3.1 状态共享

feature-web 常常需要从框架中获取一些状态信息，比如 session 信息。可以利用全局变量、React context 和 redux 等来实现。

feature-web 之间的状态共享是需要尽量避免的。根据共享状态的来源不同，有不同的处理方式。若来自后端，各个 feature-web 应当分别从后端获取。若来自前端，可以利用 redux 或 ModuleRegistry 来进行通信。

这里延伸一下 Module ModuleRegistry 机制的功能。除了代码注册之外，ModuleRegistry 还承担着 Module 之间的通信职责。利用 ModuleRegistry 提供的 ModuleProvider 组件和 withModules 高阶组件，每个 feature-web 都方便地访问其他 Module，从而获得其他 feature-web 对外提供的信息。

## 3.2 代码共享

### 3.2.1 vendor 代码共享

为了优化 webpack 的构建过程，可以利用 DllPlugin 和 DllReferencePlugin 来实现两步构建。第一步将不易变的 vendor 代码构建为 dll bundle 和 dll manifest（相当于 C 语言的 header 文件），第二步将其余代码连同 dll manifest 构建为整个应用。如果 vendor 代码没变，只有业务代码发生了更变，整个构建过程就可以跳过第一步。

在微前端架构下，dll 机制的好处非常明显。因为 compass-core-web 和 feature-web 都是基于同一套技术栈，所以 vendor 代码大量重合。利用 dll 机制，可以减小 feature-web 的构建时间和输出的 js 文件的尺寸。

虽然 dll 机制适用于微前端，但 DllPlugin 和 DllReferencePlugin 却不一定。由于易受 vendor 代码和 webpack loader 的版本变化影响， DllPlugin 输出的 manifest 非常易变，难以在多个微前端构建中共享。所以我们简化了 dll 机制，第一步仅将 vendor 代码分别导出为全局变量，第二步通过 webpack 的 externals 机制来实现运行时链接（引用）。

### 3.2.2 共同库的单例问题

针对同一类问题，我们往往能在业务中提炼出一些公共库。在微前端架构下，在实现公共库时需要特别考虑单例问题。

例如在 a-web 中有代码
```javascript
import Lib from 'lib';
window.a = new Lib();
```

b-web 中获取到 `window.a` 后
```javascript
import Lib from 'lib';

if (window.a instanceof Lib /* 可能为假 */) {
  // do something
}
```

若对其进行类型判断 `window.a instanceof Lib`，这时该表达式可能为假。因为 a-web b-web 各自将 `lib` 构建到了自己的 bundle 中，导致两处的 `Lib` 值并不严格相等。

### 3.2.3 业务代码共享

feature-web 之间可能存在业务依赖。对于相依赖的业务代码，如果不在各个 feature-web 中单独维护，就需要 feature-web 之间能够互相访问业务代码。有有两种方式来实现业务代码的共享，一冷一热，分别有以下优缺点：

1. 使用 npm 包的形式来管理依赖。优点是依赖关系静态化、离线化，开发时也仅需运行单个 feature-web 就行；缺点是若需升级 npm 包，依赖方需要重新构建和发布，并且在运行时被依赖的代码会存在多个副本。

2. 在运行时依赖。优点是若被依赖的代码接口保持兼容，可以进行热更新，运维更加方便，也不会有业务代码的冗余；缺点是需要精心处理 feature-web 之间的依赖加载关系，而且由于依赖方式比较松散，一些本可以被静态检测工具发现的问题会被推迟到线上出现。

经过取舍，我们更加看重运维的便利性，所以采用了方案 2。利用 ModuleRegistry，每个 Module 可以有节制地注册一些公共服务，以便其他 Module 访问。在 React 技术栈下，这些被共享的服务往往都是 React Component。

使用运行时依赖会有两个挑战：服务不易共享，被共享的服务规模易失控。被注册的服务，对于所在模块来说，有一定的“私有”特性，然而对外来说，服务的接口又必须有易用和稳定的特性，两种特性有一定的冲突。另外如何确定一个服务是否适宜被共享也是一个问题。长远来看，共享的服务的规模会一直膨胀甚至会失控。为解决这两个挑战，需要根据业务和产品特点，为其定义详细的约束，不过这是个循序渐进的过程，但绝不能忽视。

## 4 总结和展望

从我们实践的结果看来，在现有单体前端上实施该微前端的方案是非常平滑地，同时仍表现出一些亟需解决的问题：

1. 开发过程会更加复杂，至少需要同时运行 compass-core-web 和 feature-web；
2. 由于 compass-core-web 具有框架属性，它的版本升级可能逼迫 feature-web 进行同步升级；
3. 运行时 feature-web 之间代码依赖还缺少规范和约束。

目前采取应对措施分别是：

1. 完善 cli 工具，尽量降低开发的复杂度；
2. 通过清扫技术债务、提取公共代码，为 compass-core-web 再“瘦身”，让其足够 mini，足够稳固；
3. 尽可能降低 feature-web 之间代码的依赖，尝试落地 graphql，将数据 api 层的代码（包含 redux 层和 Node.js api 层）依赖移除掉。

