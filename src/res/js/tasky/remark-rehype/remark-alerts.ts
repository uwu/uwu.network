import 'mdast-util-directive'
import { h } from 'hastscript'
import type { Root } from 'mdast'
import { toHast } from 'mdast-util-to-hast'
import { visit } from 'unist-util-visit'

type Type = 'info' | 'tip' | 'warning' | 'danger' | 'details'

export function remarkAlerts() {
  return (tree: Root) => {
    visit(tree, (node: any) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'alert') return

      const type = (node.attributes?.type as Type) || 'info'
      const title = (node.attributes?.title as string) ??
        (type === 'details'
          ? 'Details'
          : type.charAt(0).toUpperCase() + type.slice(1))

      const data = node.data || (node.data = {})

      if (type === 'details') {
        const element = h(
          'details',
          { class: `not-prose custom-block ${type}-base` },
          h('summary', { class: `custom-block-title ${type}-title` }, title),
          h('p', {}, (toHast(node, { clobberPrefix: '' }) as any).children)
        )
        data.hName = element.tagName
        data.hProperties = element.properties
        data.hChildren = element.children
      } else {
        const element = h(
          'div',
          { class: `not-prose custom-block ${type}-base` },
          h('p', { class: `custom-block-title ${type}-title` }, title),
          h('p', {}, (toHast(node, { clobberPrefix: '' }) as any).children)
        )
        data.hName = element.tagName
        data.hProperties = element.properties
        data.hChildren = element.children
      }
    })
  }
}
