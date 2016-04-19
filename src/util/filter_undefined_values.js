
export default (obj) => {
  const filteredObj = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] !== void 0) {
      filteredObj[key] = obj[key];
    }
  }

  return filteredObj;
};
