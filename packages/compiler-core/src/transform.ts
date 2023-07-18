import { isArray, isString } from '@vue/shared'
import { NodeTypes } from './ast'
import { isSingleElementRoot } from './hoistStatic'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

export interface TransFormContext {
  root: any
  parent: ParentNode | null
  childrenIndex: number
  currentNode: any
  helpers: Map<symbol, number>
  helper<T extends symbol>(name: T): T
  nodeTransforms: any[]
  replaceNode(node: any): void
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
    },
    replaceNode(node) {
      context.parent!.children[context.childrenIndex] = context.currentNode =
        node
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
      if (isArray(onExit)) {
        exitFns.push(...onExit)
      } else {
        exitFns.push(onExit)
      }
    }
    if (!context.currentNode) {
      return
    } else {
      node = context.currentNode
    }
  }

  switch (node.type) {
    case NodeTypes.IF_BRANCH:
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break

    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.IF:
      for (let i = 0; i < node.branches.length; i++) {
        traverseNode(node.branches[i], context)
      }
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

export function createStructuralDirectiveTransform(
  name: string | RegExp,
  fn: any
) {
  const matches = isString(name)
    ? (n: string) => n === name
    : (n: string) => name.test(n)

  return (node: any, context: any) => {
    if (node.type === NodeTypes.ELEMENT) {
      const { props } = node

      const exitFns: any[] = []

      for (let i = 0; i < props.length; i++) {
        const prop = props[i]
        if (prop.type === NodeTypes.DIRECTIVE && matches(prop.name)) {
          props.splice(i, 1)
          i--
          const onExit = fn(node, prop, context)
          if (onExit) {
            exitFns.push(onExit)
          }
        }
      }

      return exitFns
    }
  }
}
