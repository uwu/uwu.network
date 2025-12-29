import type { Root } from 'mdast'
import { toString as mdastToString } from 'mdast-util-to-string'
import getReadingTime from 'reading-time'

export function remarkReadingTime() {
  return (tree: Root, { data }: { data: any }) => {
    const textOnPage = mdastToString(tree)
    const readingTime = getReadingTime(textOnPage)
    data.astro.frontmatter.readingTime = readingTime.text
  }
}
