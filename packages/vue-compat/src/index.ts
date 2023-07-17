import { compile } from '@vue/compiler-core'

function compileToFunction(template: any, options?: any) {
  const { code } = compile(template, options)
  const render = new Function(code)()

  return render
}

export { compileToFunction as compile }
