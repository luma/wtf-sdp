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
        value: memoize((type) => self.filter((attr) => attr.type === type)),
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
    return this.first(type) !== void 0;
  }

  find(callback, thisArg) {
    const attr = this.all.find(callback, thisArg);
    return attr ? attr.value : void 0;
  }

  filter(callback, thisArg) {
    return this.all.filter(callback, thisArg);
  }
}
