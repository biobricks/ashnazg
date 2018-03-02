
import {h} from 'preact'
import ashnazg from './ashnazg'

module.exports = function(Component) {

  return class Count extends Component {

    constructor(props) {
      super(props);

      this.listen('number', function(newState) {
        console.log("this.state.number:", newState);
      });

      ashnazg.listen('other.foo', function(newState) {
        console.log("app.state.other.foo:", newState);
        this.setState({
          number: newState + 1
        });
      }.bind(this));

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
      document.getElementById('app-state').value = JSON.stringify(app.state, null, 2)
      return <div>
        <span> Count: { this.state.number }</span>
        <div>
        <button onclick={this.increment.bind(this)}>Increment</button>
        </div>
        </div>
	  }
  }
}
