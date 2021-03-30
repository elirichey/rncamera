import React, {Component} from 'react';
import {StyleSheet, View} from 'react-native';
import {PinchGestureHandler, State} from 'react-native-gesture-handler';

export default class ZoomView extends Component {
  onGesturePinch = ({nativeEvent}) => {
    this.props.onPinchProgress(nativeEvent.scale);
  };

  onPinchHandlerStateChange = (event) => {
    let pinch_end = event.nativeEvent.state === State.END;
    let pinch_begin = event.nativeEvent.oldState === State.BEGAN;
    let pinch_active = event.nativeEvent.state === State.ACTIVE;
    if (pinch_end) {
      this.props.onPinchEnd();
    } else if (pinch_begin && pinch_active) {
      this.props.onPinchStart();
    }
  };

  render() {
    return (
      <PinchGestureHandler
        onGestureEvent={this.onGesturePinch}
        onHandlerStateChange={this.onPinchHandlerStateChange}>
        <View style={styles.container}>{this.props.children}</View>
      </PinchGestureHandler>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
