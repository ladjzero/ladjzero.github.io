layout: post
title: "为什么在 componentDidMount 里调用 this.setState 浏览器只会绘制一次"
date: 2019-9-24
tags:
---

偶然注意到 React 文档中的一句话

> You **may call setState() immediately** in componentDidMount(). It will trigger an extra rendering, but it will happen before the browser updates the screen. This guarantees that even though the render() will be called twice in this case, the **user won’t see the intermediate state**.

对 “user won’t see the intermediate state” 有些难以相信。可以确定的是，由于“额外的渲染”，dom 的确发生了变更。为何 dom 发生了变更，浏览器却只绘制了一次呢？

<!--more-->

# 是针对于屏幕刷新率的优化吗？

如果屏幕刷新率是 60Hz，浏览器的最高绘制频率可以设定为 60fps，进一步提高 fps 对网页的流程程度几乎没有贡献。由于 setState 前后的两次 dom 变更时间间隔极短，浏览器不绘制前一个 dom 看起来是可以理解的。

这段代码的表现也的确如此，无论如何刷新多少次，都不会出现从 hello 变为 hello world 的瞬间。
```html
<body>
  <div id="root"></div>
  <script>
    const delay = 1;

    window.onload = () => {
      const root = document.getElementById('root');
      root.innerText = 'hello';
      const now = Date.now();
      while (Date.now() - now < delay) {}
      root.innerText = 'hello world';
    }
  </script>
</body>
```

将第二次 innerText 的设置放到 setTimeout 的回调函数中，情况却不总是这样 —— 多刷新几次页面，总能看到 hello 切换的 hello world 的过程。
```html
<body>
  <div id="root"></div>
  <script>
    const delay = 1;

    window.onload = () => {
      const root = document.getElementById('root');
      root.innerText = 'hello';
      setTimeout(() => {
        root.innerText = 'hello world';
      }, delay);
    }
  </script>
</body>
```

将 delay 调到 1s，上面两段代码对应的界面绘制次数也不会变化。所以，**并不是针对于屏幕刷新率的优化**。

{% asset_img async-render.png %}
<figure>async 模式下 paint 了两次</figure>

# 何时浏览器会进行 “rerender”？

[浏览器的 event loop 规范](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)定义了每个事件循环需要执行的内容。如果把 event loop 需要处理的 task queue 比喻为管道，script（即 JavaScript 执行）和 render 则分别处在管道的前后端。即使在 script 中对 dom 进行了多次操作，render 也只会呈现最终的效果。

上面 setTimeout 设置 innerText 的例子中，两次 innerText 设置是在不同 task queue 里完成的，浏览器则有机会进行两次 render。

# DOM 测量与 “render”

render 是个复合且笼统的过程，可以简单理解为 layout 和 paint 两个过程。layout 是计算出 renderObject（浏览器中表示渲染元素的对象，大体上和 DOM 节点是对应的）的几何尺寸和位置；paint 则是将 renderObject 绘制为位图用于显示，这个过程一般需要 GPU 的参与。

与 paint 在 task queue 中最多只发生一次不同，layout 可以能会发生很多次，这取决于 script 中是否对 DOM 进行了测量。

在这段代码中，虽然浏览器只会绘制 hello world 的结果，但是输出的两次 offsetWidth 仍是不相等的。
```html
<body>
  <span id="root"></span>
  <script>
    window.onload = () => {
      const root = document.getElementById('root');
      root.innerText = 'hello';
      console.log(root.offsetWidth); // 35
      root.innerText = 'hello world';
      console.log(root.offsetWidth); // 80
    }
  </script>
</body>
```

# React 的 render

React 组件的生命周期以 render 为界，可以分为 pre-render 和 post-render 两类。pre-render 中的 setState 调用，都会被缓存起来，在 render 中进行批量处理，这时 setState 表现为异步的（因为 setState 并没有立即改变 state），post-render 中的 setState 调用，则会立即生效（立即改变 state）。所以在 componentDidMount 中调用 setState，的确会再次触发 React 的 render，然而 pre-render -> render -> post-render -> setState -> render 整个过程都是在同一个 script 执行过程完成的。尽管 React 组件的 render 方法被执行了两次，DOM 被更新了两次，浏览器却只能 paint 最后的 DOM 更变。

# 总结

浏览器会参考屏幕刷新率来设定 [render opportunity](https://html.spec.whatwg.org/multipage/webappapis.html#rendering-opportunity)，但不是本课题的答案。不像动画一样可以预测，浏览器无法预测 DOM 的修改，所以会尽早 render，哪怕两次 render 的间隔短到 1ms。

event loop 明确了一个 task queue 只会有一次 paint，尽管在 script 中 DOM 被修改了多次。React 的同步渲染逻辑，确保了 componentDidMount 之前的 render 和其中触发的 render 在同一个 script 过程中，从而保证了只会有第二次 render 的结果会被浏览器绘制。
