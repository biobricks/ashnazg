
var tape = require('tape');

import React from 'react'

import {mount} from 'enzyme'

import ashnazg from '../../../dist/index.js'

// for docs see: https://reactjs.org/docs/test-utils.html
//import {renderIntoDocument, findAllInRenderedTree} from 'react-dom/test-utils'

const Component = ashnazg.extend(React.Component, {object: global})
var Count = require('../components/count.js')(Component)

tape('simple', function(t) {
  
  t.plan(1)
  
  const elements = (
    <Count state="counter" />
  )

  const c = mount(elements)

  c.setState({
    number: 42
  });

  t.equal(parseInt(c.find('.count').text()), 42, "foo");
  
});

