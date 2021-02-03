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
      depth: 0,
      viewPortFront: false,
      whiteBalance: 'auto',
      recordOptions: {
        mute: false,
      },
      isRecording: false,
    };
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

  /************************************ TOUCHABLES ************************************/

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

  zoomOut = () => {
    this.setState({
      zoom: this.state.zoom - 0.1 < 0 ? 0 : this.state.zoom - 0.1,
    });
  };

  zoomIn = () => {
    this.setState({
      zoom: this.state.zoom + 0.1 > 1 ? 1 : this.state.zoom + 0.1,
    });
  };

  /************************************ ACTION CONTROLS ************************************/

  takePicture = async function () {
    if (this.camera) {
      const data = await this.camera.takePictureAsync();
      let tag = data.uri;

      console.log('takePicture ', tag);
      CameraRoll.save(tag);
    }
  };

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

  stopVideo = () => {
    this.camera.stopRecording();
    this.setState({isRecording: false});
  };

  /************************************ RENDERS ************************************/

  cameraNotAuthorized = () => {
    return (
      <Text transparent style={styles.cameraNotAuthorized}>
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
      depth,
    } = this.state;

    const drawFocusRingPosition = {
      top: autoFocusPoint.drawRectPosition.y - 32,
      left: autoFocusPoint.drawRectPosition.x - 32,
    };

    return (
      <View style={styles.container}>
        <RNCamera
          ref={(ref) => {
            this.camera = ref;
          }}
          style={styles.cameraView}
          type={
            viewPortFront
              ? RNCamera.Constants.Type.front
              : RNCamera.Constants.Type.back
          }
          flashMode={this.determineFlash()}
          autoFocus={'on'}
          autoFocusPointOfInterest={autoFocusPoint.normalized}
          zoom={zoom}
          whiteBalance={whiteBalance}
          ratio={'16:9'}
          focusDepth={depth}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          notAuthorizedView={this.cameraNotAuthorized()}>
          {/* Touch To Focus */}
          <View style={StyleSheet.absoluteFill}>
            <View style={[styles.autoFocusBox, drawFocusRingPosition]} />
            <TouchableWithoutFeedback onPress={this.touchToFocus}>
              <View style={{flex: 1}} />
            </TouchableWithoutFeedback>
          </View>

          {/* Top Controls */}
          <View style={styles.topControls}>
            <View
              style={{
                flex: 1,
                height: 50,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <TouchableOpacity
                style={styles.topBtn}
                onPress={this.toggleFlash}>
                <Text style={styles.flipText}>FLASH: {flash}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.topBtn}
                onPress={this.toggleWhiteBalance}>
                <Text style={styles.flipText}>WB: {whiteBalance}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.topBtn}
                onPress={this.toggleViewport}>
                <Text style={styles.flipText}>FLIP</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <View
              style={{
                height: 56,
                backgroundColor: 'transparent',
                flexDirection: 'row',
                alignSelf: 'flex-end',
              }}>
              {!isRecording ? (
                <TouchableOpacity
                  onPress={() => this.startVideo()}
                  style={styles.flipButton}>
                  <Text style={styles.flipText}> REC </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => this.stopVideo()}
                  style={styles.flipButton}>
                  <Text style={styles.flipText}> STOP </Text>
                </TouchableOpacity>
              )}
            </View>

            {this.state.zoom !== 0 && (
              <Text style={[styles.flipText, styles.zoomText]}>
                Zoom: {zoom}
              </Text>
            )}

            <View
              style={{
                flexDirection: 'row',
                alignSelf: 'flex-end',
              }}>
              <TouchableOpacity
                style={[styles.flipButton, {flex: 0.1, alignSelf: 'flex-end'}]}
                onPress={this.zoomIn}>
                <Text style={styles.flipText}> + </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.flipButton, {flex: 0.1, alignSelf: 'flex-end'}]}
                onPress={this.zoomOut}>
                <Text style={styles.flipText}> - </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={this.takePicture}
                style={styles.flipButton}>
                <Text style={styles.flipText}> SNAP </Text>
              </TouchableOpacity>
            </View>
          </View>
        </RNCamera>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#000011',
  },
  cameraView: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Main Containers
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraNotAuthorized: {
    padding: 40,
    paddingTop: 72,
  },

  // Buttons
  topBtn: {
    flex: 1,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**************** Stock UI Styles ****************/

  flipButton: {
    flex: 0.3,
    height: 40,
    marginHorizontal: 2,
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 8,
    borderColor: 'white',
    borderWidth: 1,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoFocusBox: {
    position: 'absolute',
    height: 64,
    width: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    opacity: 0.4,
  },
  flipText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  zoomText: {
    position: 'absolute',
    bottom: 70,
    zIndex: 2,
    left: 2,
  },
  picButton: {
    backgroundColor: 'darkseagreen',
  },
});
