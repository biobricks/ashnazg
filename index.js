
import diff from 'state-diff'

export default function(ClassToExtend) {

  return class Component extends ClassToExtend {

    constructor(props) {
      super(props)

      if(this.props.state) {
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

        const realSetState = this.setState.bind(this);
        this.setState = function(newState) {


          if(this.hasOwnProperty('stateIndex')) {
            app.state[this.props.state][this.stateIndex] = this.state
          } else {
            app.state[this.props.state] = this.state
          }

          realSetState(newState);
          app.setState();
        };
      }
    }
  }
}
