'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (windowObj, appVarPath, ClassToExtend) {
  if (!appVarPath) {
    ClassToExtend = windowObj;
    windowObj = window;
    appVarPath = 'app';
  }

  if (!ClassToExtend) {
    ClassToExtend = appVarPath;
    appVarPath = windowObj;
    windowObj = window;
  }

  if (!ClassToExtend) throw new Error("Missing or invalid arguments");

  var app = getProp(windowObj, appVarPath);
  if (!app) {
    app = {};
    setProp(windowObj, appVarPath, app);
  }

  if (app.state) throw new Error(".state already exists. ashnazg won't overwrite!");

  app.state = {};
  app._stateComponents = {};

  app.setState = function (path, state, noDiff) {
    if (!state) {
      state = path;
      path = undefined;
    }

    var appState = getProp(app.state, path);

    commitState(path, appState, state, noDiff);
  };

  app.changeState = function (path, state, noDiff) {
    if (!state) {
      state = path;
      path = undefined;
    }

    var appState = getProp(app.state, path);
    state = (0, _deepmerge2.default)(appState, state, { clone: true });
    console.log(JSON.stringify(state, 2));

    commitState(path, appState, state, noDiff);
  };

  function commitState(path, appState, state, noDiff) {
    if (path) {
      var affected = deepestSingleAffected(path);
      if (affected) {
        if (noDiff) {
          affected.component.setState(state);
        } else {
          diffUpdate(affected.path, appState, state);
        }
        setProp(app.state, path, state);
        return;
      }
    }
    diffUpdate(path, appState, state);

    if (!path) {
      app.state = state;
    }
  }

  function diffUpdate(path, appState, state) {
    if (!state) {
      state = path;
      path = [];
    }

    if (!path) path = '';

    var affected;
    var updated = {};

    (0, _stateDiff2.default)(appState, state, function (diffPath) {

      if (path) {
        diffPath = path + '.' + diffPath; // convert to absolute path
      }
      diffPath = diffPath.join('.');

      affected = deepestSingleAffected(diffPath);

      if (affected && !updated[affected.path]) {
        updated[affected.path] = true;
        if (path) {
          // convert back to relative path
          affected.path = affected.path.slice(path.length + 1);
        }

        affected.component.setState(getProp(state, affected.path));
      }
    });
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

  return function (_ClassToExtend) {
    _inherits(Component, _ClassToExtend);

    function Component(props) {
      _classCallCheck(this, Component);

      var _this = _possibleConstructorReturn(this, (Component.__proto__ || Object.getPrototypeOf(Component)).call(this, props));

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

        if (!getProp(app.state, _this.props.state)) {
          setProp(app.state, _this.props.state, [_this.state]);
          _this.stateIndex = 0;
        } else {
          if (!(getProp(app.state, _this.props.state) instanceof Array)) {
            throw new Error("Invalid state property. Trying to append a component where non-array component is already mapped: app." + _this.props.state);
          }

          getProp(app.state, _this.props.state).push(_this.state);
          _this.stateIndex = app.state[_this.props.state].length - 1;
        }
      } else {
        setProp(app.state, _this.props.state, _this.state);
      }

      var componentKey = _this.props.state;
      if (_this.hasOwnProperty('stateIndex')) {
        componentKey += '.' + _this.stateIndex;
      }

      app._stateComponents[componentKey] = _this;

      var realSetState = _this.setState.bind(_this);
      _this.setState = function (newState) {

        if (this.hasOwnProperty('stateIndex')) {
          setProp(app.state, this.props.state + '.' + this.stateIndex, this.state);
        } else {
          setProp(app.state, this.props.state, this.state);
        }

        realSetState(newState);
      };
      return _this;
    }

    return Component;
  }(ClassToExtend);
};

var _stateDiff = require('state-diff');

var _stateDiff2 = _interopRequireDefault(_stateDiff);

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
