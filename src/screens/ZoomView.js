import React, {Component} from 'react';
import {View, PanResponder, Dimensions} from 'react-native';

export default class ZoomView extends Component {
  constructor(props) {
    super(props);
    this.touchNum = 0;
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,

      onMoveShouldSetPanResponder: (evt, gestureState) => true,

      onPanResponderMove: (e, {dy}) => {
        this.touchNum = e.nativeEvent.touches.length;
        console.log('this is native event : ', e.nativeEvent);
        const {height: windowHeight} = Dimensions.get('window');
        console.log('ZOOM MOVE PAN RESPONDER');
        return this.props.onZoomProgress(
          Math.min(Math.max((dy * -1) / windowHeight, 0), 1),
        );
      },

      onMoveShouldSetPanResponder: (ev, {dx}) => {
        console.log('ZOOM SET PAN RESPONDER');
        return dx !== 0;
      },

      onPanResponderGrant: () => {
        return this.props.onZoomStart();
      },

      onPanResponderRelease: (e, gestureState) => {
        let focusCor = {x: 0.5, y: 0.5};
        if (this.touchNum == 1) {
          focusCor = {x: gestureState.x0, y: gestureState.y0};
        }
        return this.props.onZoomEnd(focusCor);
      },
    });
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.25)',
        }}
        {...this.panResponder.panHandlers}>
        {this.props.children}
      </View>
    );
  }
}
