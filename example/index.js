

import {h, render, createElement} from 'preact'
import Count from './count.js'


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

window.saveState = function() {
  var btn = document.getElementById('save-button');
  btn.style.backgroundColor = '';  

  var newState;
  try {
    newState = JSON.parse(document.getElementById('app-state').value);
    app.setState(newState);
  } catch(e) {
    console.error(e);
    btn.style.backgroundColor = 'red';
  }
  
}


renderAll();



