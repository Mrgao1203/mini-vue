import { extend } from '@vue/shared'
import { generate } from 'packages/compiler-core/src/codegen'
import { baseParse } from 'packages/compiler-core/src/parse'
import { transform } from 'packages/compiler-core/src/transform'
import { transformElement } from 'packages/compiler-core/src/transforms/transformElement'
import { transformText } from 'packages/compiler-core/src/transforms/transformText'

export function baseCompile(template: string, options: any = {}) {
  const ast = baseParse(template)
  console.log('❓ - file: compile.ts:10 - baseCompile - ast:', ast)
  console.log(
    '❓ - file: compile.ts:10 - baseCompile - ast:',
    JSON.parse(JSON.stringify(ast))
  )
  transform(
    ast,
    extend(options, {
      nodeTransforms: [transformElement, transformText]
    })
  )

  return generate(ast)
}
