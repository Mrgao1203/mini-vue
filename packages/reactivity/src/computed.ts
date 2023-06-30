import { isFunction } from '@vue/shared'
import { Dep } from './dep'
import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'

export class ComputedRefImpl<T> {
  public dep?: Dep = undefined

  private _value!: T

  public readonly effect: ReactiveEffect<T>

  public readonly __v_isRef = true

  public _dirty = true

  constructor(getter: any) {
    // 1. 创建一个副作用 effect 对象
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        triggerRefValue(this as any)
      }
    })

    this.effect.computed = this
  }

  get value() {
    // 2. 执行副作用函数，进行依赖收集
    trackRefValue(this as any)
    if (this._dirty) {
      this._dirty = false
      // 3. 返回副作用函数的执行结果
      this._value = this.effect.run()
    }

    return this._value
  }

  set value(newValue) {}
}

export function computed(getterOrOptions: any) {
  let getter

  const onlyGetter = isFunction(getterOrOptions)

  if (onlyGetter) {
    getter = getterOrOptions
  }

  const cRef = new ComputedRefImpl(getter)
  return cRef
}
