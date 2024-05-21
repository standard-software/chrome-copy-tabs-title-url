const isUndefined = (value) => {
  return typeof value === 'undefined';
};

const isNumber = (value) => {
  return (typeof value === 'number' && (isFinite(value)));
};

const __max = (array) => {
  if (array.length === 0) {
    return null;
  }
  let result = array[0];
  for (let i = 0, l = array.length; i < l; i += 1) {
    if (!isNumber(array[i])) {
      throw new TypeError(
        '__max args(array) element is not number',
      );
    }
    if (result < array[i]) {
      result = array[i];
    }
  }
  return result;
};

const _indexOfFirst = (str, search, indexStart = 0) => {
  if (search === '') {
    return -1;
  }
  return str.indexOf(search, indexStart);
};

const _indexOfLast = (
  str, search, indexStart = __max([0, str.length - 1]),
) => {
  if (search === '') {
    return -1;
  }
  return str.lastIndexOf(search, indexStart);
};

const _subIndex = (
  str, indexStart, indexEnd = indexStart,
) => {
  return str.substring(indexStart, indexEnd + 1);
};

const _subLength = (
  str, index, length = str.length - index,
) => {
  return str.substring(index, index + length);
};

const _subFirstDelimFirst = (str, delimiter) => {
  const index = _indexOfFirst(str, delimiter);
  if (index === -1) {
    return '';
  } else {
    return _subIndex(str, 0, index - 1);
  }
};

const _subFirstDelimLast = (str, delimiter) => {
  const index = _indexOfLast(str, delimiter);
  if (index === -1) {
    return '';
  } else {
    return _subIndex(str, 0, index - 1);
  }
};

const _subLastDelimFirst = (str, delimiter) => {
  const index = _indexOfFirst(str, delimiter);
  if (index === -1) {
    return '';
  } else {
    return _subLength(str, index + delimiter.length);
  }
};

const _subLastDelimLast = (str, delimiter) => {
  const index = _indexOfLast(str, delimiter);
  if (index === -1) {
    return '';
  } else {
    return _subLength(str, index + delimiter.length);
  }
};

const _deleteIndex = (
  str, indexStart, indexEnd = indexStart,
) => {
  const startStr = str.slice(0, indexStart);
  const endStr = str.slice(indexEnd + 1, str.length);
  return startStr + endStr;
};

const _removeTagInnerFirst = (str, startTag, endTag) => {
  if (str === '') { return str; }

  let indexStartTag;
  if (startTag === '') {
    indexStartTag = 0;
  } else {
    indexStartTag = _indexOfFirst(str, startTag);
    if (indexStartTag === -1) {
      return str;
    }
  }

  let indexEndTag;
  if (endTag === '') {
    indexEndTag = str.length - 1;
  } else {
    indexEndTag = _indexOfFirst(str, endTag, indexStartTag + startTag.length);
    if (indexEndTag === -1) {
      return str;
    }
  }

  if (startTag !== '') {
    // support
    //  AAA<<<BBB<<<CCC>>>DDD
    indexStartTag = _indexOfLast(str, startTag, indexEndTag - startTag.length);
    if (indexStartTag === -1) {
      throw new Error('_removeTagInnerFirst')
    }
  }
  return _deleteIndex(str, indexStartTag + startTag.length, indexEndTag + - 1);
};

const _removeTagOuterAll = (str, startTag, endTag) => {
  let before = str;
  while (true) {
    let result = _removeTagInnerFirst(before, startTag, endTag);
    result = result.replace(startTag+endTag, '');
    console.log(before, result);
    if (before === result) {
      return result;
    }
    before = result;
  }
}
