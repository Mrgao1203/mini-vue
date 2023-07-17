import { isString } from '@vue/shared'

export function patchStyle(el: Element, prev: any, next: any) {
  const style = (el as HTMLElement).style
  const isCssString = isString(next)
  if (next && !isCssString) {
    for (const key in next) {
      setStyle(style, key, next[key])
    }
    if (prev && !isString(prev)) {
      for (const key in prev) {
        if (!next[key]) {
          setStyle(style, key, '')
        }
      }
    }
  }
}

function setStyle(style: CSSStyleDeclaration, key: string, value: string) {
  if (key[0] === '-') {
    style.setProperty(key, value)
  } else {
    style[key as any] = value
  }
}
