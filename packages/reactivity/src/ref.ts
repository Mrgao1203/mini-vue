import { Dep, createDep } from './dep'
import { activeEffect, trackEffects, triggerEffects } from './effect'
import { toReactive } from './reactive'
import { hasChanged } from '../../shared/src'
export interface Ref<T = any> {
  value: T
}

export function ref(value?: unknown) {
  return createRef(value, false)
}

function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }

  return new RefImpl(rawValue, shallow)
}

class RefImpl<T> {
  private _value: T

  private _rowValue: T

  public dep?: Dep = void 0

  public readonly __v_isRef = true

  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._rowValue = value
    this._value = __v_isShallow ? value : toReactive(value)
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(newValue) {
    if (hasChanged(newValue, this._rowValue)) {
      this._rowValue = newValue
      this._value = toReactive(newValue)
      triggerRefValue(this)
    }
  }
}
// 收集依赖
export function trackRefValue(ref: RefImpl<any>) {
  if (activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}
// 触发依赖
export function triggerRefValue(ref: RefImpl<any>) {
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}
/**
 * 判断是否是 ref
 */
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}
