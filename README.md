
Work in progress. Come back later.

ashnazg is a tiny front-end state management system with JSX bindings for use with e.g. Preact or React. 

ashnazg makes it easy to keep a global app state using a simple uni-directional data flow.

# Usage

Using preact and ES6:

```
import ashnazg from 'ashnazg'
import {Component as PreactComponent, h, render) from 'preact'

const Component = ashnazg(PreactComponent)

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

You can now change `app.state.counter.number` and the state of the Counter component instance will change. Likewise changes to `this.state` within the component will update `app.state.counter`. Note that changes to state must be done using the normal `this.setState(...)` within the component. Outside of the component you can either call `app.commitState` after directly modifying the state (but don't use this with asynchronous code) or use `app.changeState` or `app.setState`. 

By default an instance of a component is bound to the global app state using its own name (in lower case). To manually specify where a component instance is bound to the global app state you can use the `state=` property:

```
<Counter state="myCounter" /> // bind to app.state.myCounter
<Counter state="foo[]" /> // bind to app.state.foo[0]
<Counter state="foo[]" /> // bind to app.state.foo[1]
<Counter state="foo[99]" /> // bind to app.state.foo[99]
<Counter state="[]" /> // bind to app.state.counter[0]
<Counter state="[]" /> // bind to app.state.counter[1]
```

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

ashnazg is smaller than MobX (ToDo by how much?).

ashnazg doesn't support ES.next features like decorators.

ashnazg is written in ES5 instead of TypeScript.

