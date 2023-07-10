import { Text, createVNode } from './vnode'

export function normalizeVNode(child: any) {
  if (typeof child === 'object') {
    return cloneIfMounted(child)
  } else {
    return createVNode(Text, null, String(child))
  }
}
function cloneIfMounted(child: any) {
  return child
}
