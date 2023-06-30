const doc = document
export const nodeOps = {
  insert: (child: Element, parent: Element, anchor: Node) => {
    parent.insertBefore(child, anchor)
  },
  createElement: (tag: string): Element => {
    const el = doc.createElement(tag)
    return el
  },
  setElementText: (el: Element, text: string) => {
    el.textContent = text
  }
}
