import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, TouchableOpacity, View} from 'react-native';
import styles from './style';

const SUPPORTED_ORIENTATIONS = [
    'portrait',
    'portrait-upside-down',
    'landscape',
    'landscape-left',
    'landscape-right',
];

class RBSheet extends Component {

    constructor (props) {
        super(props);
        this.state = {
            modalVisible: false,
            animatedHeight: new Animated.Value(0),
            pan: new Animated.ValueXY(),
            hasScrollView: props.hasScrollView,
        };

        this.createPanResponder(props);
    }

    setModalVisible (visible, additionalData = null) {
        const {height, minClosingHeight, duration, onClose, onOpen} = this.props;
        const {animatedHeight, pan, modalVisible} = this.state;
        if (visible && modalVisible !== visible) {
            this.setState({modalVisible: visible});
            if (typeof onOpen === 'function') {
                onOpen(additionalData);
            }
            Animated.timing(animatedHeight, {
                toValue: height,
                duration,
            }).start();
        } else if (modalVisible !== visible) {
            Animated.timing(animatedHeight, {
                toValue: minClosingHeight,
                duration,
            }).start(() => {
                pan.setValue({x: 0, y: 0});
                this.setState({
                    modalVisible: visible,
                    animatedHeight: new Animated.Value(0),
                });

                if (typeof onClose === 'function') {
                    onClose();
                }
            });
        }
    }

    createPanResponder (props) {
        const {closeOnDragDown, height} = props;
        const {pan} = this.state;
        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => closeOnDragDown,
            onPanResponderMove: (e, gestureState) => {
                if (gestureState.dy > 0) {
                    Animated.event([null, {dy: pan.y}])(e, gestureState);
                }
            },
            onPanResponderRelease: (e, gestureState) => {
                if (height / 4 - gestureState.dy < 0) {
                    this.setModalVisible(false);
                } else {
                    Animated.spring(pan, {toValue: {x: 0, y: 0}}).start();
                }
            },
        });
    }

    setHeight (newHeight) {
        const {animatedHeight} = this.state;
        const {duration} = this.props;
        Animated.timing(animatedHeight, {
            toValue: newHeight,
            duration
        }).start();
    }

    open (additionalData) {
        this.setModalVisible(true, additionalData);
    }

    close () {
        this.setModalVisible(false);
    }

    render () {
        const {
            animationType,
            closeOnDragDown,
            closeOnPressMask,
            closeOnPressBack,
            children,
            customStyles,
        } = this.props;
        const {animatedHeight, pan, modalVisible, hasScrollView} = this.state;
        const panStyle = {
            transform: pan.getTranslateTransform(),
        };

        let draggableIcon = (closeOnDragDown && hasScrollView ? (
            <View {...this.panResponder.panHandlers} style={styles.draggableContainer}>
                <View style={[styles.draggableIcon, customStyles.draggableIcon]}/>
            </View>
        ) : closeOnDragDown ? <View style={styles.draggableContainer}>
            <View style={[styles.draggableIcon, customStyles.draggableIcon]}/>
        </View> : null);

        return (
            <Modal
                transparent
                animationType={animationType}
                visible={modalVisible}
                supportedOrientations={SUPPORTED_ORIENTATIONS}
                onRequestClose={() => {
                    if (closeOnPressBack) {
                        this.setModalVisible(false);
                    }
                }}
            >
                <KeyboardAvoidingView
                    enabled={Platform.OS === 'ios'}
                    behavior="padding"
                    style={[styles.wrapper, customStyles.wrapper]}
                >
                    <TouchableOpacity
                        style={styles.mask}
                        activeOpacity={1}
                        onPress={() => (closeOnPressMask ? this.close() : null)}
                    />
                    {
                        closeOnDragDown && hasScrollView ? (
                            <Animated.View
                                style={[panStyle, styles.container, {height: animatedHeight}, customStyles.container]}
                            >
                                {draggableIcon}
                                {children}
                            </Animated.View>
                        ) : (
                            <Animated.View
                                {...this.panResponder.panHandlers}
                                style={[panStyle, styles.container, {height: animatedHeight}, customStyles.container]}
                            >
                                {draggableIcon}
                                {children}
                            </Animated.View>)
                    }

                </KeyboardAvoidingView>
            </Modal>
        );
    }
}

RBSheet.propTypes = {
    animationType: PropTypes.oneOf(['none', 'slide', 'fade']),
    height: PropTypes.number,
    minClosingHeight: PropTypes.number,
    duration: PropTypes.number,
    closeOnDragDown: PropTypes.bool,
    closeOnPressMask: PropTypes.bool,
    closeOnPressBack: PropTypes.bool,
    customStyles: PropTypes.objectOf(PropTypes.object),
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    children: PropTypes.node,
};

RBSheet.defaultProps = {
    animationType: 'none',
    height: 260,
    minClosingHeight: 0,
    duration: 300,
    closeOnDragDown: false,
    closeOnPressMask: true,
    closeOnPressBack: true,
    customStyles: {},
    onOpen: null,
    onClose: null,
    children: <View/>,
};

export default RBSheet;
