
import {h} from 'preact'

module.exports = function(Component) {

  return class Count extends Component {

    constructor(props) {
      super(props);

      this.setState({
        number: 1000
      });

      this.listen('number', function(newState) {
        console.log("My number changed to:", newState);
      });
    }
    
    increment() {
      this.changeState({
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
