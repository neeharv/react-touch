import React from 'react';
import ReactDOM from 'react-dom';
import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';
import filter from 'lodash/filter';
import keys from 'lodash/keys';

import computePosition from './computePosition';
import computeDeltas from './computeDeltas';

const T = React.PropTypes;


class Touchable extends React.Component {
  static propTypes = {
    children: T.oneOfType([T.func, T.element]).isRequired,
    style: T.objectOf(T.oneOfType([T.number, T.object])).isRequired,
    onTouchStart: T.func,
    onTouchEnd: T.func,
    onTouchMove: T.func,
    onSwipe: T.func,
    onHold: T.func,
  };

  state = {
    component: {
      initial: computePosition(this.props.style, { dx: 0, dy: 0 }),
      current: computePosition(this.props.style, { dx: 0, dy: 0 }),
    },
    touch: {
      initial: null,
      current: null,
    }
  };

  onTouchStart(e) {
    // TODO: touches, targetTouches, or changedTouches
    const { clientX: x, clientY: y } = e.nativeEvent.touches[0];
    this.setState({ 
      touch: {initial: { x, y }, current: { x, y }}
    });

    this._callPropsHandler('onTouchStart', e);
  }

  onTouchMove(e) {
    const { clientX: x, clientY: y } = e.nativeEvent.touches[0];

    const deltas = computeDeltas(this.state.touch.current, { x, y });
    const positionStyle = computePosition(this.state.component.current, deltas);

    this.setState({
      touch: {current: { x, y }},
      component: {current: positionStyle},
    });

    this._callPropsHandler('onTouchMove', e);
  }

  onTouchEnd(e) {
    this._callPropsHandler('onTouchEnd', e);
  }

  _callPropsHandler(name, e) {
    // handle user's touch handling
    this.props[name] && this.props[name](e);
  }

  render() {
    const { children } = this.props;
    const { component: position } = this.state;

    const renderedChildren = isFunction(children) ? children(position.current) : children;
    return React.cloneElement(React.Children.only(renderedChildren), {
      onTouchStart: e => this.onTouchStart(e),
      onTouchMove: e => this.onTouchMove(e),
      onTouchEnd: e => this.onTouchEnd(e),
    });
  }
}

export default Touchable;
