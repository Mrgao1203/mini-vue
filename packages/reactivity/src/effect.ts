import { extend } from '@vue/shared'
import { ComputedRefImpl } from './computed'
import { Dep, createDep } from './dep'

// 副作用函数 scheduler 类型
export type EffectScheduler = (...args: any[]) => any

export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
}
/**
 * 收集依赖
 * @param target
 * @param key
 */
export function track(target: object, key: unknown) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }

  trackEffects(dep)
}
/**
 * 利用 dep 依次跟踪制定 key 的所有 effect
 */
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
}

/**
 * 触发依赖
 * @param target
 * @param key
 * @param newValue
 */
export function trigger(target: object, key: unknown, newValue: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep: Dep | undefined = depsMap.get(key)

  if (!dep) return

  triggerEffects(dep)
}
/**
 * 依次触发 Dep 中保存的依赖
 */
export function triggerEffects(dep: Dep) {
  const effects = Array.isArray(dep) ? dep : Array.from(dep)

  // 依次触发依赖
  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect)
    }
  }

  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect)
    }
  }
}

/**
 * 触发
 * @param effect
 */

export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    effect.scheduler()
  } else {
    effect.run()
  }
}
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

export let activeEffect: ReactiveEffect | undefined

export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  const _effect = new ReactiveEffect(fn)

  if (options) {
    extend(_effect, options) // 将 options 中的属性拷贝到 _effect 中
  }

  // lazy: true 时, 不会立即执行 fn 函数 (默认为 false)
  if (!options || !options.lazy) {
    _effect.run()
  }
}

// 副作用函数
export class ReactiveEffect<T = any> {
  computed?: ComputedRefImpl<T>

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null
  ) {}
  run() {
    activeEffect = this
    return this.fn()
  }
  stop() {}
}
