export const isArray = Array.isArray
export const isObject = (val: unknown): val is Record<any, any> => {
  return val !== null && typeof val === 'object'
}
// 对比两个数据是否发生改变
export const hasChanged = (newValue: any, oldValue: any): boolean => {
  return !Object.is(newValue, oldValue)
}
export const isFunction = (val: unknown): val is Function => {
  return typeof val === 'function'
}
export const extend = Object.assign

export const EMPTY_OBJ: { readonly [key: string]: any } = {}

export const isVNode = (value: any) => {
  return value.__v_isVNode ? true : false
}
export const isString = (val: unknown): val is string => {
  return typeof val === 'string'
}

const onRe = /^on[^a-z]/
export const isOn = (key: string) => onRe.test(key)
