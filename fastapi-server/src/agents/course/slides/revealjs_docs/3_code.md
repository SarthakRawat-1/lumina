# Presenting Code

reveal.js includes a powerful set of features aimed at presenting syntax highlighted code — powered by highlight.js

Below is an example with code that will be syntax highlighted. When the `data-trim` attribute is present, surrounding whitespace within the `<code>` is automatically removed.

HTML will be escaped by default. To avoid this, add `data-noescape` to the `<code>` element.

```html
<section>
  <pre><code data-trim data-noescape>
(def lazy-fib
  (concat
   [0 1]
   ((fn rfib [a b]
        (lazy-cons (+ a b) (rfib b (+ a b)))) 0 1)))
  </code></pre>
</section>
```

## Language selection

By default, highlight.js tries to automatically detect which language is used in the code snippet. It is however possible to overwrite this by adding a `language-XXX` attribute.

```html
<pre><code data-trim class="language-python">
>>> import antigravity
>>> print(b"\x01\x02\x03")
>>> a = 2
</code></pre>
```

## HTML Entities

Content added inside of a `<code>` block is parsed as HTML by the web browser. If you have HTML characters (<>) in your code you will need to escape them (&lt; &gt;).

To avoid having to escape these characters manually, you can wrap your code in `<script type="text/template">` and we'll handle it for you.
