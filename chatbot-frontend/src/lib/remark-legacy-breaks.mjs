// Convert only parsed HTML break nodes. Code/inlineCode nodes are never visited as HTML.
export default function remarkLegacyBreaks() {
  const processor = this
  function transform(parent) {
    if (!parent.children) return
    parent.children = parent.children.flatMap(node => {
      if (node.type === 'html') {
        const match = /^<br[ \t]*\/?>/i.exec(node.value)
        if (match) {
          const rest = node.value.slice(match[0].length)
          // A stand-alone <br> may begin an HTML block containing subsequent Markdown.
          // Reparse the remainder rather than replacing text inside possible code spans.
          const tail = rest ? processor.parse(rest) : { children: [] }
          transform(tail)
          return [{ type: 'break' }, ...tail.children]
        }
      }
      transform(node)
      return [node]
    })
  }
  return transform
}
