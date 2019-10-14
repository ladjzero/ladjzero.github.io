layout: post
title: "处理超大查询参数的文件下载"
date: 2019-10-14
tags:
---

通常我们会使用 `<a>` 的 `download` 属性来实现文件下载，例如

```html
<a download href="abc.pdf">下载</a>
```

如果需要传递参数给下载接口，并且参数非常大以至于无法编码到 url 上，又改如何处理呢？

<!--more-->

通常，参数体积太大的时候，我们会选用 POST 方法来实现接口，并将参数作为 HTTP body 传递给服务器。如果仍希望保持 HTTP 方法的语义，也可以用 GET 方法并且附上 HTTP body。但这些都是 `<a>` 无法实现的。因为 `<a>` 只能触发“简单 GET 请求”实现的下载，连 header 都无法自定义，更不必说 body 了。

若借助 JavaScript 的力量，可以轻易地将 body 传递给后端，但是却无法自动触发下载行为。下载的过程大致是：JavaScript 处理服务器的响应，最终通过编码为 base64 数据，在利用 `<a download>` 进行下载。这个方法实现复杂，而且还有个重大缺陷：待下载的文件越大，性能和体验都越差。

有一种简单的方法可以实现简单 POST 请求，那就是表单 `<form>`。将参数编码到 `<form>` 中，并且将 `<a download>` 替换为 `<button type="submit">`，就可以发起满足需求的 POST 请求。

```html
<form action="abc.pdf" method="POST">
  <input type="hidden" name="param" value="a-relly-big-param">
  <button type="submit">下载</button>
</form>
```

同时，服务端应当响应 HTTP header `Content-Disposition: attachment`，以确保浏览器开始文件下载同时不会离开当前页面。

完整的例子如下：

<iframe src="https://codesandbox.io/embed/nostalgic-grass-er429?fontsize=14" title="download-demo" allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>
