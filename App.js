import React from 'react'
import { StackNavigator } from 'react-navigation'
import Player from './app/screens/Player'
import SongList from './app/screens/SongList'

const App = StackNavigator({
  SongList: { screen: SongList },
  Player: { screen: Player }
})

export default App
