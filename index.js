
import diff from 'state-diff'

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
  if(typeof path === 'string') path = path.split('.');

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
// and set that property to the specified value
// If the path does not exist then it will be created
function setProp(obj, path, value) {
  if(typeof path === 'string') path = path.split('.');

  if(path.length > 1) {
    if(!obj[path[0]]) obj[path[0]] = {}

    resolvePropPath(obj[path[0]], path.slice(1, path.length), value)
  }

  if(path.length === 1) {
    obj[path[0]] = value
  }
}


export default function(windowObj, appVarPath, ClassToExtend) {

  if(!windowObj || !appVarPath || !ClassToExtend) throw new Error("Missing or invalid arguments");

  var app = getProp(windowObj, appVarPath);
  if(!app) {
    app = {};
    setProp(windowObj, appVarPath, app);
  }

  if(app.state) throw new Error(".state already exists. ashnazg won't overwrite!")

  app.state = {}
  app._stateComponents = {}
  
  app.setState = function(path, state, noDiff) {
    if(!state) {
      state = path
      path = undefined
    }

    app.commitState(path, state, noDiff)
  }

  app.changeState = function(path, state, noDiff) {
    if(!state) {
      state = path
      path = undefined
    }
   
    // TODO
    
  }

  app.commitState = function(path, state, noDiff) {
    if(path) {
      const affected = deepestSingleAffected(path)
      if(affected) {
        if(noDiff) {
          affected.component.setState(state);
        } else {
          diffUpdate(affected.path, state)
        }
        return;
      }
      setProp(app.state, path, state);
    }
    diffUpdate(path, state)
    
    if(!path) {
      app.state = state;
    }
  }

  function diffUpdate(path, state) {
    if(!state) {
      state = path
      path = []
    }
    var appState;
    if(!path) {
      path = ''
      appState = app.state;
    } else {
      appState = getProp(app.state, path);
    }

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
          this.props.state = this.props.state.slice(0, this.props.state.length - 2)
        }
        
        if(!app.state[this.props.state]) {
          app.state[this.props.state] = [this.state];
          this.stateIndex = 0;
        } else {
          if(!(app.state[this.props.state] instanceof Array)) {
            throw new Error("Invalid state property. Trying to append a component where non-array component is already mapped: app."+this.props.state);
          }
          app.state[this.props.state].push(this.state);
          this.stateIndex = app.state[this.props.state].length - 1;
        }

      } else {
        app.state[this.props.state] = this.state
      }

      var componentKey = this.props.state;
      if(this.hasOwnProperty('stateIndex')) {
        componentKey += '.'+this.stateIndex;
      }

      app._stateComponents[componentKey] = this;
      
      const realSetState = this.setState.bind(this);
      this.setState = function(newState) {
        
        
        if(this.hasOwnProperty('stateIndex')) {
          app.state[this.props.state][this.stateIndex] = this.state
        } else {
          app.state[this.props.state] = this.state
        }
        
        realSetState(newState);
      };
    }
  }
}
