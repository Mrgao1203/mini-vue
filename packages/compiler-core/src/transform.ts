import { NodeTypes } from './ast'
import { isSingleElementRoot } from './hoistStatic'

export interface TransFormContext {
  root: any
  parent: ParentNode | null
  childrenIndex: number
  currentNode: any
  helpers: Map<symbol, number>
  helper<T extends symbol>(name: T): T
  nodeTransforms: any[]
}

export function createTransformContext(root: any, { nodeTransforms = [] }) {
  const context: TransFormContext = {
    nodeTransforms,
    root,
    helpers: new Map(),
    currentNode: root,
    parent: null,
    childrenIndex: 0,
    helper(name: any) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    }
  }
  return context
}

export function transform(root: any, options: any) {
  const context = createTransformContext(root, options)
  traverseNode(root, context)
  createRootCodegen(root)
  root.helpers = [...context.helpers.keys()]
  root.components = []
  root.directives = []
  root.imports = []
  root.temps = []
  root.cached = []
  root.hoists = []
}

export function traverseNode(node: any, context: TransFormContext) {
  context.currentNode = node
  const { nodeTransforms } = context
  const exitFns: any[] = []

  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)
    if (onExit) {
      exitFns.push(onExit)
    }
  }

  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break
  }

  context.currentNode = node
  let i = exitFns.length

  while (i--) {
    exitFns[i]()
  }
}

export function traverseChildren(parent: any, context: TransFormContext) {
  parent.children.forEach((node: any, index: number) => {
    context.parent = parent
    context.childrenIndex = index
    traverseNode(node, context)
  })
}

function createRootCodegen(root: any) {
  const { children } = root

  if (children.length === 1) {
    const child = children[0]
    if (isSingleElementRoot(root, child) && child.codegenNode) {
      root.codegenNode = child.codegenNode
      return child.codegenNode
    }
  }
}
