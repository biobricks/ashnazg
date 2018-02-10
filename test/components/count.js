

import React from "react"
import ashnazg from '../../../dist/index.js'

module.exports = function(Component) {

  return class Count extends Component {

    constructor(props) {
      super(props);

      this.state = {
        number: 1000
      };

      this.listen('number', function(newState) {
        
      });
    }
  
    increment() {
      this.setState({
        number: this.state.number + 1
      });
    }

	  render() {
//      document.getElementById('app-state').value = JSON.stringify(app.state, null, 2)
      return <div>
        <span>Count: <span className="count">{ app.state.counter.number }</span></span>
        <div>
        <button onClick={this.increment.bind(this)}>Increment</button>
        </div>
        </div>
	  }
  }
}
