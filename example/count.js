
import {h} from 'preact'
import ashnazg from './ashnazg'

module.exports = function(Component) {

  return class Count extends Component {

    constructor(props) {
      super(props);

      this.listen('number', function(newState) {
        console.log("this.state.number:", newState);
//        console.log("this.state.number:", this.state.number);
//        if(app.state && app.state.yourclock) {
//          console.log("app.state.yourclock.number:", app.state.yourclock.number);
//        }
//        this.changeState({
//          foo: newState
//        });
      });

/*
      this.listen('foo', function(newState) {
        console.log("foo changed to:", newState);
//        console.log("this.state.number:", this.state.number);
//        if(app.state && app.state.yourclock) {
//          console.log("app.state.yourclock.number:", app.state.yourclock.number);
//        }
//        this.changeState({
//          foo: newState
//        });
      });
*/

      ashnazg.listen('other.foo', function(newState) {
        console.log("app.state.other.foo:", newState);
        this.setState({
          number: newState
        });
      }.bind(this));

//      this.listen('foo', function(newState) {
//        console.log("foo called");
//      });

      this.setState({
        number: 1000
      });
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
