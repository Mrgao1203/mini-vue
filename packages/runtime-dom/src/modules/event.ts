export function patchEvent(
  el: Element & { _vei?: Object },
  rawName: string,
  prev: any,
  next: any
) {
  const invokers: any = el._vei || (el._vei = {})
  const existingInvoker = invokers[rawName]
  if (next && existingInvoker) {
    existingInvoker.value = next
  } else {
    const name = parseName(rawName)
    if (next) {
      const invoker = (invokers[rawName] = createInvoker(next))

      el.addEventListener(name, invoker)
    } else if (existingInvoker) {
      el.removeEventListener(name, existingInvoker)
      invokers[rawName] = undefined
    }
  }
}
function parseName(name: string) {
  return name.slice(2).toLowerCase()
}

function createInvoker(initialValue: any) {
  const invoker = (e: Event) => {
    invoker.value && invoker.value(e)
  }
  invoker.value = initialValue
  return invoker
}
