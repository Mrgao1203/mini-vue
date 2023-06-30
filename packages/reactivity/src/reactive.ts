import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandlers'

export const reactiveMap = new WeakMap<object, any>()

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

function createReactiveObject(
  target: object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>
) {
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, baseHandlers)

  proxy[ReactiveFlags.IS_REACTIVE] = true

  proxyMap.set(target, proxy)

  return proxy
}

export const toReactive = <T extends unknown>(value: T): T => {
  return isObject(value) ? reactive(value as any) : value
}

export const isReactive = (value: any): boolean => {
  return !!(value && value[ReactiveFlags.IS_REACTIVE] === true)
}
/**
 * 问题一: 为什么要用 WeakMap?
 *
 *
 * WeakMap: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
 * 1. key 必须是对象
 * 2. key 必须是弱引用
 *    2.1. 弱引用: 一旦没有其他的变量或属性引用这个对象, 则这个对象会被垃圾回收器回收
 *    2.2. 强引用: 一旦有一个变量或属性引用这个对象, 则这个对象不会被垃圾回收器回收
 *
 * Map: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map
 *
 * 问题二:mutableHandlers 有什么用?
 *
 * 问题三:每次都要打包吗?
 */
