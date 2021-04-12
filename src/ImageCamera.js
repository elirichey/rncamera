import React, {Component, Fragment} from 'react';
import {
  Platform,
  SafeAreaView,
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

export default class VideoCamera extends Component {
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
      viewPortFront: false,
      whiteBalance: 'auto',
      canDetectBarcode: true,
      barcodes: [],
    };

    this.zoom_value = 0.01;
  }

  componentDidMount = async () => {
    if (Platform.OS === 'android' && !(await this.hasAndroidPermission())) {
      return;
    }
  };

  hasAndroidPermission = async () => {
    let permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
    let hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) {
      return true;
    }
    let status = await PermissionsAndroid.request(permission);
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
    let {pageX, pageY} = event.nativeEvent;
    let screenWidth = Dimensions.get('window').width;
    let screenHeight = Dimensions.get('window').height;
    let isPortrait = screenHeight > screenWidth;

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

  takePicture = async function () {
    if (this.camera) {
      let data = await this.camera.takePictureAsync();
      let tag = data.uri;
      CameraRoll.save(tag);
    }
  };

  isJSON = (str) => {
    try {
      return JSON.parse(str) && !!str;
    } catch (e) {
      return false;
    }
  };

  setBarcodes = ({barcodes}) => {
    if (this.isJSON(barcodes[0].data)) {
      let error = JSON.parse(barcodes[0].data).errorCode;
      if (!!error) {
        console.log('ERROR: ', error);
        return;
      } else {
        console.log('SET_BARCODES: ', barcodes[0].data);
        this.setState({barcodes});
      }
    } else {
      console.log('SET_BARCODES: ', barcodes[0].data);
      this.setState({barcodes});
    }
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

  renderBarcodes = () => {
    let {barcodes} = this.state;

    return (
      <View style={styles.img_preview_container} pointerEvents="none">
        {barcodes.map(this.renderBarcode)}
      </View>
    );
  };

  renderBarcode = ({bounds, data, type}) => (
    <Fragment key={data + bounds.origin.x}>
      <View
        style={[
          styles.text,
          {
            ...bounds.size,
            left: bounds.origin.x,
            top: bounds.origin.y,
          },
        ]}>
        <Text style={[styles.textBlock]}>{`${data} ${type}`}</Text>
      </View>
    </Fragment>
  );

  render() {
    let {
      autoFocusPoint,
      viewPortFront,
      flash,
      zoom,
      whiteBalance,
      canDetectBarcode,
    } = this.state;

    return (
      <SafeAreaView style={styles.container}>
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
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio recording',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          notAuthorizedView={this.cameraNotAuthorized()}
          // onBarCodeRead={canDetectBarcode ? this.setBarcodes : null}
          onGoogleVisionBarcodesDetected={
            canDetectBarcode ? this.setBarcodes : null
          }>
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
                <TouchableOpacity
                  onPress={() => this.takePicture()}
                  style={styles.btn_container}>
                  <Text style={styles.btn_txt}> TAKE PIC </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ZoomView>

          {/* !!canDetectBarcode && this.renderBarcodes() */}
        </RNCamera>
      </SafeAreaView>
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
  // Pictures
  img_preview_container: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
  },
});
