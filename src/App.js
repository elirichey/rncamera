import React, {Component} from 'react';
import {StyleSheet, StatusBar, View} from 'react-native';
import Camera from './Camera';

export default class App extends Component {
  render() {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <Camera />
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
