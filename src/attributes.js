import memoize from 'lodash.memoize';

export default class Attributes {
  constructor(attrLines) {
    const self = this;

    Object.defineProperties(this, {
      all: { value: attrLines },
      first: {
        value: memoize((type) => self.find((attr) => attr.type === type)),
      },
      get: {
        value: memoize((type) => self.filter((attr) => attr.type === type)
                                     .map((attr) => attr.value)),
      },
    });
  }

  get length() {
    return this.all.length;
  }

  [Symbol.iterator]() {
    // Just proxy this to the raw one for now
    return this.all[Symbol.iterator]();
  }

  has(type) {
    return this.all.find((attr) => attr.type === type) !== void 0;
  }

  find(predicate, thisArg) {
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }

    const attr = this.all.find(predicate, thisArg);
    return attr ? attr.value : void 0;
  }

  filter(predicate, thisArg) {
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }

    return this.all.filter(predicate, thisArg);
  }

  toJson() {
    return this.all;
  }
}
