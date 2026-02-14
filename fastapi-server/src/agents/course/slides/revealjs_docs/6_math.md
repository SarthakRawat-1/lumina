# Math 
You can and if needed should add LaTeX formulas to your slides using KaTeX.

```html
<section>
  <h2>The Lorenz Equations</h2>
  \[\begin{aligned} \dot{x} &amp; = \sigma(y-x) \\ \dot{y} &amp; = \rho x - y - xz \\ \dot{z} &amp; = -\beta z + xy \end{aligned} \]
</section>
```

## Markdown

To include math inside of a presentation written in Markdown, wrap the equation using one the available math delimiters like `$$`:

```html
<section data-markdown>$$ J(\theta_0,\theta_1) = \sum_{i=0} $$</section>
```

The KaTeX typesetting library is used for math equations.
