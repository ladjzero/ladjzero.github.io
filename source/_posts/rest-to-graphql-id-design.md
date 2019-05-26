layout: post
title: "从 REST 到 GraphQL：ID 设计"
date: 2019-5-26
tags:
---

现在 GraphQL 非常流行，不过要将运行在 REST 上的产品迁移到 GraphQL 并不太容易。不用 GraphQL 重写，而是在现有的 REST 上加一层 GraphQL 是比较科学的方法。

<!--more-->

REST 的每个 API Endpoint 看似独立，其实从宏观产品来看，REST 背后的“资源”都是互相关联的。比如 `/restaurants/:resId/rooms/:roomId` 中 `restaurants` 和 `rooms` 的层级关系；响应结果中的 `{room: { id: 1, owner: { userId: 123 }}}` `{user: { id: 123, rooms: [{ id: 1 }]}}` 这样的互相引用关系。也就是树或图的关系。

实现树的关系非常重要，可以让 GraphQL 在资源关系抽象上可以完全继承 REST 的成果。

一般来说，GraphQL 实现中会设计 `interface Node { id: ID! }` 这个类型，用于表达任何 GraphQL 数据节点。其中 `id` 在整系统中唯一的。相比而言，REST 中的 id 往往只是在类型中唯一的。所以 GraphQL id 至少要包含 REST 中的类型和 id 信息，比如 `Room:123`。

GraphQL 的解析响应数据的过程是个设计非常精妙的递归过程。开发者只需要定义类型的各个 field 的 resolver，如果 field 不是 scalar 类型，则再定义 field 的 field 的 resolver。由于整个 resolve 过程是自顶而下连续的过程，所以无法将数据顶层的信息传递给底层的 resolver。

这个问题使得 resolve 到底层时，会丢失 REST 的 Endpoint 中较靠前的 id 信息。举个栗子， `/restaurants/:resId/rooms/:roomId` 对应 schema

```
type Restaurant {
  id: ID!
  rooms: [Room!]!
}

type Room {
  id: ID!
  rating: Rating
}
```
，若 Rating 需要 resId 来进行查询。在不利用 context 的情况下，Room 的 resolver 只能提供 Room 的 id 信息。也许 Room 可以额外加一个 resId field 来向下传递 resId。不过这不是个好办法，因为如果资源的查询深度很大，往查询路径中的类型都加上用于辅助 field 会显得很麻烦和笨拙。另外使用 context 来传递信息也不太明智，因为它太难以 debug 了，而且你需要明确选用的 graphql server 的 resolve 实现方式。

仍然可以在 id 上想想办法 —— 将 REST Endpoint 中表达的资源关系也编码进 id 中，比如 `Room:123@Restaurant:abc`。

按照这样设计 id，在继承 REST 的资源关系设计的同时，GraphQL 并没有损失它应有的灵活度。