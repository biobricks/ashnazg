
ashnazg is a tiny front-end state management system with JSX bindings for use with e.g. Preact or React. 

ashnazg makes it easy to keep a global app state using a simple uni-directional data flow.

This module is not ready for production use. Needs more testing. Also, the `Proxy` functionality as described below is not yet ready.

# Usage

Using preact and ES6:

```
import ashnazg from 'ashnazg'
import {Component as PreactComponent, h, render) from 'preact'

const Component = ashnazg.extend(PreactComponent)

// Simple Counter compo
export default class Counter extends Component {

  constructor(props) {
    super(props);

    this.state = {
      number: 1000
    };
  }
  
  increment() {
    this.setState({
      number: this.state.number + 1
    });
  }

	render() {
		return <div>
      <span> Counter: { this.state.number }</span>
        <div>
          <button onclick={this.increment.bind(this)}>Increment</button>
        </div>
      </div>
	}
}

render(<Counter />, document.getElementById('app'));
```

You can now change `app.state.counter.number` and the state of the Counter component instance will change. Likewise changes to `this.state` within the component will update `app.state.counter`. Note that changes to state must be done using the normal `this.setState(...)` within the component. Outside of the component you can either call `app.setState` normally or you can call `app.setState` with a path to only change a part of the state like so:

```
app.setState('foo.bar', {baz: 42})
```

or you can call `app.changeState` to only change the specified properties like so:

```
app.changeState({
  foo: {
    bar: {
      baz: 42}
    }
  }
)
```

`app.changeState` also takes an optional path argument, same as `app.setState`.

Using app.changeState to only change a particular element in an array is a bit tricky. Here's how:

```
var myChange = {
  myArray: []
};

myChange.myArray[3] = {
  value: 42
}

app.changeState(myChange)
```

This is annoying, so you can also use `app.commitState` after directly manipulatingthe app state like this:

```
app.state.foo.bar.baz++
app.commitState()
```

Be aware that for browsers that don't support the `Proxy` object, ashnazg has to keep an extra copy of the entire app state for `app.commitState` to work. If your app's performance is suffering then you can stop ashnazg from keeping a copy by setting `opts.simpleCommit` to `false`, but then you will have to run `app.beginCommit()` before changing the global app state like so:

```
app.beginCommit()
app.state.foo.bar.baz++
app.commitState()
```

Or of course you can simply decide not to use `app.commitState`.

Like the other state-modyfing functions, `app.commitState` takes an optional `path` argument.


By default an instance of a component is bound to the global app state using its own name (in lower case). To manually specify where a component instance is bound to the global app state you can use the `state=` property:

```
<Counter state /> // bind to app.state.myCounter
<Counter state="myCounter" /> // bind to app.state.myCounter
<Counter state="foo[]" /> // bind to app.state.foo[0]
<Counter state="foo[]" /> // bind to app.state.foo[1]
<Counter state="foo[99]" /> // bind to app.state.foo[99]
<Counter state="[]" /> // bind to app.state.counter[0]
<Counter state="[]" /> // bind to app.state.counter[1]
```

# Example

You can try the example in the `example/` directory like so:

```
cd example/
npm install
npm run build
npm start
firefox http://localhost:8000/
```

This example uses preact.

# Listeners

You can also add callbacks that fire when a certain part of the global state changes, e.g:

```
ashnazg.listen('absolute.path', function(newState) {
  console.log("absolute.path just changed to:", newState);
});
```

or you can do the same for local state inside of a component:

```
this.listen('relative.path', function(newState) {
  console.log("relative.path just changed to:", newState);
});
```

or to listen to all of a component's state changes:

```
this.listen(function(newState) {
  console.log("state just changed to:", newState);
});
```

Per-component listeners should be added from within the component's constructor. When adding a listener to local state the path is relative to the component's state.

Note that the listeners are called before the global/local state objects are changed, so listeners can access the previous state through normal methods.

# Options

```
ashnazg.extend(PreactComponent, {
  object: window, // where to bind .app and .state objects
  appPath: 'app', // path to .app object (default: window.app)
  statePath: 'app.state', // path to .state object (default: window.app.state)
  simpleCommmit: true // keep a copy of app state so you won't need .beginCommit
}) 
```

By default ashnazg will keep global state at `window.app.state` (reachable in the browser simply as the global variable `app.state`) and bind `.setState()` etc. to `window.app`. If you want to place `.app` and .state` elsewhere you can set `opts.appPath` and `opts.statePath`. If you want to change the root object from `window` then specify the object (not the path) as `opts.object`, e.g:

```
# keep .app at foo.baz.baz
# and .state at foo.cookie.cat

ashnazg.extend(PreactComponent, {
  object: cookie,
  appPath: 'bar.baz',
  statePath: 'cookie.cat'
}) 
```

Note that for the above examples the specified paths (`cookie.cat.lol` and `window.foo.bar`) must already exist.

# Global state

Your app may have some state such as login state that affects many components at once. Global state that triggers a re-render of all components can be implemented by creating a global wrapper component like so:

```
class Global extends Component {
  render() {
    return <div>
      {this.props.children}
    </div>
	}
}
```

then wrapping all other components with the Global component and mapping it to the state:

```
<Global state="global">
  <Foo state="foo" />
  <Bar state="bar" />
</Global/>
```

`Foo` will still be mapped to `app.state.foo` and `global` will map to `app.state.global`. Changing `app.state.global will cause a re-render of all components nested under the `Global` component. The login state can then be written to e.g. `app.state.global.login` and can be safely accessed from the entire app.

Note that re-rendering all components is not as bad as it since re-rendering is still happening using vDom.

# Notes on performance and compatibility

On browsers without support for the `Proxy` object ashnazg will fall back to diffing the previous and new states to see what the changes were and update the relevant components _unless_ you either update the component state from within the component or use the two-argument version of `app.changeState` or `app.setState` in a way that only affects one component at a time. 

E.g. if we have bound a Counter component to app.state.myCounter like so: `<Counter state="myCounter" />` then assuming we only want to update that component we can avoid the diff by running:

```
app.changeState('myCounter', {number: 42})
```

or:

```
app.changeState('myCounter.number', 42)
```

Whereas it would require a diff if you did:

```
app.changeState({
  myCounter: {
    number: 42
  }
});
```

Of course if you're changing state in a way that affects multiple components then that would require multiple calls to `app.changeState` which would not only be inconvenient but would then result in a diff of the vDom for every call, so it would be unlikely to net you any performance gains.

On browsers that support the `Proxy` object there is no difference in performance as diffing is never used.

# How does ashnazg work and how does it differ from MobX?

With ashnazg you have to call `.commitState` after directly modifying the state (or use `.changeState` or `.setState`) but you can freely append and delete properties/elements from objects and arrays. MobX reconstructs all state changes using a bunch of calls to `Object.defineProperty` in order to create getters and setters that intercept changes. This might seem a bit clunky but it's the only backwards-compatible way to achieve what MobX does so you can't blame them. 

In ashnazg changes to state using the component-local `.changeState` or `.setState` always re-renders. If a single component is bound to the global state at 'path.to.property' then if global state is modified using `.changeState('path.to.property', <value>)` or any paths nested under 'path.to.property' (e.g. 'path.to.property.foo') then ashnazg will always re-render that component. If the global state is modified in a way that may influence multiple components then on browsers that support the Proxy object ashnazg figures out which components are affected using that method, but on older browsers ashnazg falls back to diffing the current state and the changed state in order to detect the changes.

Other differences:

* ashnazg is written in ES6 instead of TypeScript
* ashnazg is less than a 10th the size of MobX
* ashnazg doesn't support ES.next features like decorators

# ToDo

* add support for reducers
* unit tests

# License and copyright

License: AGPLv3

Copyright 2017 BioBricks Foundation