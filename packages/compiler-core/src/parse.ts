import { ElementTypes, NodeTypes } from './ast'

const enum TagType {
  Start,
  End
}
export interface ParseContent {
  source: string
}

function createParseContent(content: string): ParseContent {
  return {
    source: content
  }
}

export function baseParse(content: string) {
  const context = createParseContent(content)

  const children = parseChildren(context, [])

  return createRoot(children)
}

export function createRoot(children: any) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc: {}
  }
}
function parseChildren(context: ParseContent, ancestors: any[]) {
  const nodes: any[] = []

  while (!isEnd(context, ancestors)) {
    const s = context.source

    let node: any
    if (startWith(s, '{{')) {
      node = parseInterpolation(context)
    } else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }

    if (!node) {
      node = parseText(context)
    }

    pushNode(nodes, node)
  }

  return nodes
}

function parseInterpolation(context: ParseContent) {
  const [open, close] = ['{{', '}}']

  advanceBy(context, open.length)

  const closeIndex = context.source.indexOf(close, open.length)

  const preTrimContent = parseTextData(context, closeIndex)

  const content = preTrimContent.trim()

  advanceBy(context, close.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      content
    }
  }
}

function parseElement(context: ParseContent, ancestors: any[]) {
  const element = parseTag(context, TagType.Start)

  ancestors.push(element)

  const children = parseChildren(context, ancestors)

  ancestors.pop()

  element.children = children

  if (startWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  }

  return element
}

function parseTag(context: ParseContent, type: TagType) {
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)!

  const tag = match[1]

  advanceBy(context, match[0].length)

  // 属性和指令的处理
  advanceSpaces(context)
  let props = parseAttributes(context, type)

  let isSelfClosing = startWith(context.source, '/>')

  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType: ElementTypes.ELEMENT,
    props,
    children: [] as any[]
  }
}

function parseAttributes(context: ParseContent, type: TagType) {
  const props: any = []
  const attributeName = new Set<string>()
  while (
    context.source.length > 0 &&
    !startWith(context.source, '>') &&
    !startWith(context.source, '/>')
  ) {
    const attr = parseAttribute(context, attributeName)
    if (type === TagType.Start) {
      props.push(attr)
    }

    advanceSpaces(context)
  }
  return props
}

function parseAttribute(context: ParseContent, nameSet: Set<string>) {
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!
  const name = match[0]
  console.log('❓ - file: parse.ts:143 - parseAttribute - name:', name)
  nameSet.add(name)

  advanceBy(context, name.length)

  let value = undefined

  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context)
    advanceBy(context, 1)
    advanceSpaces(context)

    value = parseAttributeValue(context)
  }

  // v-
  if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    const match =
      /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
        name
      )!

    let dirName = match[1]
    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        loc: {}
      },
      arg: undefined,
      modifiers: undefined,
      loc: {}
    }
  }

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: {}
    },
    loc: {}
  }
}

function parseAttributeValue(context: ParseContent) {
  let content = ''

  const quote = context.source[0]
  advanceBy(context, 1)
  const endIndex = context.source.indexOf(quote)
  if (endIndex === -1) {
    content = parseTextData(context, context.source.length)
  } else {
    content = parseTextData(context, endIndex)
    advanceBy(context, 1)
  }

  return { content, isQuoted: true, loc: {} }
}

function advanceSpaces(context: ParseContent): void {
  const match = /^[\t\r\n\f ]+/.exec(context.source)

  if (match) {
    advanceBy(context, match[0].length)
  }
}

function parseText(context: ParseContent) {
  const endTokens = ['<', '{{']

  let endIndex = context.source.length

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }
  const content = parseTextData(context, endIndex)

  return { type: NodeTypes.TEXT, content }
}

function parseTextData(context: ParseContent, length: number) {
  const rawText = context.source.slice(0, length)
  advanceBy(context, length)
  return rawText
}

function pushNode(nodes: any[], node: any) {
  nodes.push(node)
}

function isEnd(context: ParseContent, ancestors: any) {
  const s = context.source

  if (startWith(s, '</')) {
    for (let i = ancestors.length - 1; i >= 0; --i) {
      if (startWithEndTagOpen(s, ancestors[i].tag)) {
        return true
      }
    }
  }

  return !s
}

function startWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString)
}

function startWithEndTagOpen(source: string, tag: string): boolean {
  return startWith(source, '</')
}

function advanceBy(context: ParseContent, numberOfCharacters: number) {
  const { source } = context
  context.source = source.slice(numberOfCharacters)
}
