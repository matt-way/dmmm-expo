
const initialState = {}
const handlers = {}

// combined reducer
const reducer = (state = initialState, action) => {
  const handler = handlers[action.type]
  return handler ? handler(state, action) : state
}

export {
  //initList,
  reducer
}