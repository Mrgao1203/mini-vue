import { LifecycleHooks } from './component'

export function injectHook(type: LifecycleHooks, hook: Function, target: any) {
  if (target) {
    target[type] = hook
    return hook
  }
}

const createHook = (lifecycle: LifecycleHooks) => {
  return (hook: Function, target: any) => injectHook(lifecycle, hook, target)
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)

export const onMounted = createHook(LifecycleHooks.MOUNTED)
