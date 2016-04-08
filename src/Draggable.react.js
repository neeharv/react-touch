import React from 'react';
import raf from 'raf';
import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';

import computePositionStyle from './computePositionStyle';
import computeDeltas from './computeDeltas';


const T = React.PropTypes;
const ZERO_DELTAS = { dx: 0, dy: 0 };
const DEFAULT_TOUCH = { initial: null, current: null, deltas: ZERO_DELTAS };


class Draggable extends React.Component {

  static propTypes = {
    children: T.oneOfType([T.func, T.element]).isRequired,
    style: T.objectOf(T.oneOfType([T.number, T.object])).isRequired,
    onTouchStart: T.func,
    onDrag: T.func,
    __passThrough: T.object,
  };

  state = {
    component: {
      initial: { ...computePositionStyle(this.props.style, ZERO_DELTAS) },
      current: { ...computePositionStyle(this.props.style, ZERO_DELTAS) },
    },
    touch: DEFAULT_TOUCH,
  };

  _updatingPosition = false;
  _currentAnimationFrame = null;
  _handleTouchMove = e => this.handleTouchMove(e);
  _handleTouchEnd = e => this.handleTouchEnd(e);

  _updatePosition(touchPosition) {
    this._updatingPosition = false;

    const { touch, component } = this.state;
    const deltas = computeDeltas(touch.current, touchPosition);
    const componentPosition = computePositionStyle(component.current, deltas);

    this.props.onDrag && this.props.onDrag(componentPosition);

    this.setState(merge({}, this.state, {
      touch: { current: touchPosition, deltas },
      component: { current: componentPosition },
    }));
  }

  _resetTouch() {
    raf.cancel(this._currentAnimationFrame);
    this._currentAnimationFrame = null;
    this.setState(merge({}, this.state, { touch: DEFAULT_TOUCH }));
  }

  passThroughState() {
    const { component, touch } = this.state;
    return { ...component.current, ...touch.deltas };
  }

  handleTouchStart(e, child) {
    // add event handlers to the body
    document.addEventListener('touchmove', this._handleTouchMove);
    document.addEventListener('touchend', this._handleTouchEnd);
    document.addEventListener('touchcancel', this._handleTouchEnd);

    // call child's and own callback from props since we're overwriting it
    child.props.onTouchStart && child.props.onTouchStart(e);
    this.props.onTouchStart && this.props.onTouchStart(e);

    const { clientX, clientY } = e.nativeEvent.touches[0];
    const dimensions = { x: clientX, y: clientY };

    // set initial conditions for the touch event
    this.setState(merge({}, this.state, {
      touch: { initial: dimensions, current: dimensions },
    }));
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (!this._updatingPosition) {
      const { clientX: x, clientY: y } = e.touches[0];
      this._currentAnimationFrame = raf(() => this._updatePosition({x, y}));
    }
    this._updatingPosition = true;
  }

  handleTouchEnd() {
    document.removeEventListener('touchmove', this._handleTouchMove);
    document.removeEventListener('touchend', this._handleTouchEnd);
    document.removeEventListener('touchcancel', this._handleTouchEnd);
    this._resetTouch();
  }

  render() {
    const { children, __passThrough } = this.props;
    const passThrough = { ...__passThrough, ...this.passThroughState() };
    const child = isFunction(children) ? children({ ...passThrough }) : children;

    return React.cloneElement(React.Children.only(child), {
      onTouchStart: e => this.handleTouchStart(e, child),
      __passThrough: passThrough,
    });
  }
}

export default Draggable;
