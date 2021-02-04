import React, {Component} from 'react';
import {
  Platform,
  PermissionsAndroid,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import CameraRoll from '@react-native-community/cameraroll';
import ZoomView from './ZoomView';

export default class Camera extends Component {
  constructor(props) {
    super(props);

    this.state = {
      flash: 'off',
      zoom: 0,
      autoFocusPoint: {
        normalized: {x: 0.5, y: 0.5},
        drawRectPosition: {
          x: Dimensions.get('window').width * 0.5 - 32,
          y: Dimensions.get('window').height * 0.5 - 32,
        },
      },
      autoFocus: {x: 0.5, y: 0.5, autoExposure: true},
      viewPortFront: false,
      whiteBalance: 'auto',
      recordOptions: {
        mute: false,
      },
      isRecording: false,
    };

    this.zoom_value = 0.01;
  }

  componentDidMount = async () => {
    if (Platform.OS === 'android' && !(await this.hasAndroidPermission())) {
      return;
    }
  };

  hasAndroidPermission = async () => {
    const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
    const hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) {
      return true;
    }
    const status = await PermissionsAndroid.request(permission);
    return status === 'granted';
  };

  /************************************ TOP CONTROLS ************************************/

  toggleViewport = () => {
    this.setState({
      viewPortFront: this.state.viewPortFront ? false : true,
      zoom: 0,
    });
  };

  toggleFlash = () => {
    let {flash} = this.state;

    switch (flash) {
      case 'off':
        return this.setState({flash: 'on'});
      case 'on':
        return this.setState({flash: 'torch'});
      case 'torch':
        return this.setState({flash: 'auto'});
      case 'auto':
        return this.setState({flash: 'off'});
      default:
        return this.setState({flash: 'off'});
    }
  };

  determineFlash = () => {
    let {flash} = this.state;
    switch (flash) {
      case 'off':
        return RNCamera.Constants.FlashMode.off;
      case 'on':
        return RNCamera.Constants.FlashMode.on;
      case 'auto':
        return RNCamera.Constants.FlashMode.auto;
      case 'torch':
        return RNCamera.Constants.FlashMode.torch;
      default:
        return RNCamera.Constants.FlashMode.off;
    }
  };

  toggleWhiteBalance = () => {
    let {whiteBalance} = this.state;

    switch (whiteBalance) {
      case 'auto':
        return this.setState({whiteBalance: 'sunny'});
      case 'sunny':
        return this.setState({whiteBalance: 'cloudy'});
      case 'cloudy':
        return this.setState({whiteBalance: 'shadow'});
      case 'shadow':
        return this.setState({whiteBalance: 'fluorescent'});
      case 'fluorescent':
        return this.setState({whiteBalance: 'incandescent'});
      case 'incandescent':
        return this.setState({whiteBalance: 'auto'});
      default:
        return this.setState({whiteBalance: 'auto'});
    }
  };

  /************************************ GESTURE CONTROLS ************************************/

  touchToFocus = (event) => {
    const {pageX, pageY} = event.nativeEvent;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const isPortrait = screenHeight > screenWidth;

    let x = pageX / screenWidth;
    let y = pageY / screenHeight;

    if (isPortrait) {
      x = pageY / screenHeight;
      y = -(pageX / screenWidth) + 1;
    }

    this.setState({
      autoFocusPoint: {
        normalized: {x, y},
        drawRectPosition: {x: pageX, y: pageY},
      },
    });
  };

  onPinchStart = () => {
    this._prevPinch = 1;
  };

  onPinchEnd = () => {
    this._prevPinch = 1;
  };

  onPinchProgress = (p) => {
    let p2 = p - this._prevPinch;
    if (p2 > 0 && p2 > this.zoom_value) {
      this._prevPinch = p;
      this.setState(
        {zoom: Math.min(this.state.zoom + this.zoom_value, 1)},
        () => {},
      );
    } else if (p2 < 0 && p2 < -this.zoom_value) {
      this._prevPinch = p;
      this.setState(
        {zoom: Math.max(this.state.zoom - this.zoom_value, 0)},
        () => {},
      );
    }
  };

  /************************************ ACTION CONTROLS ************************************/

  startVideo = async () => {
    const {isRecording} = this.state;
    if (this.camera && !isRecording) {
      try {
        const promise = this.camera.recordAsync(this.state.recordOptions);

        if (promise) {
          this.setState({isRecording: true});
          const data = await promise;
          let tag = data.uri;

          console.log('startVideo', tag);
          CameraRoll.save(tag);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  stopVideo = async () => {
    await this.camera.stopRecording();
    this.setState({isRecording: false});
  };

  /************************************ RENDERS ************************************/

  cameraNotAuthorized = () => {
    return (
      <Text transparent style={styles.camera_not_authorized_txt}>
        Camera access was not granted. Please go to your phone's settings and
        allow camera access.
      </Text>
    );
  };

  render() {
    const {
      isRecording,
      autoFocusPoint,
      viewPortFront,
      flash,
      zoom,
      whiteBalance,
    } = this.state;

    return (
      <View style={styles.container}>
        <RNCamera
          ref={(ref) => {
            this.camera = ref;
          }}
          style={styles.camera_view}
          type={
            viewPortFront
              ? RNCamera.Constants.Type.front
              : RNCamera.Constants.Type.back
          }
          flashMode={this.determineFlash()}
          autoFocus={RNCamera.Constants.AutoFocus.on}
          autoFocusPointOfInterest={autoFocusPoint.normalized}
          zoom={zoom}
          whiteBalance={whiteBalance}
          ratio={'16:9'}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          notAuthorizedView={this.cameraNotAuthorized()}>
          <ZoomView
            onPinchEnd={this.onPinchEnd}
            onPinchStart={this.onPinchStart}
            onPinchProgress={this.onPinchProgress}>
            {/* Touch To Focus */}
            <View style={styles.focus_container}>
              <TouchableWithoutFeedback onPress={this.touchToFocus}>
                <View style={{flex: 1}} />
              </TouchableWithoutFeedback>
            </View>

            {/* Top Controls */}
            <View style={styles.top_controls_container}>
              <View
                style={{
                  flex: 1,
                  height: 50,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <TouchableOpacity
                  style={styles.camera_control_btn}
                  onPress={this.toggleFlash}>
                  <Text style={styles.btn_txt}>FLASH: {flash}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.camera_control_btn}
                  onPress={this.toggleWhiteBalance}>
                  <Text style={styles.btn_txt}>WB: {whiteBalance}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.camera_control_btn}
                  onPress={this.toggleViewport}>
                  <Text style={styles.btn_txt}>FLIP</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottom_controls_container}>
              <View style={styles.bottom_controls}>
                {!isRecording ? (
                  <TouchableOpacity
                    onPress={() => this.startVideo()}
                    style={styles.btn_container}>
                    <Text style={styles.btn_txt}> REC </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => this.stopVideo()}
                    style={styles.btn_container_active}>
                    <Text style={styles.btn_txt}> STOP </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ZoomView>
        </RNCamera>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera_view: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Containers
  focus_container: {
    ...StyleSheet.absoluteFill,
  },
  top_controls_container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bottom_controls_container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottom_controls: {
    flexDirection: 'row',
    alignSelf: 'center',
    paddingBottom: 100,
  },
  camera_not_authorized_txt: {
    padding: 40,
    paddingTop: 72,
  },

  // Buttons
  camera_control_btn: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn_container: {
    height: 100,
    width: 100,
    marginHorizontal: 2,
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 50,
    borderColor: '#FFFFFF',
    borderWidth: 1,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn_container_active: {
    height: 100,
    width: 100,
    marginHorizontal: 2,
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 50,
    borderColor: '#FF0000',
    borderWidth: 1,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn_txt: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});
