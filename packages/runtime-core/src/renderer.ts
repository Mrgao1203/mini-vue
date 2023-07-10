import { EMPTY_OBJ, isString } from '@vue/shared'
import { Fragment, Text, isSameVNodeType, type VNode } from './vnode'
import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { normalizeVNode } from './componentRenderUtils'
export interface RendererOptions {
  patchProp(el: Element, key: string, preValue: any, nextValue: any): void // 打补丁
  setElementText(node: Element, text: string): void // 设置 text 到 node 中
  setText(node: Element, text: string): void
  insert(el: Element, parent: Node, anchor: Node | null): void // 插入 el 到 parent 中 anchor 之前
  createElement(type: string, props?: any): Element // 创建元素
  remove(el: Element): void // 删除 vnode
  createText(text: string): Element
  createComment(text: string): Element
}

export function createRenderer(options: RendererOptions) {
  return baseCreateRenderer(options)
}

function baseCreateRenderer(options: RendererOptions): any {
  const {
    createElement: hostCreateElement,
    createText: hostCreateText,
    setElementText: hostSetElementText,
    setElementText: hostSetText,
    insert: hostInsert,
    patchProp: hostPatchProp,
    remove: hostRemove,
    createComment: hostCreateComment
  } = options
  const processFragment = (
    oldVNode: VNode,
    newVNode: VNode,
    container: any,
    anchor = null
  ) => {
    if (oldVNode === null) {
      mountChildren(newVNode.children, container, anchor)
    } else {
      patchChildren(oldVNode, newVNode, container, anchor)
    }
  }
  const processComment = (
    oldVNode: VNode,
    newVNode: VNode,
    container: any,
    anchor = null
  ) => {
    if (oldVNode === null) {
      newVNode.el = hostCreateComment(newVNode.children)
      hostInsert(newVNode.el, container, anchor)
    } else {
      newVNode.el = oldVNode.el
    }
  }
  const processText = (
    oldVNode: VNode,
    newVNode: VNode,
    container: any,
    anchor = null
  ) => {
    if (oldVNode === null) {
      newVNode.el = hostCreateText(newVNode.children)
      hostInsert(newVNode.el, container, anchor)
    } else {
      const el = (newVNode.el = oldVNode.el!)
      if (newVNode.children !== oldVNode.children) {
        hostSetText(el, newVNode.children)
      }
    }
  }
  const processElement = (
    oldVNode: VNode,
    newVNode: VNode,
    container: any,
    anchor = null
  ) => {
    if (oldVNode === null) {
      mountElement(newVNode, container, anchor)
    } else {
      patchElement(oldVNode, newVNode)
    }
  }
  const patchElement = (oldVNode: VNode, newVNode: VNode) => {
    const el = (newVNode.el = oldVNode.el)

    const oldProps = oldVNode.props || EMPTY_OBJ

    const newProps = newVNode.props || EMPTY_OBJ

    patchChildren(oldVNode, newVNode, el!, null)

    patchProps(el!, newVNode, oldProps, newProps)
  }
  const patchProps = (
    el: Element,
    vnode: VNode,
    oldProps: Record<string, unknown>,
    newProps: Record<string, unknown>
  ) => {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        key as any
        const next = newProps[key]
        const prev = oldProps[key]
        if (next !== prev) {
          hostPatchProp(el, key, prev, next)
        }
      }
      if (oldProps! === EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  const patchChildren = (
    oldVNode: VNode,
    newVnode: VNode,
    container: Element,
    anchor = null
  ) => {
    const c1 = oldVNode && oldVNode.children
    const prevShapeFlag = oldVNode ? oldVNode.shapeFlag : 0
    const c2 = newVnode && newVnode.children
    const { shapeFlag } = newVnode

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff
        } else {
          // 卸载
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 删除旧节点的 text
          hostSetElementText(container, '')
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新节点挂载
        }
      }
    }
  }

  const mountChildren = (children: any, container: Element, anchor = null) => {
    for (let i = 0; i < children.length; i++) {
      if (isString(children)) {
        children = children.split('')
      }
      const child = (children[i] = normalizeVNode(children[i]))
      patch(null as any, child, container, anchor)
    }
  }

  const mountElement = (vnode: VNode, container: Element, anchor: any) => {
    const { type, props, shapeFlag } = vnode

    // 1.创建 element
    const el = (vnode.el = hostCreateElement(type))

    // 2.设置文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    }
    // 3.设置 props
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    // 4.插入到 container 中
    hostInsert(el, container, anchor)
  }

  const patch = (
    oldVNode: VNode,
    newVNode: VNode,
    container: any,
    anchor = null
  ) => {
    if (oldVNode === newVNode) return
    if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
      unmount(oldVNode)
      oldVNode = null as any
    }
    const { type, shapeFlag } = newVNode
    switch (type) {
      case Text:
        processText(oldVNode, newVNode, container, anchor)
        break
      case Comment:
        processComment(oldVNode, newVNode, container, anchor)
        break
      case Fragment:
        processFragment(oldVNode, newVNode, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(oldVNode, newVNode, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
        }
    }
  }

  const unmount = (vnode: VNode) => {
    hostRemove(vnode.el!)
  }
  const render = (vnode: VNode, container: any) => {
    // 新的节点不存在
    if (vnode === null) {
      // 旧的节点存在
      if (container._vnode) {
        unmount(container._vnode)
      }
    } else {
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }

  return {
    render
  }
}
