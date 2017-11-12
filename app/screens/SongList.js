import React, { Component } from 'react'
import { FlatList, View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import SongDownloader from '../components/SongDownloader'
import SongTile from '../components/SongTile'

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    backgroundColor: '#000'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: '#fff'
  }
})

const SongList = ({ songs, downloader }) => (
  <View style={styles.listContainer}>
    {songs.length > 0 ?
      <FlatList
        data={songs}
        renderItem={
          ({item}) => <SongTile song={item}/>
        }
        keyExtractor={(item, index) => index}
      />
      :
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No songs have been downloaded.</Text>
      </View>
    }
    {downloader.running && <SongDownloader downloaderState={downloader}/>}
  </View>
)

export default connect(state => ({
    songs: state.songlist.list,
    downloader: state.downloader,
    //player: state.player
}))(SongList)
