

import {h, render, Component, createElement} from 'preact'
import Count from './count.js'


function renderAll() {
  var container = document.getElementById('container');

  render(<Count state="myclock" />, container);
  render(<Count state="foo[]" />, container);
  render(<Count state="foo[]" />, container);
  render(<Count state="foo[]" />, container);
  render(<Count state="[]" />, container);
  render(<Count state="[]" />, container);
  render(<Count state="[]" />, container);

}

renderAll();



