// Markdown FrontMatter is passed as Astro.props.content

export default (Astro_props) =>
  new Proxy(Astro_props, {
    get: (target, prop) => target[prop] ?? target.content?.[prop],
  });
