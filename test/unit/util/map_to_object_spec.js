import mapToObject from '../../../src/util/map_to_object.js';

it('converts a Map to a vanilla JS object', function() {
  const obj = mapToObject(new Map([
    ['foo', 'bar'],
    ['baz', 'ban'],
    ['foobar', 'bazbar'],
  ]));

  expect(obj).to.eql({
    foo: 'bar',
    baz: 'ban',
    foobar: 'bazbar',
  });
});
