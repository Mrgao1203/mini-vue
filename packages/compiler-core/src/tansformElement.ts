export const CREATE_ELEMENT_VNODE = Symbol('createElementVNode')

export const CREATE_VNODE = Symbol('createVNode')

export const helperNameMap: Record<string, any> = {
  [CREATE_ELEMENT_VNODE]: 'createELementVNode',
  [CREATE_VNODE]: 'createVNode'
}
