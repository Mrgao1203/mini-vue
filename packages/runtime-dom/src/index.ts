import { extend } from '@vue/shared'
import { createRenderer } from 'packages/runtime-core/src/renderer'
import { patchProp } from './patchProp'
import { nodeOps } from './nodeOps'

const rendererOptions = extend({ patchProp }, nodeOps)
let renderer: any

function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions))
}

export const render = (...args: any[]) => {
  ensureRenderer().render(...args)
}
