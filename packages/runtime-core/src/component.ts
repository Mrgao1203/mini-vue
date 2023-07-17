import { reactive } from '@vue/reactivity'
import { isFunction, isObject } from '@vue/shared'
import { onBeforeMount, onMounted } from './apiLIfecycle'

let uuid = 0

export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm'
}

export function createComponentInstance(vnode: any) {
  const type = vnode.type
  console.log(
    '❓ - file: component.ts:16 - createComponentInstance - type:',
    JSON.stringify({ type })
  )
  const instance = {
    uuid: uuid++,
    vnode,
    type,
    subTree: null,
    effect: null,
    update: null,
    render: null,
    isMounted: false,
    bc: null,
    c: null,
    bm: null,
    m: null
  }
  console.log(
    '❓ - file: component.ts:34 - createComponentInstance - instance:',
    JSON.stringify(instance)
  )
  return instance
}
export function setupComponent(instance: any) {
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type
  const { setup } = Component
  if (setup) {
    const setupResult = setup()
    handleSetupResult(instance, setupResult)
  } else {
    finishComponentSetup(instance)
  }
}
export function handleSetupResult(instance: any, setupResult: any) {
  if (isFunction(setupResult)) {
    instance.render = setupResult
  }
  finishComponentSetup(instance)
}

export function finishComponentSetup(instance: any) {
  const Component = instance.type
  console.log(
    '❓ - file: component.ts:63 - finishComponentSetup - Component:',
    JSON.stringify(Component)
  )
  if (!instance.render) {
    instance.render = Component.render
  }

  applyOptions(instance)
}

function applyOptions(instance: any) {
  const {
    data: dataOptions,
    beforeCreate,
    created,
    beforeMount,
    mounted
  } = instance.type

  if (beforeCreate) {
    callHook(beforeCreate, instance.data)
  }

  if (dataOptions) {
    const data = dataOptions()
    if (isObject(data)) {
      instance.data = reactive(data)
    }
  }
  if (created) {
    callHook(created, instance.data)
  }
  function registerLifecycleHook(register: Function, hook?: Function) {
    register(hook?.bind(instance.data), instance)
  }

  registerLifecycleHook(onBeforeMount, beforeMount)
  registerLifecycleHook(onMounted, mounted)
}
function callHook(hook: Function, proxy: any) {
  hook.bind(proxy)()
}
