import { isArray, isFunction, isObject, isString } from '@vue/shared'
import { normalizeClass } from 'packages/shared/src/normalizeProp'
import { ShapeFlags } from 'packages/shared/src/shapeFlags'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export const Comment = Symbol('Comment')

export interface VNode {
  __v_isVNode: true
  type: any
  props: any
  children: any
  shapeFlag: number
  el?: Element
  key?: number
}
export function createVNode(type: any, props?: any, children?: any): VNode {
  if (props) {
    let { class: klass } = props
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass)
    }
  }
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0

  return createBaseVNode(type, props, children, shapeFlag)
}
export function createBaseVNode(
  type: any,
  props: any,
  children: any,
  shapeFlag: number
): VNode {
  const vnode: VNode = {
    __v_isVNode: true,
    type,
    props,
    children,
    shapeFlag
  }
  normalizeVNodeChildren(vnode, children)

  return vnode
}

export function normalizeVNodeChildren(vnode: VNode, children: any) {
  let type = 0
  // let { shapeFlag } = vnode

  if (children == null) {
    children = null
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else if (isObject(children)) {
  } else if (isFunction(children)) {
  } else {
    children = String(children)
    type = ShapeFlags.TEXT_CHILDREN
  }

  vnode.children = children

  vnode.shapeFlag |= type
}

export function isSameVNodeType(n1: VNode, n2: VNode) {
  return n1.type === n2.type && n1.key === n2.key
}
