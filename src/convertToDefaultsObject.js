import isObject from 'lodash/isObject';

const convertToDefaultsObject = (value, mainKey='main', defaultValues={}) => {
  if (Array.isArray(value) || !isObject(value)) {
    return { ...defaultValues, [mainKey]: value };
  }
  return { ...defaultValues, ...value };
};

export default convertToDefaultsObject;
