import { AsyncStorage } from 'react-native'
import { STORAGE_KEY } from '../constants'

const initialState = {
  list: []
}
const handlers = {}

// song list loading
const SONGLIST_LOADING = 'SONGLIST_LOADING'
const listLoading = () => ({
  type: SONGLIST_LOADING
})
handlers[SONGLIST_LOADING] = state => ({
  ...initialState,
  listLoading: true
})

// song list loaded
const SONGLIST_LOADED = 'SONGLIST_LOADED'
const listLoaded = list => ({
  type: SONGLIST_LOADED,
  list
})
handlers[SONGLIST_LOADED] = (state, { list }) => ({
  ...initialState,
  list
})

// song list error
const SONGLIST_ERROR = 'SONGLIST_ERROR'
const listError = error => ({
  type: SONGLIST_ERROR,
  error
})
handlers[SONGLIST_ERROR] = (state, { error }) => ({
  ...state,
  error
})

// adding a song
const SONG_ADDING = 'SONG_ADDING'
const songAdding = () => ({
  type: SONG_ADDING
})
handlers[SONG_ADDING] = state => ({
  ...state,
  addingSong: true
})

// song was added
const SONG_ADDED = 'SONG_ADDED'
const songAdded = song => ({
  song,
  type: SONG_ADDED
})
handlers[SONG_ADDED] = (state, { song }) => ({
  ...state,
  list: [song, ...state.list]
})


// init list thunk action
const initList = () => dispatch => {
  dispatch(listLoading())
  return AsyncStorage.getItem(STORAGE_KEY)
    .then(JSON.parse)
    .then(list => dispatch(listLoaded(list || [])))
    .catch(error => dispatch(listError({ error })))
}

// add song to list thunk action
const addSong = song => dispatch => {
  dispatch(songAdding())
  // do a list replace
  return AsyncStorage.getItem(STORAGE_KEY)
    .then(stringList => {
      const newList = JSON.parse(stringList) || []
      newList.unshift(song)
      return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList))
    })
    .then(() => dispatch(songAdded(song)))
    .catch(err => {
      dispatch(listError(err))
      // re-reject the error so that parents can deal with it as well
      return Promise.reject(err)
    })
}

// combined reducer
const reducer = (state = initialState, action) => {
  const handler = handlers[action.type]
  console.log(action)
  return handler ? handler(state, action) : state
}

export {
  initList,
  addSong,
  reducer
}