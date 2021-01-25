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

const flashModeOrder = {
  off: 'on',
  on: 'auto',
  auto: 'torch',
  torch: 'off',
};

const wbOrder = {
  auto: 'sunny',
  sunny: 'cloudy',
  cloudy: 'shadow',
  shadow: 'fluorescent',
  fluorescent: 'incandescent',
  incandescent: 'auto',
};

export default class Camera extends Component {
  constructor(props) {
    super(props);

    this.state = {
      flash: 'off',
      zoom: 0,
      autoFocusPoint: {
        normalized: {x: 0.5, y: 0.5}, // normalized values required for autoFocusPointOfInterest
        drawRectPosition: {
          x: Dimensions.get('window').width * 0.5 - 32,
          y: Dimensions.get('window').height * 0.5 - 32,
        },
      },
      depth: 0,
      type: 'back',
      whiteBalance: 'auto',
      recordOptions: {
        mute: false,
        maxDuration: 5,
        quality: RNCamera.Constants.VideoQuality['288p'],
      },
      isRecording: false,
    };
  }

  componentDidMount = async () => {
    if (Platform.OS === 'android' && !(await this.hasAndroidPermission())) {
      return;
    }
  };

  toggleViewport = () => {
    this.setState({
      type: this.state.type === 'back' ? 'front' : 'back',
    });
  };

  toggleFlash = () => {
    this.setState({
      flash: flashModeOrder[this.state.flash],
    });
  };

  toggleWhiteBalance = () => {
    this.setState({
      whiteBalance: wbOrder[this.state.whiteBalance],
    });
  };

  touchToFocus = (event) => {
    const {pageX, pageY} = event.nativeEvent;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const isPortrait = screenHeight > screenWidth;

    let x = pageX / screenWidth;
    let y = pageY / screenHeight;
    // Coordinate transform for portrait. See autoFocusPointOfInterest in docs for more info
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

  setFocusDepth = (depth) => {
    this.setState({
      depth,
    });
  };

  hasAndroidPermission = async () => {
    const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

    const hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) {
      console.log('HAS PERMISSIONS');
      return true;
    }

    console.log('NO PERMISSIONS');

    const status = await PermissionsAndroid.request(permission);
    console.log('PERMISSIONS GRANTED!');
    return status === 'granted';
  };

  takePicture = async function () {
    if (this.camera) {
      const data = await this.camera.takePictureAsync();
      let tag = data.uri;

      // Need a new promise here before saving?
      console.log('takePicture ', tag);

      // Save Location
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

          // Save Location
          CameraRoll.save(tag);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  renderRecording = () => {
    const {isRecording} = this.state;
    const backgroundColor = isRecording ? 'white' : 'darkred';
    const action = isRecording ? this.stopVideo : this.startVideo;
    const button = isRecording ? this.renderStopRecBtn() : this.renderRecBtn();
    return (
      <TouchableOpacity
        style={[
          styles.flipButton,
          {
            flex: 0.3,
            alignSelf: 'flex-end',
            backgroundColor,
          },
        ]}
        onPress={() => action()}>
        {button}
      </TouchableOpacity>
    );
  };

  stopVideo = async () => {
    await this.camera.stopRecording();
    this.setState({isRecording: false});
  };

  renderRecBtn = () => {
    return <Text style={styles.flipText}> REC </Text>;
  };

  renderStopRecBtn = () => {
    return <Text style={styles.flipText}> STOP </Text>;
  };

  renderCamera = () => {
    const {autoFocusPoint, type, flash, zoom, whiteBalance, depth} = this.state;

    const drawFocusRingPosition = {
      top: autoFocusPoint.drawRectPosition.y - 32,
      left: autoFocusPoint.drawRectPosition.x - 32,
    };

    return (
      <RNCamera
        ref={(ref) => {
          this.camera = ref;
        }}
        style={styles.cameraView}
        type={type}
        flashMode={flash}
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
        faceDetectionLandmarks={undefined}
        onFacesDetected={undefined}
        onTextRecognized={undefined}
        onGoogleVisionBarcodesDetected={false}>
        {/* */}
        <View style={StyleSheet.absoluteFill}>
          <View style={[styles.autoFocusBox, drawFocusRingPosition]} />
          <TouchableWithoutFeedback onPress={this.touchToFocus}>
            <View style={{flex: 1}} />
          </TouchableWithoutFeedback>
        </View>

        {/*  Stock Controls */}
        <View
          style={{
            flex: 0.5,
            height: 72,
            backgroundColor: 'transparent',
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}>
          <View
            style={{
              backgroundColor: 'transparent',
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={this.toggleViewport}>
              <Text style={styles.flipText}> FLIP </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flipButton}
              onPress={this.toggleFlash}>
              <Text style={styles.flipText}> FLASH: {flash} </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flipButton}
              onPress={this.toggleWhiteBalance}>
              <Text style={styles.flipText}> WB: {whiteBalance} </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{bottom: 0}}>
          <View
            style={{
              height: 56,
              backgroundColor: 'transparent',
              flexDirection: 'row',
              alignSelf: 'flex-end',
            }}>
            {this.renderRecording()}
          </View>

          {this.state.zoom !== 0 && (
            <Text style={[styles.flipText, styles.zoomText]}>Zoom: {zoom}</Text>
          )}

          <View
            style={{
              height: 56,
              backgroundColor: 'transparent',
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
              style={[
                styles.flipButton,
                styles.picButton,
                {flex: 0.3, alignSelf: 'flex-end'},
              ]}
              onPress={this.takePicture}>
              <Text style={styles.flipText}> SNAP </Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNCamera>
    );
  };

  render() {
    return <View style={styles.container}>{this.renderCamera()}</View>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#FF00FF',
  },
  cameraView: {
    flex: 1,
    justifyContent: 'space-between',
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
