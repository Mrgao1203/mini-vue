export function patchClass(el: Element, value: string | null) {
  if (!value) {
    el.removeAttribute('class')
  } else {
    el.className = value
  }
}
