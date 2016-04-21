import memoize from 'lodash.memoize';

export default class Attributes {
  /**
   * A collection of attributes. It also provides a number of simple helper
   * methods for searching and filtering.
   *
   * @constructor
   * @param  {Array} attrLines An Array of objects, where each object is a SDP attribute
   */
  constructor(attrLines) {
    const self = this;

    Object.defineProperties(this, {
      /**
       * Get all the attributes as a vanilla Array.
       *
       * @property {Array} all - returns the Array of attributes
       * @memberof Attributes#
       */
      all: { value: attrLines },

      /**
       * Get the first attribute with a specific type
       *
       * @param {String} type the type of attribute that we want to return
       * @return {Object|undefined} the desired attribute or undefined if one could not be found
       * @method #first
       * @memberof Attributes
       *
       */
      first: {
        value: memoize((type) => self.find((attr) => attr.type === type)),
      },

      /**
       * Get all attributes with a specific type
       *
       * @param {String} type the type of attribute that we want to return
       * @return {Array} All attributes with the desired attribute
       * @method #get
       * @memberof Attributes
       *
       */
      get: {
        value: memoize((type) => self.filter((attr) => attr.type === type)
                                     .map((attr) => attr.value)),
      },
    });
  }

  /**
   * Gets the number of Attributes
   *
   * @property {Number} length - the number of Attributes
   * @memberof Attributes#
   */
  get length() {
    return this.all.length;
  }

  [Symbol.iterator]() {
    // Just proxy this to the raw one for now
    return this.all[Symbol.iterator]();
  }

  /**
   * Indicates whether there is at least one attribute with a specific type
   * @param  {String}  type The attribute type to search for
   * @return {Boolean}      Returns true if there are any attributes of type, false otherwise
   */
  has(type) {
    return this.all.find((attr) => attr.type === type) !== void 0;
  }

  /**
   * Retrieves the first attribute that results in the predicate returning true.
   *
   * @param  {Function} predicate A function that performs the search. It will be called
   * for each attribute and returns true when it finds a match
   * @param  {Object} thisArg     Optional. The value of this to use when calling predicate
   * @return {Object|undefined}   Either the desired attribute or undefined
   */
  find(predicate, thisArg) {
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }

    const attr = this.all.find(predicate, thisArg);
    return attr ? attr.value : void 0;
  }

  /**
   * Retrieves all attributes that results in the predicate returning true.
   *
   * @param  {Function} predicate A function that performs the search. It will be called
   * for each attribute and returns true when it finds a match
   * @param  {Object} thisArg     Optional. The value of this to use when calling predicate
   * @return {Array}              All matched attributes.
   */
  filter(predicate, thisArg) {
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }

    return this.all.filter(predicate, thisArg);
  }

  /**
   * Returns a simple JSON representation of the attributes.
   *
   * @return {String} A JSON version of this object
   */
  toJson() {
    return this.all;
  }
}
