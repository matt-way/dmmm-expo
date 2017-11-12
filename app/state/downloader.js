import { 
  CHURN_API_URL, 
  AUDIO_API_URL,
  CHANNEL_SLUG,
  MAX_SONGS
} from '../constants'
import initClient from '../graphql/client'
import { FileSystem } from 'expo'
import { Alert } from 'react-native'
import { addSong } from './songlist'

const gqlClient = initClient({
  url: CHURN_API_URL
})
const initialState = {
  running: false,
  song: null,
  task: null,
  received: 0,
  total: 100,
  error: null,
  downloadingArt: false
}
const handlers = {}

// downloader started
const DOWNLOADER_STARTED = 'DOWNLOADER_STARTED'
const downloaderStarted = () => ({
  type: DOWNLOADER_STARTED
})
handlers[DOWNLOADER_STARTED] = state => ({
  ...initialState,
  running: true
})

// download song art started
const DOWNLOAD_SONGART_STARTED = 'DOWNLOAD_SONGART_STARTED'
const downloadSongArtStarted = (song, task) => ({
  type: DOWNLOAD_SONGART_STARTED,
  song,
  task
})
handlers[DOWNLOAD_SONGART_STARTED] = (state, { song, task }) => ({
  ...state,
  song,
  task,
  downloadingArt: true
})

// download song art progress
const DOWNLOAD_SONGART_PROGRESS = 'DOWNLOAD_SONGART_PROGRESS'
const downloadSongArtProgress = (received, total) => ({
  type: DOWNLOAD_SONGART_PROGRESS,
  received,
  total
})
handlers[DOWNLOAD_SONGART_PROGRESS] = (state, { received, total }) => ({
  ...state,
  received,
  total
})

// download song art complete
const DOWNLOAD_SONGART_COMPLETE = 'DOWNLOAD_SONGART_COMPLETE'
const downloadSongArtComplete = () => ({
  type: DOWNLOAD_SONGART_COMPLETE
})
handlers[DOWNLOAD_SONGART_COMPLETE] = state => ({
  ...state,
  downloadingArt: false,
  task: null,
  received: 0,
  total: 100,
})

// download song started
const DOWNLOAD_SONG_STARTED = 'DOWNLOAD_SONG_STARTED'
const downloadSongStarted = (song, task) => ({
  type: DOWNLOAD_SONG_STARTED,
  song,
  task
})
handlers[DOWNLOAD_SONG_STARTED] = (state, { song, task }) => ({
  ...state,
  song,
  task
})

// download song progress
const DOWNLOAD_SONG_PROGRESS = 'DOWNLOAD_SONG_PROGRESS'
const downloadSongProgress = (received, total) => ({
  type: DOWNLOAD_SONG_PROGRESS,
  received,
  total
})
handlers[DOWNLOAD_SONG_PROGRESS] = (state, { received, total }) => ({
  ...state,
  received,
  total
})

// download song complete
const DOWNLOAD_SONG_COMPLETE = 'DOWNLOAD_SONG_COMPLETE'
const downloadSongComplete = () => ({
  type: DOWNLOAD_SONG_COMPLETE
})
handlers[DOWNLOAD_SONG_COMPLETE] = state => ({
  ...state,
  song: null,
  task: null
})

// downloader error
const DOWNLOADER_ERROR = 'DOWNLOADER_ERROR'
const downloaderError = (err) => ({
  type: DOWNLOADER_ERROR,
  err
})
handlers[DOWNLOADER_ERROR] = (state, { err }) => ({
  ...initialState,
  err
})

// downloader complete
const DOWNLOADER_COMPLETE = 'DOWNLOADER_COMPLETE'
const downloaderComplete = () => ({
  type: DOWNLOAD_SONG_COMPLETE
})
handlers[DOWNLOAD_SONG_COMPLETE] = state => ({
  ...initialState
})

// downloader cancelled
const DOWNLOADER_CANCEL = 'DOWNLOADER_CANCEL'
const downloaderCancel = () => ({
  type: DOWNLOADER_CANCEL
})
handlers[DOWNLOADER_CANCEL] = state => ({
  ...initialState
})

// get a list of songs in the past up to a most recent id, or
// when a limit is hit 
const getListToAdd = mostRecentId => {
  return songlistQuery(30).then(({ data }) => buildList(mostRecentId, data, []))
}

// graphql query for getting a list of songs from a channel
const songlistQuery = (first, cursor) => {
  if(cursor){
    const { youtube_id, channel_position } = cursor
    const channel_id = CHANNEL_SLUG
    return gqlClient.query(`
      query {
        channel(slug: "${CHANNEL_SLUG}"){
          videos(first: ${first}, cursor: {
            channel_id: "${channel_id}"
            youtube_id: "${youtube_id}"
            channel_position: ${channel_position}
          }){
            edges{
              video{
                youtube_id
                title
                duration
                channel_position
              }
            }
          }
        }
      }
    `)
  }else{
    return gqlClient.query(`
      query {
        channel(slug: "${CHANNEL_SLUG}"){
          videos(first: ${first}){
            edges{
              video{
                youtube_id
                title
                duration
                channel_position
              }
            }
          }
        }
      }
    `)
  }
}

// a recursive list builder for finding songs going backwards
// through time
const buildList = (id, data, list) => {
  const videos = data.channel.videos.edges.map(v => v.video)
  const currentIndex = videos.findIndex(i => i.youtube_id === id)
  if(videos.length <= 0){
    return list
  }else if(currentIndex >= 0){
    return list.concat(videos.slice(0, currentIndex))
  }else if(list.length + videos.length >= MAX_SONGS){
    return list.concat(videos)
  }else{
    return songlistQuery(30, videos[videos.length - 1])
      .then(({ data }) => buildList(id, data, list.concat(videos)))
  }
}

// util function for downloading the art portion of a song
const downloadSongArt = (dispatch, song) => {
  console.log('downloading art:')
  console.log(song)

  const task = FileSystem.createDownloadResumable(
    `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`,
    `${FileSystem.documentDirectory}/${song.youtube_id}_art.jpg`,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      console.log('art progress', totalBytesWritten / totalBytesExpectedToWrite)
      dispatch(downloadSongArtProgress(totalBytesWritten, totalBytesExpectedToWrite))
    }
  )

  dispatch(downloadSongArtStarted(song, task))
  return task.downloadAsync()
    .then(() => dispatch(downloadSongArtComplete()))
}
  
// util function for downloading a single song (and song image)
const downloadSong = (dispatch, song) => {
  console.log('downloading song:')
  console.log(song)

  const task = FileSystem.createDownloadResumable(
    `${AUDIO_API_URL}${song.youtube_id}`,
    `${FileSystem.documentDirectory}/${song.youtube_id}`,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      console.log('song progress', totalBytesWritten / totalBytesExpectedToWrite)
      dispatch(downloadSongProgress(totalBytesWritten, totalBytesExpectedToWrite))
    }
  )

  dispatch(downloadSongStarted(song, task))
  return task.downloadAsync()
    .then(() => dispatch(downloadSongComplete()))
}

// sync downloader start thunk
const startSync = mostRecentId => dispatch => {
  dispatch(downloaderStarted())
  // using the most recent id in the song list figure out if songs
  // need to be downloaded by querying the api and figuring out the difference
  return getListToAdd(mostRecentId).then(list => {
    // reverse the list to get songs oldest to newest
    list.reverse()
    // once we have that list, if there are songs start the download process
    // we can just return an empty list, and run the process as well for simplicity
    return list.reduce((p, song) => p
      .then(() => downloadSongArt(dispatch, song))
      .then(() => downloadSong(dispatch, song))
      .then(() => {
        dispatch(addSong(song))
      }),
    Promise.resolve())
      .then(() => {
        dispatch(downloaderComplete())
      })
      .catch(err => {
        dispatch(downloaderError(err))
        Alert.alert('Download Error', err.message, [{ text: 'OK' }])
      })
  })
}

const cancelSync = () => (dispatch, getState) => {
  const state = getState()
  console.log(state)
  // if a song is downloading, cancel it
  dispatch(downloaderCancel())
}

// combined reducer
const reducer = (state = initialState, action) => {
  const handler = handlers[action.type]
  return handler ? handler(state, action) : state
}

export {
  startSync,
  cancelSync,
  reducer
}