const doc = document
export const nodeOps = {
  insert: (child: Element, parent: Element, anchor: Node) => {
    parent.insertBefore(child, anchor)
  },
  createElement: (tag: string): Element => {
    const el = doc.createElement(tag)
    return el
  },
  createText: (text: string): any => doc.createTextNode(text),
  createComment: (text: string) => doc.createComment(text),
  setElementText: (el: Element, text: string) => {
    el.textContent = text
  },
  setText: (node: Element, text: string) => {
    node.nodeValue = text
  },
  remove: (child: Element) => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  }
}
