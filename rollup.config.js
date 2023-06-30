import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'

export default [
  {
    // 入口文件
    input: 'packages/vue/src/index.ts',
    // 打包出口
    output: [
      // 导出 iife 模式
      {
        sourcemap: true,
        // 导出文件地址
        file: './packages/vue/dist/vue.js',
        // 生成包的格式
        format: 'iife',
        // 变量名
        name: 'Vue'
      }
    ],
    // 插件
    plugins: [
      // 解析 ts
      typescript({
        sourceMap: true,
        tsconfig: './tsconfig.json'
      }),
      // 解析 commonjs 模块 (node_modules) 为 es6 模块 (rollup 支持的模块)
      commonjs(),
      // 路径补全
      resolve()
    ]
  }
]
