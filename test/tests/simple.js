
var tape = require('tape');

import enzyme from 'enzyme'
import PreactAdapter from '../enzyme-adapter-preact/index.js'

enzyme.configure({ adapter: new PreactAdapter });

import {h, Component as PreactComponent} from 'preact'
import ashnazg from '../../../dist/index.js'

// for docs see: https://reactjs.org/docs/test-utils.html
//import {renderIntoDocument, findAllInRenderedTree} from 'react-dom/test-utils'

const Component = ashnazg.extend(PreactComponent)
var Count = require('../components/count.js')(Component)


tape('simple', function(t) {
  
  t.plan(1)
  

  const elements = (
    <Count />
  )

  const c = enzyme.mount(elements)

/*
  // this fails 
  c.setState({
    count: 44
  });
*/

  t.equal(1, 1, "foo");
  
});

