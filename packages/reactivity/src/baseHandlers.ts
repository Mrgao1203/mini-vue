import { track, trigger } from './effect'

const get = createGetter()
const set = createSetter()
function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver)
    track(target, key)
    return res
  }
}

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: any
  ) {
    const result = Reflect.set(target, key, value, receiver)
    trigger(target, key, value)
    return result
  }
}
export const mutableHandlers: ProxyHandler<object> = {
  // 核心
  get,
  set
}
