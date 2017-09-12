
import diff from 'state-diff'
import merge from 'deepmerge'

// deep clone an object
function clone(o) {
  return merge.all([o, {}], {clone: true});
}

// resolve a path like ['foo', 'bar', 'baz']
// to return the value of obj.foo.bar.baz
// or undefined if that path does not exist
function resolvePropPath(obj, path) {

  if(path.length > 1) {
    if(!obj[path[0]]) return undefined;

    return resolvePropPath(obj[path[0]], path.slice(1, path.length));
  }

  if(path.length === 1) {
    return obj[path[0]];
  }

  return undefined;
}

// Resolve a path like "foo.bar.baz" or ['foo', 'bar', 'baz']
// to return the value of obj.foo.bar.baz
// or undefined if that path does not exist
function getProp(obj, path) {
  if(!path) return obj;
  if(typeof path === 'string') path = path.split('.');

  if(path.length > 1) {
    if(!obj[path[0]]) return undefined;

    return getProp(obj[path[0]], path.slice(1, path.length));
  }

  if(path.length === 1) {
    return obj[path[0]];
  }

  return undefined;
}

// Resolve a path like "foo.bar.baz" or ['foo', 'bar', 'baz']
// and set that property to the specified value
// If the path does not exist then it will be created
function setProp(obj, path, value) {
  if(typeof path === 'string') path = path.split('.');

  if(path.length > 1) {
    if(!obj[path[0]]) obj[path[0]] = {}
    setProp(obj[path[0]], path.slice(1, path.length), value)
  }

  if(path.length === 1) {
    obj[path[0]] = value
  }
}


export default function(ClassToExtend, opts) {
  opts = opts || {};
  opts.object = opts.object || window;
  opts.appPath = opts.path || 'app';
  opts.statePath = opts.statePath || 'app.state';
  opts.simpleCommit = opts.simpleCommit || true;
  opts.backwardCompatible = opts.backwardCompatible || true; // ToDo
  opts.hasProxy = false; // ToDo does this browser support the Proxy object?

  if(!ClassToExtend) throw new Error("Missing or invalid arguments");

  var stateCopy; // where we keep a copy of the state if necessary

  var app = getProp(opts.object, opts.appPath);
  if(!app) {
    app = {};
    setProp(opts.object, opts.appPath, app);
  }

  var stateObj = getProp(opts.object, opts.statePath);
  if(stateObj) {
    throw new Error(".state already exists. ashnazg won't overwrite!")
  }

  stateObj = {};
  setProp(opts.object, opts.statePath, stateObj);

  autoCopy();
  
  app._stateComponents = {}
  

  app.setState = function(path, state, noDiff) {
    if(!state) {
      state = path
      path = undefined
    }

    var appState = getProp(stateObj, path);

    saveState(path, appState, state, noDiff);
    autoCopy();
  }
    
  app.changeState = function(path, state, noDiff) {
    if(!state) {
      state = path
      path = undefined
    }
   
    var appState = getProp(stateObj, path);
    state = merge(appState, state, {clone: true});

    saveState(path, appState, state, noDiff);
    autoCopy();
  }

  app.beginState = function() {
    if(opts.hasProxy || opts.simpleCommit) return;

    stateCopy = clone(stateObj);
  };
  
  app.commitState = function(path, noDiff) {
    if(!opts.simpleCommit && !stateCopy)
      throw new Error("Called .commitState before calling .preCommitState when opts.simpleCommit is false. Go read the API");

    var appState = getProp(stateCopy, path);
    saveState(path, appState, stateObj, noDiff);

    if(opts.simpleCommit) {
      autoCopy();
    } else {
      stateCopy = null;
    }
  };
  
  // keep a copy of the state if necessary
  function autoCopy() {
    if(opts.hasProxy || !opts.simpleCommit) return
    stateCopy = clone(stateObj);
  }

  function saveState(path, appState, state, noDiff) {
    if(path) {
      const affected = deepestSingleAffected(path)
      if(affected) {
        if(noDiff) {
          affected.component.setState(state);
        } else {
          diffUpdate(affected.path, appState, state)
        }
        setProp(stateObj, path, state);
        return;
      }
    }
    diffUpdate(path, appState, state)
    
    if(!path) {
      setProp(app, opts.statePath, state);
    }
  }


  function diffUpdate(path, appState, state) {
    if(!state) {
      state = path
      path = []
    }

    if(!path) path = '';

    var affected;
    var updated = {};

    diff(appState, state, function(diffPath) {

      if(path) {
        diffPath = path + '.' + diffPath; // convert to absolute path
      }
      diffPath = diffPath.join('.');

      affected = deepestSingleAffected(diffPath);

      if(affected && !updated[affected.path]) {
        updated[affected.path] = true;
        if(path) {
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
    var deepest
    var deepestLength = 0
    var key
    for(key in app._stateComponents) {

      if(key.length > deepestLength && path.indexOf(key) === 0) {
        deepest = {
          path: key,
          component: app._stateComponents[key]
        }
        deepestLength = key.length
      }
    }
    return deepest
  }


  return class Component extends ClassToExtend {

    constructor(props) {
      super(props)

      if(!this.props.state) return;

      // using syntax: <Element state /> (no binding name specified)
      if(typeof this.props.state !== 'string') {
        this.props.state = this.constructor.name.toLowerCase();
      }
      
      // using syntax: <Element state="foo[]" /> (array)
      if(this.props.state.indexOf("[]") === (this.props.state.length - 2)) {
        if(this.props.state === "[]") {
          this.props.state = this.constructor.name.toLowerCase();
        } else {
          this.props.state = this.props.state.slice(0, this.props.state.length - 2).toLowerCase();
        }
        
        if(!getProp(stateObj, this.props.state)) {
          setProp(stateObj, this.props.state, [this.state])
          this.stateIndex = 0;
        } else {
          if(!(getProp(stateObj, this.props.state) instanceof Array)) {
            throw new Error("Invalid state property. Trying to append a component where non-array component is already mapped: app."+this.props.state);
          }
          
          getProp(stateObj, this.props.state).push(this.state);
          this.stateIndex = stateObj[this.props.state].length - 1;
        }

      } else {
        setProp(stateObj, this.props.state, this.state);
      }

      var componentKey = this.props.state;
      if(this.hasOwnProperty('stateIndex')) {
        componentKey += '.'+this.stateIndex;
      }

      app._stateComponents[componentKey] = this;
      
      const realSetState = this.setState.bind(this);
      this.setState = function(newState) {
        

        if(this.hasOwnProperty('stateIndex')) {
          setProp(stateObj, this.props.state + '.' + this.stateIndex, this.state);
        } else {
          setProp(stateObj, this.props.state, this.state);
        }

        autoCopy();

        realSetState(newState);
      };
      autoCopy();
    }
  }
}
