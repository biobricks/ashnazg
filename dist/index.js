'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _stateDiff = require('state-diff');

var _stateDiff2 = _interopRequireDefault(_stateDiff);

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function arrayMergeFunc(dst, src) {
  return src;
};

function saneMerge(x, y, opts) {
  opts = opts || {};
  opts.arrayMerge = opts.arrayMerge || arrayMergeFunc;
  return (0, _deepmerge2.default)(x, y, opts);
}

// deep clone an object
function clone(o) {
  return _deepmerge2.default.all([o, {}], { clone: true });
}

// generate unique id
function genID() {
  return (Math.random().toString(36) + '00000000000000000').slice(2, 16 + 2);
}

// resolve a path like ['foo', 'bar', 'baz']
// to return the value of obj.foo.bar.baz
// or undefined if that path does not exist
function resolvePropPath(obj, path) {

  if (path.length > 1) {
    if (!obj[path[0]]) return undefined;

    return resolvePropPath(obj[path[0]], path.slice(1, path.length));
  }

  if (path.length === 1) {
    return obj[path[0]];
  }

  return undefined;
}

// Resolve a path like "foo.bar.baz" or ['foo', 'bar', 'baz']
// to return the value of obj.foo.bar.baz
// or undefined if that path does not exist
function getProp(obj, path) {
  if (!path) return obj;
  if (typeof path === 'string') path = path.split('.');

  if (path.length > 1) {
    if (!obj[path[0]]) return undefined;

    return getProp(obj[path[0]], path.slice(1, path.length));
  }

  if (path.length === 1) {
    return obj[path[0]];
  }

  return undefined;
}

// Resolve a path like "foo.bar.baz" or ['foo', 'bar', 'baz']
// and set that property to the specified value
// If the path does not exist then it will be created
function setProp(obj, path, value) {
  if (typeof path === 'string') path = path.split('.');

  if (path.length > 1) {
    if (!obj[path[0]]) obj[path[0]] = {};
    setProp(obj[path[0]], path.slice(1, path.length), value);
  }

  if (path.length === 1) {
    obj[path[0]] = value;
  }
}

function extend(ClassToExtend, opts) {
  opts = opts || {};
  opts.object = opts.object || window;
  opts.appPath = opts.path || 'app';
  opts.statePath = opts.statePath || 'app.state';
  opts.simpleCommit = opts.simpleCommit || true;
  opts.backwardCompatible = opts.backwardCompatible || true; // ToDo
  opts.hasProxy = false; // ToDo does this browser support the Proxy object?

  if (!ClassToExtend) throw new Error("Missing or invalid arguments");

  var stateCopy; // where we keep a copy of the state if necessary

  var app = getProp(opts.object, opts.appPath);
  if (!app) {
    app = {};
    setProp(opts.object, opts.appPath, app);
  }

  var stateObj = getProp(opts.object, opts.statePath);
  if (stateObj) {
    throw new Error(".state already exists. ashnazg won't overwrite!");
  }

  stateObj = {};
  setProp(opts.object, opts.statePath, stateObj);

  autoCopy();

  app._stateComponents = {};

  app.setState = function (path, state, noDiff) {
    if (!state) {
      state = path;
      path = undefined;
    }

    var appState = getProp(stateObj, path);

    saveState(path, appState, state, noDiff);
    autoCopy();
  };

  app.changeState = function (path, state, noDiff) {
    if (!state) {
      state = path;
      path = undefined;
    }

    var appState = getProp(stateObj, path);
    state = saneMerge(appState, state, { clone: true });

    saveState(path, appState, state, noDiff);
    autoCopy();
  };

  app.beginState = function () {
    if (opts.hasProxy || opts.simpleCommit) return;

    stateCopy = clone(stateObj);
  };

  app.commitState = function (path, noDiff) {
    if (!opts.simpleCommit && !stateCopy) throw new Error("Called .commitState before calling .preCommitState when opts.simpleCommit is false. Go read the API");

    var appState = getProp(stateCopy, path);
    saveState(path, appState, stateObj, noDiff);

    if (opts.simpleCommit) {
      autoCopy();
    } else {
      stateCopy = null;
    }
  };

  // keep a copy of the state if necessary
  function autoCopy() {
    if (opts.hasProxy || !opts.simpleCommit) return;
    stateCopy = clone(stateObj);
  }

  function saveState(path, appState, state, noDiff) {
    if (path) {
      var affected = deepestSingleAffected(path);
      if (affected) {
        if (noDiff) {
          triggerListeners(affected.path, state);
          affected.component.setStateNoTrigger(state);
        } else {
          diffUpdate(affected.path, appState, state);
        }
        setProp(stateObj, path, state);
        return;
      }
    }
    diffUpdate(path, appState, state);

    if (!path) {
      setProp(app, opts.statePath, state);
    }
  }

  function diffUpdate(path, appState, state) {
    if (!state) {
      state = path;
      path = [];
    }

    if (!path) path = '';

    var affected, listeners;
    var updated = {};
    var triggeredListeners = {};
    var i;
    (0, _stateDiff2.default)(appState, state, function (diffPath) {

      diffPath = diffPath.join('.');

      if (path) {
        diffPath = path + '.' + diffPath; // convert to absolute path
      }

      triggerListeners(diffPath, state, triggeredListeners);

      affected = deepestSingleAffected(diffPath);

      if (affected && !updated[affected.path]) {
        updated[affected.path] = true;
        if (path) {
          // convert back to relative path
          affected.path = affected.path.slice(path.length + 1);
        }

        affected.component.setStateNoTrigger(getProp(state, affected.path));
      }
    });
  }

  // allListeners is an optional parameter to pass in a different set of listeners
  function diffTrigger(componentPath, oldState, newState, allListeners) {

    var triggeredListeners = {};

    (0, _stateDiff2.default)(oldState, newState, function (diffPath) {
      diffPath = diffPath.join('.');

      triggerListeners(diffPath, newState, triggeredListeners, componentPath, allListeners);
    });
  }

  // TODO save listeners as an object with path as keys
  // and arrays of listeners as values
  function triggerListeners(path, state, triggered, pathRelativeTo, allListeners) {
    if (!triggered) triggered = {};

    var origPath = path;

    if (pathRelativeTo) {
      path = pathRelativeTo + '.' + path;
    }
    var listeners = findListeners(path, allListeners);

    if (!listeners.length) return;

    var i, listenerPath;
    for (i = 0; i < listeners.length; i++) {
      if (triggered[listeners[i].id]) continue;

      if (pathRelativeTo) {
        if (pathRelativeTo.length === listeners[i].path.length) {
          listenerPath = undefined;
        } else {

          listenerPath = listeners[i].path.slice(pathRelativeTo.length + 1);
        }
      } else {
        listenerPath = listeners[i].path;
      }

      if (!listenerPath) {
        listeners[i].callback(state);
      } else {
        listeners[i].callback(getProp(state, listenerPath));
      }

      triggered[listeners[i].id] = true;
    }

    // don't trigger global listeners if this is a state change
    // for a component that isn't bound to global state
    if (allListeners && allListeners.length) return;

    for (i = 0; i < globalListeners.length; i++) {
      globalListeners[i].callback(path, getProp(state, origPath));
      triggered[globalListeners[i].id] = true;
    }
  }

  // allListeners is an optional parameter to pass in a different set of listeners
  function findListeners(path, allListeners) {
    var hits = []; // copy globalListeners
    var i, l;

    var listenerSet = allListeners && allListeners.length ? allListeners : listeners;

    for (i = 0; i < listenerSet.length; i++) {
      l = listenerSet[i];
      if (l.path.length > path.length) continue;
      if (path.indexOf(l.path) === 0 && (l.path.length === path.length || path[l.path.length] === '.')) {

        hits.push({
          callback: l.callback,
          id: l.id,
          path: l.path
        });
      }
    }
    return hits;
  }

  // Find the deepest single affected component.
  // This component might have sub-components 
  // but at least now we know that we don't have to diff
  // anything shallower.
  function deepestSingleAffected(path) {
    var deepest;
    var deepestLength = 0;
    var key;
    for (key in app._stateComponents) {

      if (key.length > deepestLength && path.indexOf(key) === 0) {
        deepest = {
          path: key,
          component: app._stateComponents[key]
        };
        deepestLength = key.length;
      }
    }
    return deepest;
  }

  var ExtendedClass = function (_ClassToExtend) {
    _inherits(ExtendedClass, _ClassToExtend);

    function ExtendedClass(props) {
      _classCallCheck(this, ExtendedClass);

      var _this = _possibleConstructorReturn(this, (ExtendedClass.__proto__ || Object.getPrototypeOf(ExtendedClass)).call(this, props));

      _this._localListeners = [];

      _this._state = undefined;
      Object.defineProperty(_this, 'state', {
        configurable: true,
        enumerable: true,
        set: function set(newState) {
          if (this._state === undefined && this.statePath) {
            diffTrigger(this.statePath, this.state, newState, this._localListeners);
            // copy local state to global state object
            // TODO need to do a shallow merge of newState into this.state first
            setProp(stateObj, this.statePath, newState);
          }
          this._state = newState;
        },
        get: function get() {
          return this._state;
        }
      });

      if (!_this.props.state) return _possibleConstructorReturn(_this);

      // using syntax: <Element state /> (no binding name specified)
      if (typeof _this.props.state !== 'string') {
        _this.props.state = _this.constructor.name.toLowerCase();
      }

      // using syntax: <Element state="foo[]" /> (array)
      if (_this.props.state.indexOf("[]") === _this.props.state.length - 2) {
        if (_this.props.state === "[]") {
          _this.props.state = _this.constructor.name.toLowerCase();
        } else {
          _this.props.state = _this.props.state.slice(0, _this.props.state.length - 2).toLowerCase();
        }

        if (!getProp(stateObj, _this.props.state)) {
          setProp(stateObj, _this.props.state, [_this.state]);
          _this.stateIndex = 0;
        } else {
          if (!(getProp(stateObj, _this.props.state) instanceof Array)) {
            throw new Error("Invalid state property. Trying to append a component where non-array component is already mapped: app." + _this.props.state);
          }

          getProp(stateObj, _this.props.state).push(_this.state);
          _this.stateIndex = stateObj[_this.props.state].length - 1;
        }
      } else {
        setProp(stateObj, _this.props.state, _this.state);
      }

      var componentKey = _this.props.state;
      if (_this.hasOwnProperty('stateIndex')) {
        componentKey += '.' + _this.stateIndex;
      }

      _this.statePath = componentKey;

      app._stateComponents[componentKey] = _this;

      var realSetState = _this.setState.bind(_this);
      _this.setState = function (newState) {
        autoCopy();

        realSetState(newState);
      };
      autoCopy();
      return _this;
    }

    _createClass(ExtendedClass, [{
      key: 'setStateNoTrigger',
      value: function setStateNoTrigger() {
        _get(ExtendedClass.prototype.__proto__ || Object.getPrototypeOf(ExtendedClass.prototype), 'setState', this).apply(this, arguments);
      }
    }, {
      key: 'replaceStateNoTrigger',
      value: function replaceStateNoTrigger() {
        _get(ExtendedClass.prototype.__proto__ || Object.getPrototypeOf(ExtendedClass.prototype), 'replaceState', this).apply(this, arguments);
      }
    }, {
      key: 'replaceState',
      value: function replaceState(newState) {

        diffTrigger(this.statePath, this.state, newState, this._localListeners);
        _get(ExtendedClass.prototype.__proto__ || Object.getPrototypeOf(ExtendedClass.prototype), 'replaceState', this).apply(this, arguments);

        if (this.statePath) {
          // copy local state to global state object
          setProp(stateObj, this.statePath, this.state);
        }
      }
    }, {
      key: 'setState',
      value: function setState(newState) {
        diffTrigger(this.statePath, this.state, newState, this._localListeners);

        if (this.statePath) {
          // copy local state to global state object
          // TODO need to do a shallow merge of newState into this.state first
          setProp(stateObj, this.statePath, newState);
        }
        _get(ExtendedClass.prototype.__proto__ || Object.getPrototypeOf(ExtendedClass.prototype), 'setState', this).apply(this, arguments);
      }
    }, {
      key: 'changeState',
      value: function changeState(stateChange) {
        var newState = saneMerge(this.state, stateChange, { clone: true });
        this.setState(newState);
      }
    }, {
      key: 'listen',
      value: function listen(path, callback) {

        // if this component is not bound to the global state
        // add this listener to a local per-component set of listeners instead
        if (!this.statePath) {
          if (typeof path === 'function') {
            callback = path;
            path = undefined;
          }

          return gListen(path, callback, true, this._localListeners);
        }

        if (typeof path === 'function') {
          callback = path;
          path = this.statePath;
        } else {
          path = this.statePath + '.' + path;
        }
        return gListen(path, callback, true);
      }
    }]);

    return ExtendedClass;
  }(ClassToExtend);

  return ExtendedClass;
}

var listeners = [];
var globalListeners = [];

function gListen(path, callback, isLocal, listenerList) {
  if (!isLocal && typeof path === 'function') {
    listenerList = globalListeners;
    callback = path;
    path = undefined;
  }

  if (!listenerList) listenerList = listeners;

  var id = genID();
  listenerList.push({
    id: id,
    path: path,
    callback: callback
  });
  return id;
}

exports.default = {
  extend: extend,
  listen: gListen
};
