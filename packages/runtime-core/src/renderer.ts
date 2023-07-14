import { EMPTY_OBJ, isString } from '@vue/shared'
import { Fragment, Text, isSameVNodeType, type VNode } from './vnode'
import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { normalizeVNode, renderComponentRoot } from './componentRenderUtils'
import { createComponentInstance, setupComponent } from './component'
import { ReactiveEffect } from 'packages/reactivity/src/effect'
import { queuePreFlushCb } from './scheduler'
export interface RendererOptions {
  patchProp(el: Element, key: string, preValue: any, nextValue: any): void // 打补丁
  setElementText(node: Element, text: string): void // 设置 text 到 node 中
  setText(node: Element, text: string): void
  insert(el: Element, parent: Node, anchor: Node | null): void // 插入 el 到 parent 中 anchor 之前
  createElement(type: string, props?: any): any // 创建元素
  remove(el: Element): void // 删除 vnode
  createText(text: string): Element
  createComment(text: string): any
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
  const processComponent = (
    oldVNode: VNode,
    newVNode: VNode,
    container: any,
    anchor = null
  ) => {
    if (oldVNode === null) {
      mountComponent(newVNode, container, anchor)
    }
  }
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
      hostInsert(newVNode.el!, container, anchor)
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
          patchKeyedChildren(c1, c2, container, anchor)
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
  const patchKeyedChildren = (
    oldChildren: VNode[],
    newChildren: VNode[],
    container: Element,
    parentAnchor = null
  ) => {
    let i = 0
    const newChildrenLength = newChildren.length
    let oldChildrenEnd = oldChildren.length - 1
    let newChildrenEnd = newChildrenLength - 1

    // 1.自前向后
    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const oldVNode = oldChildren[i]
      const newVNode = normalizeVNode(newChildren[i])
      if (isSameVNodeType(oldVNode, newVNode)) {
        patch(oldVNode, newVNode, container, parentAnchor)
      } else {
        break
      }
      i++
    }

    // 2.自后向前
    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const oldVNode = oldChildren[oldChildrenEnd]
      const newVNode = newChildren[newChildrenEnd]
      if (isSameVNodeType(oldVNode, newVNode)) {
        patch(oldVNode, newVNode, container, parentAnchor)
      } else {
        break
      }
      oldChildrenEnd--
      newChildrenEnd--
    }

    // 3.新节点多余旧节点
    if (i > oldChildrenEnd) {
      if (i <= newChildrenEnd) {
        const nextPos = newChildrenEnd + 1
        const anchor =
          nextPos < newChildrenLength ? newChildren[nextPos].el : parentAnchor
        while (i <= newChildrenEnd) {
          patch(null as any, normalizeVNode(newChildren[i]), container, anchor)
          i++
        }
      }
    }

    // 4.旧节点多余新节点
    else if (i > newChildrenEnd) {
      while (i <= oldChildrenEnd) {
        // 卸载
        unmount(oldChildren[i])
        i++
      }
    }

    // 5.乱序对比
    /**
     * 最长递增子序列
     * what:
     * 在一个给定数值序列中,找到一个子序列,使得这个子序列元素的数值依次递增,并且这个子序列的长度尽可能的大
     */
    else {
      const oldStartIndex = i // prev starting index
      const newStartIndex = i // next starting index

      // 5.1 build key:index map for newChildren
      const keyToNewIndexMap: Map<string | number | symbol, number> = new Map()
      for (i = newStartIndex; i <= newChildrenEnd; i++) {
        const nextChild = (newChildren[i] = normalizeVNode(newChildren[i]))
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }

      // 5.2 loop through old children left to be patched and try to patch
      // matching nodes & remove nodes that are no longer present
      let j
      let patched = 0
      const toBePatched = newChildrenEnd - newStartIndex + 1
      let moved = false
      // used to track whether any node has moved
      let maxNewIndexSoFar = 0
      // works as Map<newIndex, oldIndex>
      // Note that oldIndex is offset by +1
      // and oldIndex = 0 is a special value indicating the new node has
      // no corresponding old node.
      // used for determining longest stable subsequence
      const newIndexToOldIndexMap = new Array(toBePatched)
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

      for (i = oldStartIndex; i <= oldChildrenEnd; i++) {
        const prevChild = oldChildren[i]
        if (patched >= toBePatched) {
          // all new children have been patched so this can only be a removal
          unmount(prevChild)
          continue
        }
        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // key-less node, try to locate a key-less node of the same type
          for (j = newStartIndex; j <= newChildrenEnd; j++) {
            if (
              newIndexToOldIndexMap[j - newStartIndex] === 0 &&
              isSameVNodeType(prevChild, newChildren[j] as VNode)
            ) {
              newIndex = j
              break
            }
          }
        }
        if (newIndex === undefined) {
          unmount(prevChild)
        } else {
          newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          patch(prevChild, newChildren[newIndex] as VNode, container, null)
          patched++
        }
      }

      // 5.3 move and mount
      // generate longest stable subsequence only when nodes have moved
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : []
      j = increasingNewIndexSequence.length - 1
      // looping backwards so that we can use last patched node as anchor
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = newStartIndex + i
        const nextChild = newChildren[nextIndex] as VNode
        const anchor =
          nextIndex + 1 < newChildrenLength
            ? (newChildren[nextIndex + 1] as VNode).el
            : parentAnchor
        if (newIndexToOldIndexMap[i] === 0) {
          // mount new
          patch(null as any, nextChild, container, anchor)
        } else if (moved) {
          // move if:
          // There is no stable subsequence (e.g. a reverse)
          // OR current node is not among the stable sequence
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor)
          } else {
            j--
          }
        }
      }
    }
  }
  const move = (vnode: any, container: Element, anchor: any) => {
    const { el } = vnode
    hostInsert(el, container, anchor)
  }
  const mountComponent = (
    initialVNode: any,
    container: Element,
    anchor = null
  ) => {
    initialVNode.component = createComponentInstance(initialVNode)

    const instance = initialVNode.component

    setupComponent(instance)

    setupRenderEffect(instance, initialVNode, container, anchor)
  }
  const setupRenderEffect = (
    instance: any,
    initialVNode: any,
    container: Element,
    anchor = null
  ) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { bm, m } = instance

        if (bm) {
          bm()
        }
        const subTree = (instance.subTree = renderComponentRoot(instance))
        patch(null as any, subTree, container, anchor)

        if (m) {
          m()
        }

        initialVNode.el = subTree.el

        instance.isMounted = true
      } else {
        let { next, vnode } = instance
        if (!next) {
          next = vnode
        }
        const nextTree = renderComponentRoot(instance)
        const prevTree = instance.subTree
        instance.subTree = nextTree
        patch(prevTree, nextTree, container, anchor)
        next.el = nextTree.el
      }
    }
    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queuePreFlushCb(update)
    ))

    const update = (instance.update = () => effect.run())

    update()
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
      mountChildren(vnode.children, el, anchor)
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
    anchor: any
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
          processComponent(oldVNode, newVNode, container)
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
      patch(container._vnode || null, vnode, container, null)
    }
    container._vnode = vnode
  }

  return {
    render
  }
}

/**
 * 获取最长递增子序列的下标
 * @param arr number[]
 * @returns number[]
 */
function getSequence(arr: number[]): number[] {
  // 最长递增子序列
  const p = arr.slice()
  // 默认最长递增子序列为第一个元素
  const result = [0]
  // i为当前元素索引, j为上一个元素索引, u为二分查找的下界, v为上界, c为中间值
  let i, j, u, v, c
  // 遍历arr
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      // 如果arr[i]存在, 则j为最长递增子序列的最后一个元素索引, 否则为0, 因为默认最长递增子序列为第一个元素, 所以j默认为0
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        // 如果arr[j] < arr[i], 则arr[i]可以接在最长递增子序列后面, 所以最长递增子序列长度加1, 并且最长递增子序列的最后一个元素索引为i
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
