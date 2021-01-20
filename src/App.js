import React, {Component} from 'react';
import {StyleSheet, StatusBar, View} from 'react-native';
import CameraScreen from './CameraScreen';

export default class App extends Component {
  render() {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <CameraScreen />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
});
