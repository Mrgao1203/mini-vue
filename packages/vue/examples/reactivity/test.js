class RefImpl {
  // getter
  get value() {
    console.log('get value')

    return 'get value'
  }
  // setter
  set value(val) {
    console.log('set value')
  }
}

let ref = new RefImpl()
ref.value = 'set value'
console.log(ref.value)
console.log('🔞 ~ file: test.js:13 ~ ref:', ref)
