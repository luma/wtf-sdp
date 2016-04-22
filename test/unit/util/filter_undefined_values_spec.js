import filterUndefinedValues from '../../../src/util/filter_undefined_values.js';

describe('filterUndefinedValues', function() {
  let test;

  beforeEach(function() {
    test = filterUndefinedValues({
      foo: 'foo',
      bar: void 0,
      baz: 'baz',
      foobar: void 0,
      barbaz: void 0,
    });
  });

  it('filters out undefined values', function() {
    expect(test).to.not.have.property('bar');
    expect(test).to.not.have.property('foobar');
    expect(test).to.not.have.property('barbaz');
  });

  it('does not filter out defined values', function() {
    expect(test).to.have.property('foo', 'foo');
    expect(test).to.have.property('baz', 'baz');
  });
});
