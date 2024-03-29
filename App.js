import React, { Component } from 'react'
import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import { StackNavigator } from 'react-navigation'
import { initList, reducer as songlist } from './app/state/songlist'
import { startSync, reducer as downloader } from './app/state/downloader'
import { reducer as player } from './app/state/player'
import Player from './app/screens/Player'
import SongList from './app/screens/SongList'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
const store = createStore(
  combineReducers({
    songlist,
    downloader,
    player
  }),
  composeEnhancers(applyMiddleware(thunk))
)

const Nav = StackNavigator({
  SongList: { screen: SongList },
  Player: { screen: Player }
})

class App extends Component {
  componentDidMount() {
    // start the song list process
    store.dispatch(initList())
      .then(() => {
        const state = store.getState()
        const { list } = state.songlist
        const id = list.length > 0 ? list[0].youtube_id : undefined
        console.log('the id', id)
        store.dispatch(startSync(id))
      })
      .catch(err => {
        console.log(err)
      })
  }

  render() {
    return (
      <Provider store={store}>
        <Nav/>
      </Provider>
    )
  }
}

export default App
