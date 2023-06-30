import { queuePreFlushCb } from '@vue/runtime-core'
import { EMPTY_OBJ, hasChanged, isObject } from '@vue/shared'
import { ReactiveEffect } from 'packages/reactivity/src/effect'
import { isReactive } from 'packages/reactivity/src/reactive'

interface WatchOptions<immediate = boolean> {
  immediate: immediate
  deep?: boolean
}

export function watch(source: any, cb: Function, options?: WatchOptions) {
  return doWatch(source, cb, options)
}

function doWatch(source: any, cb: Function, { immediate, deep } = EMPTY_OBJ) {
  let getter: () => any

  if (isReactive(source)) {
    getter = () => source
    deep = true
  } else {
    getter = () => {}
  }

  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  let oldValue = {}
  let scheduler = () => queuePreFlushCb(job)
  const effect = new ReactiveEffect(getter, scheduler)
  const job = () => {
    if (cb) {
      const newValue = effect.run()
      if (deep || hasChanged(newValue, oldValue)) {
        cb(newValue, oldValue)
        oldValue = newValue
      }
    }
  }
  //
  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  } else {
    effect.run()
  }

  return () => {
    effect.stop()
  }
}

export function traverse(value: unknown) {
  if (!isObject(value)) return value
  for (const key in value as object) {
    traverse(value[key])
  }
  return value
}
