let isFlushPending = false // 是否正在执行 flushJobs 函数

const resolvedPromise = Promise.resolve() // 用于异步执行 flushJobs 函数

// let currentFlushPromise: Promise<void> | null = null // 当前正在执行的 flushJobs 函数

const pendingProFlushCbs: Function[] = [] // flushJobs 函数执行完毕后, 会依次执行这里保存的回调函数

export function queuePreFlushCb(cb: Function) {
  queueCb(cb, pendingProFlushCbs)
}

function queueCb(cb: Function, pendingQueue: Function[]) {
  pendingQueue.push(cb)
  queueFlush()
}

function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true
    // currentFlushPromise = resolvedPromise.then(flushJobs)
    resolvedPromise.then(flushJobs)
  }
}

function flushJobs() {
  isFlushPending = false
  flushPreFlushCbs()
}

export function flushPreFlushCbs() {
  if (pendingProFlushCbs.length) {
    let activePreFlushCbs = [...new Set(pendingProFlushCbs)]
    pendingProFlushCbs.length = 0

    for (let i = 0; i < activePreFlushCbs.length; i++) {
      activePreFlushCbs[i]()
    }
  }
}
