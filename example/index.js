

import {h, render, createElement, Component as PreactComponent} from 'preact'
import ashnazg from './ashnazg'

const Component = ashnazg.extend(PreactComponent)
var Count = require('./count.js')(Component)

function renderAll() {
  var container = document.getElementById('container');

  render(<Count state="bob.myclock" />, container);
  render(<Count state="yourclock" />, container);
  render(<Count state="foo[]" />, container);
  render(<Count state="foo[]" />, container);
  render(<Count state="foo[]" />, container);
  render(<Count state="[]" />, container);
  render(<Count state="[]" />, container);
  render(<Count state="[]" />, container);
}

ashnazg.listen('bob.myclock', function(newState) {
  console.log("LISTENER TRIGGERED", JSON.stringify(newState, null, 2));
});

window.saveState = function() {
  var btn = document.getElementById('save-button');
  btn.style.backgroundColor = '';  

  var newState;
  try {
    newState = JSON.parse(document.getElementById('app-state').value);
    app.setState(newState);
    document.getElementById('app-state').value = JSON.stringify(app.state, 2);
  } catch(e) {
    console.error(e);
    btn.style.backgroundColor = 'red';
  }
  
}

window.changeState = function() {
  var btn = document.getElementById('change-button');
  btn.style.backgroundColor = '';  

  var stateChange;
  try {
    stateChange = JSON.parse(document.getElementById('app-state-change').value);
    app.changeState(stateChange);
    document.getElementById('app-state').value = JSON.stringify(app.state, 2);
  } catch(e) {
    console.error(e);
    btn.style.backgroundColor = 'red';
  }
  
}


renderAll();



