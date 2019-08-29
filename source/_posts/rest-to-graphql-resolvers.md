layout: post
title: "从 REST 到 GraphQL：resolver 设计"
date: 2019-8-29
tags:
---

类型定义是 graphql server 的接口，resolver 则是 graphql server 的实现。resolver 负责 field 的解析，往往需要与底层的数据源进行通信。

<!--more-->

从 RESTful 接口迁移到 graphql，需要面临一破一立的问题。立 graphql 更加容易，做个好看的 PPT 游说下老板和后端，在资源不是特别吃紧的情况下比较容易成功。破 RESTful 则可能是非常艰难甚至不可能的事情。因为这会让 graphql 直接“入侵”到后端，对整个团队来说，都是风险很高，但是收益不确定的事。所以 “graphql over RESTful” 才是这种情形下的最优解，此时 resolver 需要通信的数据源则是 RESTful 接口。

## auth 问题

RESTful Endpoint 往往会验证请求的用户信息。graphql server 为响应一个查询请求，往往需要访问多次 RESTful Endpoint。

为了让 resolver 方便地与 RESTful Endpoint 通信，而无需关心 auth 的问题。可以将 HTTP client 配置好 auth 信息，再设置到 context 中，让 resolver 用它与 RESTful Endpoint 通信。

以 HTTP client 用 axios，auth 信息通过 HTTP header 传递，graphql server 为 apollo server 为例，可以配置 context 为

```javascript
const server = new ApolloServer({
  context({ req }) {
   return {
     axios: axios.create({
       baseURL: RESTful_Endpoint,
       headers: {
         Authorization: `Bearer ${req.get('access_token')}`,
       }
     }),
   }
 }
})
```

那么在 resolver 中则可以使用 axios

```javascript
const resolvers = {
  Query: {
    book(parent, args, context, info) {
      return context.axios(`/books/${args.id}`).then(res => res.data);
    }
  }
}
```

## N+1 问题

N+1 Problem 的解决方案分为两个层面：batching 和 caching。

batching 所解决的 N + 1 问题是指，当请求了资源列表，长度为  N，再通过外键为列表元素获取额外的资源，则会发起 1 + N 个请求。在数据源为数据库的情况下，利用 [dataloader](https://github.com/graphql/dataloader) 可以将 N 个外键收集起来，利用单个批量查询解决 N+1 问题。但是在数据源为 RESTful 的情况下，batching 并不适用，因为 RESTful Endpoint 往往不提供 batching 风格的接口。

caching 所解决的 N + 1 问题是指，当请求了资源列表，长度为 N，当元素的外键都相同时，获取元素的额外资源，仍然会发起 1 + N 个请求。如果在一次 graphql 查询过程中，将资源 id 和资源请求成对地进行缓存，则可以避免为相同 id 的资源发出重复的数据源查询。无论对于数据库还是 RESTful 接口，caching 都能很好地工作。

dataloader 提供了 batching 和 caching 的解决方案，但是更多地是面向数据库的，而非 RESTful。将 dataloader 绑定到 RESTful 场景，反而会需要建设额外的适配层，增加了系统的复杂性。

仍然用上面 axios 实例存于 context 的用法为例子。如果为 axios 额外配置一个 adapter（axios adapter 是 axios 暴露出来，用于自定义数据请求和返回的接口），用于缓存 GET 请求的 Promise 值，对于两个重复的 GET 访问只返回同一个 Promise 值，则可以避免过多地请求 RESTful Endpoint。

下面是一个简单的 adapter，缓存 key 只考虑了 url，没有考虑 params（URL parameters）：

```javascript
const httpAdapter = require('axios/lib/adapters/http');

function createAdapter() {
  return function adapter(config) {
    if (config.method === 'get') {
      const cacheKey = config.url;

      if (adapter[cacheKey]) {
        return adapter[cacheKey];
      } else {
        return (adapter[cacheKey] = httpAdapter(config));
      }
    } else {
      return httpAdapter(config);
    }
  };
};
```

context 配置则改为

```javascript
const server = new ApolloServer({
  context({ req }) {
   return {
     axios: axios.create({
       baseURL: RESTful_Endpoint,
       headers: {
         Authorization: `Bearer ${req.get('access_token')}`,
       },
       adapter: createAdapter()
     }),
   }
 }
})
```

注意要为每个 axios 实例生成一个新的 adapter，因为缓存一般只在一个查询中有效。

## RESTful 指令

大多数情况下，与 RESTful Endpoint 通信的 resolver 只包含“通信”这一单一的功能。可以进一步将其提取为指令，从而减少这部分 resolver 的书写。

指令需直接作用于 field，如

```graphql
directive @restFetch(method: String, path: String) on FIELD_DEFINITION

type Query {
  book(id: ID!): Book @restFetch(method: "GET", path: "/books/:id")
}
```

restFetch 的实现可以简单写作

```javascript
class RestFetchDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;

    field.resolve = async (root, args, context, info) => {
      const url = buildUrl(this.args.path, args);

      return context.axios.request({
        method: this.args.method,
        url
      }).then(res => res.data);
    };
  }
}
```

实际使用中，restFetch 为了满足各种业务场景，会更加复杂。不多对于复杂和稀少的场景，还是应当编写 resolver 来解决。