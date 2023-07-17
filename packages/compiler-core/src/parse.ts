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
  const match: any = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source)

  const tag = match[1]

  advanceBy(context, match[0].length)

  let isSelfClosing = startWith(context.source, '/>')

  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType: ElementTypes.ELEMENT,
    props: [],
    children: [] as any[]
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
    for (let i = ancestors.length - 1; i <= 0; i--) {
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
