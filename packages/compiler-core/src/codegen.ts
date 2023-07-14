import { helperNameMap } from './tansformElement'

export function generate(ast: any) {
  const context = createCodegenContext(ast)
}
function createCodegenContext(ast: any) {
  const context = {
    code: '',
    runtimeGlobalName: `Vue`,
    source: ast.loc.source,
    indentLevel: 0,
    helper(key: any) {
      return `_${helperNameMap[key]}`
    },
    push(code: any) {
      context.code += code
    },
    newLine() {
      newLine(context.indentLevel)
    },
    indent() {
      newLine(++context.indentLevel)
    },
    deindent() {
      newLine(--context.indentLevel)
    }
  }
  function newLine(n: number) {
    context.code += '\n' + `  `.repeat(n)
  }
  return context
}
