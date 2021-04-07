import React, {Component} from 'react';
import {StyleSheet, StatusBar, View} from 'react-native';
import VideoCamera from './VideoCamera';
import ImageCamera from './ImageCamera';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showVideo: false,
    };
  }
  render() {
    let {showVideo} = this.state;
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        {showVideo ? <VideoCamera /> : <ImageCamera />}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#000000',
  },
});
