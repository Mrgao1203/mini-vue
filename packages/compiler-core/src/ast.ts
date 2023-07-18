import { CREATE_ELEMENT_VNODE } from './runtimeHelpers'
import { TransFormContext } from './transform'

export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  COMMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION,
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION,
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL,
  // codegen
  VNODE_CALL,
  JS_CALL_EXPRESSION,
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,

  // ssr codegen
  JS_BLOCK_STATEMENT,
  JS_TEMPLATE_LITERAL,
  JS_IF_STATEMENT,
  JS_ASSIGNMENT_EXPRESSION,
  JS_SEQUENCE_EXPRESSION,
  JS_RETURN_STATEMENT
}
export const enum ElementTypes {
  ELEMENT,
  COMPONENT,
  SLOT,
  TEMPLATE
}
export function createVNodeCall(
  context: TransFormContext,
  tag: string,
  props?: any[],
  children?: any
) {
  if (context) {
    context.helper(CREATE_ELEMENT_VNODE)
  }

  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children
  }
}

export function createConditionalExpression(
  test: any,
  consequent: any,
  alternate: any,
  newline = true
) {
  console.log(44, { alternate })
  return {
    type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
    test,
    consequent,
    alternate,
    newline,
    loc: {}
  }
}

export function createCallExpression(callee: any, args: any) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    loc: {},
    callee,
    arguments: args
  }
}
