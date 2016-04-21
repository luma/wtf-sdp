

export default (map) => {
  const obj = {};
  for (const [key, value] of map) {
    obj[key] = value;
  }

  return obj;
};
