layout: post
title: "为什么 WebSocket 和 HTTP 服务能部署到同一个端口"
date: 2019-2-24
tags:
---

大部分网站会把 WebSocket 部署到和 HTTP 服务一样的端口上，一般是 80 或 443。

<!--more-->
# WebSocket

WebSocket 与 HTTP 都是计算机网络应用层协议，但与 HTTP 是完全不同的是，WebSocket 是建立在单个 TCP 连接上的全双工通信连接。

# WebSocket 与 HTTP 的关系

为了兼容之前的已充分支持 HTTP 的网络设施，WebSocket 连接建立是通过 HTTP 协议完成的。使用 WebSocket 通信的两端利用 [HTTP 协议升级机制](https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism)，从 HTTP 协议切换到 WebSocket 协议。切换前后的通信都在同一个 TCP 连接上完成。

在服务端，http 服务完成 WebSocket 握手后，会交出 socket 控制权，由 WebSocket 服务来进行后续处理。一些老的 HTTP 服务程序和反向代理程序不懂得如何处理 WebSocket 握手和后续的 WebSocket 通信，则无法依赖它们实现 WebSocket 通信。

# x 和 HTTP 服务可以部署到同一个端口吗？

通常 HTTP 是在 TCP 协议之上实现的。

1. 如果 x 是基于 UDP 的，则 x HTTP 服务可以部署到“同一个”端口，不过这时的端口已没有比较的意义，因为 TCP UDP 有各自单独的协议栈，端口互不相干。

2. 如果 x 也是基于 TCP 的，则可以把 x HTTP 服务部署到不同地址（多个网卡多个 ip，或者 0.0.0.0 和本地 ip 上）的相同端口下，不过对于远程用户来说没什么意义

3. x 实现使用 HTTP 协议的握手机制，由 HTTP 服务完成握手并交出 socket 控制权

4. 强行使用同一个端口

# 强行使用同一端口？

使用 Node.js 开发服务器程序，有时会遇到端口被占用的错误

```
Error: listen EADDRINUSE :::8080
    at Server.setupListenHandle [as _listen2] (net.js:1334:14)
    at listenInCluster (net.js:1382:12)
    at Server.listen (net.js:1469:7)
```

这是 lib/net.js 抛出的错误，意图阻止多个应用使用同一个端口（非 cluster 模式下）。

一般来说，我们会使用操作系统提供的 TCP 栈。一些系统为绑定 socket 提供了 SO_REUSEPORT 参数，允许多个进程绑定到同一地址同一端口上。但是 Node.js 的 IO 底层 [libuv 并没有使用 SO_REUSEPORT](https://github.com/libuv/libuv/commit/3d2c820a4efe3954a77b539bb56e7398263069d3)，主要考虑到 linux kernel 不同版本的兼容性和与 BSD 的行为的差异性。

linux kernel 3.9 引入的 SO_REUSEPORT 的选项，允许多个进程分享同一地址同一端口的 TCP 连接。在除开负载均衡之外的场景下，SO_REUSEPORT 可能更多地会带来意料之外的效果。

关于 SO_REUSEPORT，这里有个非常好的[问答](https://stackoverflow.com/questions/14388706/socket-options-so-reuseaddr-and-so-reuseport-how-do-they-differ-do-they-mean-t)。
