
const state = {
  expandSetting: true,
  shortAmazonURL: true,
  noEncodeJapaneseURL: true,
  deleteURLParameter: false,
  deleteTitleStartBracket: true,
  deleteTitleQuoraAnserName: true,
  expandCopyView: true,
}

const copyText = str => {
  // console.log('copyText', str);
  var textArea = document.createElement("textarea");
  document.body.appendChild(textArea);
  textArea.value = str;
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

const _indexOfFirst = (str, search, indexStart = 0) => {
  if (search === '') {
    return -1;
  }
  return str.indexOf(search, indexStart);
};

const _indexOfLast = (
  str, search, indexStart = _max([0, str.length - 1]),
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

const _subLastDelimFirst = (str, delimiter) => {
  const index = _indexOfFirst(str, delimiter);
  if (index === -1) {
    return '';
  } else {
    return _subLength(str, index + delimiter.length);
  }
};

const _subFirstDelimFirst = (str, delimiter) => {
  const index = _indexOfFirst(str, delimiter);
  if (index === -1) {
    return '';
  } else {
    return _subIndex(str, 0, index - 1);
  }
};

const _deleteIndex = (
  str, indexStart, indexEnd = indexStart,
) => {
  const startStr = str.slice(0, indexStart);
  const endStr = str.slice(indexEnd + 1, str.length);
  return startStr + endStr;
};

const _removeTagOuterFirst = (str, startTag, endTag) => {
  if (str === '') { return str; }

  let indexStartTag = _indexOfFirst(str, startTag);
  if (indexStartTag === -1) {
    return str;
  }
  const indexEndTag = _indexOfFirst(str, endTag, indexStartTag + startTag.length);
  if (indexEndTag === -1) {
    return str;
  }
  indexStartTag = _indexOfLast(str, startTag, indexEndTag - startTag.length);
  if (indexStartTag === -1) {
    return '';
  }
  return _deleteIndex(str, indexStartTag, indexEndTag + endTag.length - 1);
};

const _removeTagInnerFirst = (str, startTag, endTag) => {
  if (str === '') { return str; }

  let indexStartTag = _indexOfFirst(str, startTag);
  if (indexStartTag === -1) {
    return str;
  }
  const indexEndTag = _indexOfFirst(str, endTag, indexStartTag + startTag.length);
  if (indexEndTag === -1) {
    return str;
  }
  indexStartTag = _indexOfLast(str, startTag, indexEndTag - startTag.length);
  if (indexStartTag === -1) {
    return '';
  }
  return _deleteIndex(str, indexStartTag + startTag.length, indexEndTag + - 1);
};

const urlShortAmazon = rawUrl => {
  const AMAZON_HOST = "www.amazon.co.jp";
  const url = new URL(rawUrl);
  if (url.host == AMAZON_HOST && url.pathname.includes('/dp/')) {
    let itemId = _subLastDelimFirst(url.pathname, '/dp/');
    if (itemId.includes('/')) {
      itemId = _subFirstDelimFirst(itemId, '/');
    }
    newUrl = `${url.origin}/dp/${itemId}/`
    return newUrl;
  } else {
    return rawUrl;
  }
}

const urlNoEncodeJapanese = url => {
  return decodeURI(url);
}

const urlDeleteParameter = rawUrl => {
  const url = new URL(rawUrl);
  const newUrl = url.origin + url.pathname;
  return newUrl;
}

const titleDeleteStartBracket = title => {
  const excludeBracket = (start, end) => {
    const indexStartbracket = _indexOfFirst(title, start);
    const indexEndbracket = _indexOfFirst(title, end);

    if (indexStartbracket === -1 || indexEndbracket === -1) {
      return title;
    }
    if (indexEndbracket < indexStartbracket) {
      return title;
    }

    let result = _subFirstDelimFirst(title, start);
    result += _subLastDelimFirst(title, end);
    return result;
  }

  let result  = excludeBracket('(', ') ');
  if (result !== title) {
    return result;
  }
  result = excludeBracket('(', ')');
  return result;
}

const formatURL = (url, state) => {
  // console.log('formatURL', {url, state});


  return url;
}

const formatTitleURL = ({title, url, state}) => {
  if (state.deleteTitleStartBracket) {
    title = titleDeleteStartBracket(title);
  }
  if (state.deleteTitleQuoraAnserName) {
    title = _removeTagInnerFirst(title, 'に対する', '回答')
  }

  if (state.deleteURLParameter) {
    url = urlDeleteParameter(url);
  }
  if (state.shortAmazonURL) {
    url = urlShortAmazon(url);
  }
  if (state.noEncodeJapaneseURL) {
    url = urlNoEncodeJapanese(url);
  }

  return { title, url };
}

const copyTitleURL = menuItemId => {
  // console.log('copyTitleURL', menuItemId);
  chrome.tabs.query({ currentWindow: true, lastFocusedWindow: true, highlighted: true }, tabs => {
    let text = '';
    switch (menuItemId) {

    case 'SelectTabs-TitleURL': {
      // console.log('copyTitleURL SelectTabs-TitleURL', tabs)
      for (const tab of tabs) {
        const { title, url } = formatTitleURL({...tab, state});
        text += text === '' ? '' : '\n';
        text += `${title}\n${url}\n`
      }
    } break;

    case 'SelectTabs-Markdown': {
      for (const tab of tabs) {
        const { title, url } = formatTitleURL({...tab, state});
        text += `[${title}](${url})\n`
      }
    } break;

    case 'SelectTabs-Title': {
      for (const tab of tabs) {
        const { title } = formatTitleURL({...tab, state});
        text += `${title}\n`
      }
    } break;

    case 'SelectTabs-URL': {
      for (const tab of tabs) {
        const { url } = formatTitleURL({...tab, state});
        text += `${url}\n`
      }
    } break;
    }

    copyText(text);
    if (state.expandCopyView === true) {
      const copyViewArea = document.querySelector("#copyView");
      copyViewArea.textContent = `${text}\ncopied.`;
    } else {
      window.close();
    }

  })
}

const onClickMenuItem = function(evt) {
  const menuItemId = this.id;
  // console.log({menuItemId})
  copyTitleURL(menuItemId)
}

const setStorageParameter = (key, value) => {
  state[key] = value;
  chrome.storage.local.set({[key]: value}, () => {});
  // console.log({key, value});
}

const onClickAccordionSetting = e => {
  // console.log({e})
  setStorageParameter('expandSetting', e.srcElement.checked);
}
const onClickCheckboxURLShortAmazon = e => {
  setStorageParameter('shortAmazonURL', e.srcElement.checked);
}
const onClickCheckboxURLNoEncodeJapanese = e => {
  setStorageParameter('noEncodeJapaneseURL', e.srcElement.checked);
}
const onClickCheckboxURLDeleteParameter = e => {
  setStorageParameter('deleteURLParameter', e.srcElement.checked);
}
const onClickCheckboxTitleDeleteStartBracket = e => {
  setStorageParameter('deleteTitleStartBracket', e.srcElement.checked);
}
const onClickCheckboxTitleDeleteQuoraAnserName = e => {
  setStorageParameter('deleteTitleQuoraAnserName', e.srcElement.checked);
}
const onClickAccordionCopyView = e => {
  setStorageParameter('expandCopyView', e.srcElement.checked);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#copyView").placeholder =
    "Copy Tabs Title URL\nver 0.3.0 beta\n\n" +
    "When copy view is expanded,\nmenu item click does not close."

  document.querySelectorAll(".copy-tabs-title-url_menu-item").forEach(el => {
    el.addEventListener("click", onClickMenuItem);
  });

  document.querySelector("#accordionSetting")
    .addEventListener("click", onClickAccordionSetting);
  document.querySelector("#checkboxURLShortAmazon")
    .addEventListener("click", onClickCheckboxURLShortAmazon);
  document.querySelector("#checkboxURLNoEncodeJapanese")
    .addEventListener("click", onClickCheckboxURLNoEncodeJapanese);
  document.querySelector("#checkboxURLDeleteParameter")
    .addEventListener("click", onClickCheckboxURLDeleteParameter);
  document.querySelector("#checkboxTitleDeleteStartBracket")
    .addEventListener("click", onClickCheckboxTitleDeleteStartBracket);
  document.querySelector("#checkboxTitleDeleteQuoraAnswerName")
    .addEventListener("click", onClickCheckboxTitleDeleteQuoraAnserName);
  document.querySelector("#accordionCopyView")
    .addEventListener("click", onClickAccordionCopyView);

  const getStorageParameter = (key, selector) => {
    chrome.storage.local.get(key, ({[key]: result}) => {
      if (result === true) {
        state[key] = true;
      } else if (result === false) {
        state[key] = false;
      }
      if (state[key]) {
        document.querySelector(`${selector}`)
          .checked = true;
      }
      // console.log('getStorageParameter', result, key, state[key]);
    });
  };
  getStorageParameter('expandSetting', '#accordionSetting')
  getStorageParameter('shortAmazonURL', '#checkboxInputURLShortAmazon')
  getStorageParameter('noEncodeJapaneseURL', '#checkboxInputURLNoEncodeJapanese')
  getStorageParameter('deleteURLParameter', '#checkboxInputURLDeleteParameter')
  getStorageParameter('deleteTitleStartBracket', '#checkboxInputTitleDeleteStartBracket')
  getStorageParameter('deleteTitleQuoraAnserName', '#checkboxInputTitleDeleteQuoraAnswerName')
  getStorageParameter('expandCopyView', '#accordionCopyView')

});
