import { isOn } from '@vue/shared'
import { patchClass } from 'packages/runtime-dom/src/modules/class'

export const patchProp = (
  el: Element,
  key: string,
  prevValue: any,
  nextValue: any
) => {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (key === 'style') {
  } else if (isOn(key)) {
  } else {
  }
}
