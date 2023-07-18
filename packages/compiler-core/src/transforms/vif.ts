import { isString } from '@vue/shared'
import {
  NodeTypes,
  createCallExpression,
  createConditionalExpression
} from '../ast'
import {
  TransFormContext,
  createStructuralDirectiveTransform
} from '../transform'
import { getMemoedVNodeCall } from '../utils'
import { CREATE_COMMENT } from '../runtimeHelpers'

export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  (node: any, dir: any, context: TransFormContext) => {
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      let key = 0
      return () => {
        if (isRoot) {
          ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context)
        }
      }
    })
  }
)

export function processIf(
  node: any,
  dir: any,
  context: TransFormContext,
  processCodegen?: (node: any, branch: any, isRoot: boolean) => void
) {
  if (dir.name === 'if') {
    const branch = createIfBranch(node, dir)

    const ifNode = {
      type: NodeTypes.IF,
      loc: {},
      branches: [branch]
    }
    context.replaceNode(ifNode)

    if (processCodegen) {
      return processCodegen(ifNode, branch, true)
    }
  }
}

function createCodegenNodeForBranch(
  branch: any,
  keyIndex: any,
  context: TransFormContext
) {
  if (branch.condition) {
    console.log(33, createChildrenCodegenNode(branch, keyIndex))
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, keyIndex),
      createCallExpression(context.helper(CREATE_COMMENT), ['"v-if"', 'true'])
    )
  } else {
    return createChildrenCodegenNode(branch, keyIndex)
  }
}

function createChildrenCodegenNode(branch: any, keyIndex: any) {
  const keyProperty = createObjectProperty(
    'key',
    createSimpleExpression(`${keyIndex}`, false)
  )

  const { children } = branch

  const firstChild = children[0]
  const ret = firstChild.codegenNode
  console.log('❓ - file: vif.ts:77 - createChildrenCodegenNode - ret:', ret)
  const vnodeCall = getMemoedVNodeCall(ret)
  injectProp(vnodeCall, keyProperty)
  return ret
}

export function injectProp(node: any, prop: any) {
  let propsWithInjection: any

  const props =
    node.type === NodeTypes.VNODE_CALL ? node.props : node.arguments[2]

  if (props === null || isString(props)) {
    propsWithInjection = createObjectExpression([prop])
  }

  node.props = propsWithInjection
}

export function createObjectExpression(properties: any) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    loc: {},
    properties
  }
}

export function createObjectProperty(key: any, value: any) {
  return {
    type: NodeTypes.JS_PROPERTY,
    loc: {},
    key: isString(key) ? createSimpleExpression(key, true) : key,
    value
  }
}

export function createSimpleExpression(content: any, isStatic: any) {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    loc: {},
    content,
    isStatic
  }
}

function createIfBranch(node: any, dir: any) {
  return {
    type: NodeTypes.IF_BRANCH,
    loc: {},
    condition: dir.exp,
    children: [node]
  }
}
