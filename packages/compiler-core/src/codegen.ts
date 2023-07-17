import { isArray, isString } from '@vue/shared'
import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING, helperNameMap } from './runtimeHelpers'
import { getVNodeHelper } from './utils'

const aliasHelper = (s: symbol) => `${helperNameMap[s]}:_${helperNameMap[s]}`

export function generate(ast: any) {
  const context = createCodegenContext(ast)

  const { push, newLine, indent, deindent } = context

  genFunctionPreamble(context)

  const functionName = 'render'

  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  push(`function ${functionName}(${signature}) {`)
  indent()

  push(`with (_ctx) {`)
  indent()

  const hasHelpers = ast.helpers.length > 0
  if (hasHelpers) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = _Vue\n`)
    newLine()
  }

  newLine()
  push(`return `)

  if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  } else {
    push('null')
  }

  deindent()
  push('}')

  deindent()
  push('}')

  return {
    ast,
    code: context.code
  }
}

function genFunctionPreamble(context: any) {
  const { push, helper, newLine, runtimeGlobalName } = context

  const VueBinding = runtimeGlobalName

  push(`const _Vue = ${VueBinding}\n`)
  newLine()
  push(`return `)
}

function genNode(node: any, context: any) {
  console.log('❓ - file: codegen.ts:64 - genNode - node.type:', node.type)

  switch (node.type) {
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context)
      break
    case NodeTypes.TEXT:
      console.log(node)

      genText(node, context)
      break

    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    case NodeTypes.ELEMENT:
      console.log(JSON.stringify(node.codegenNode))
      genNode(node.codegenNode, context)
      break
  }
}

function genCompoundExpression(node: any, context: any) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (isString(child)) {
      context.push(child)
    } else {
      genNode(child, context)
    }
  }
}

function genInterpolation(node: any, context: any) {
  const { push, helper } = context

  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(`)`)
}

function genExpression(node: any, context: any) {
  const { content, isStatic } = node

  context.push(isStatic ? JSON.stringify(content) : content)
}

function genVNodeCall(node: any, context: any) {
  const { push, helper } = context
  const {
    tag,
    props,
    children,
    pathFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking,
    isComponent
  } = node

  const callHelper = getVNodeHelper(context.isSSR, isComponent)
  push(helper(callHelper) + `(`)

  const args = genNullableArgs([
    tag,
    props,
    children,
    pathFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking,
    isComponent
  ])

  genNodeList(args, context)
  push(')')
}

function genNodeList(nodes: any[], context: any) {
  const { push, newLine } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node)) {
      push(node)
    } else if (isArray(node)) {
      genNodeListAsArray(node, context)
    } else {
      genNode(node, context)
    }

    if (i < nodes.length - 1) {
      push(',')
      newLine()
    }
  }
}

function genNodeListAsArray(nodes: any[], context: any) {
  context.push('[')
  genNodeList(nodes, context)
  context.push(']')
}

function genNullableArgs(args: any[]) {
  let i = args.length

  while (i--) {
    if (args[i] != null) break
  }

  return args.slice(0, i + 1).map(arg => arg || 'null')
}

function genText(node: any, context: any) {
  context.push(JSON.stringify(node.content))
}

function createCodegenContext(ast: any) {
  const context = {
    code: '',
    runtimeGlobalName: `Vue`,
    source: ast.loc.source,
    indentLevel: 0,
    isSSR: false,
    helper(key: any) {
      return `_${helperNameMap[key]}`
    },
    push(code: any) {
      context.code += code
    },
    newLine() {
      newLine(context.indentLevel)
    },
    indent() {
      newLine(++context.indentLevel)
    },
    deindent() {
      newLine(--context.indentLevel)
    }
  }
  function newLine(n: number) {
    context.code += '\n' + `  `.repeat(n)
  }
  return context
}
