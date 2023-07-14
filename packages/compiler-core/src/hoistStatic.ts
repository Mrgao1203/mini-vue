import { NodeTypes } from './ast'

export function isSingleElementRoot(root: any, child: any) {
  const { children } = root
  return children.length === 1 && child.type === NodeTypes.ELEMENT
}
