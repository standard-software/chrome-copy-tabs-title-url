const state = {
  expandSelectOption: true,
  deleteURLParameter: false,
  deleteTitleStartBracket: true,
  replaceTitleSpaceZenToHan: true,
  deleteTitleQuoraAnserName: true,
  deleteTitleNameGitHubPullRequest: true,

  expandSetting: false,
  shortAmazonURL: true,
  noEncodeJapaneseURL: true,

  expandCopyView: true,
}

const copyText = str => {
  // console.log('copyText', str);

  // var textArea = document.createElement("textarea");
  // document.body.appendChild(textArea);
  // textArea.value = str;
  // textArea.select();
  // document.execCommand("copy");
  // document.body.removeChild(textArea);

  navigator.clipboard.writeText(str);
}

const pasteText = (callback) => {
  navigator.clipboard.readText().then(
    callback
  );
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

const urlShortAmazon = rawUrl => {
  const _urlShortAmazon = (amazonUrl, rawUrl) => {
    const url = new URL(rawUrl);
    if (url.host == amazonUrl && url.pathname.includes('/dp/')) {
      let itemId = _subLastDelimFirst(url.pathname, '/dp/');
      if (itemId.includes('/')) {
        itemId = _subFirstDelimFirst(itemId, '/');
      }
      newUrl = `${url.origin}/dp/${itemId}/`
      return newUrl;
    }
    return rawUrl;
  }

  let result = rawUrl;
  result = _urlShortAmazon('www.amazon.com', result);
  result = _urlShortAmazon('www.amazon.co.jp', result);
  return result;
}

const urlNoEncodeJapanese = url => {
  let result = url;
  try {
    result = decodeURI(url);
    result = result.replaceAll(' ', '%20');
  } catch (e) {
  }
  return result;
}

const urlDeleteParameter = rawUrl => {
  const url = new URL(rawUrl);
  const newUrl = url.origin + url.pathname;
  return newUrl;
}

const titleDeleteStartBracket = title => {
  let result = _removeTagOuterAll(title, '(', ') ');
  result = _removeTagOuterAll(result, '(', ')');
  return result;
}

const titleReplaceSpaceZenToHan = title => {
  return title.replaceAll('　', ' ');
}

const formatTitleURL = ({title, url, state}) => {
  if (state.deleteTitleStartBracket) {
    title = titleDeleteStartBracket(title);
  }
  if (state.replaceTitleSpaceZenToHan) {
    title = titleReplaceSpaceZenToHan(title);
  }
  if (state.deleteTitleQuoraAnserName) {
    title = _removeTagInnerFirst(title, 'に対する', '回答');
    title = _removeTagInnerFirst(title, '', "'s answer to").replace("'s a", 'A');
  }
  if (state.deleteTitleNameGitHubPullRequest) {
    title = _removeTagInnerFirst(title, 'by ', ' Pull Request').replace("by  ", '');
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

const onClickMenuItem = function(evt) {
  const menuItemId = this.id;
  // console.log({menuItemId});

  chrome.tabs.query({
    currentWindow: true, lastFocusedWindow: true, highlighted: true
  }, tabs => {
    let text = '';
    switch (menuItemId) {

    case 'SelectTabs-PasteURLs': {
      pasteText(text => {
        // console.log({text});

        const active = state.expandCopyView !== true;
        let pasteUrls = '';
        for (const line of text.split('\n')) {
          const urlHttp = _subLastDelimFirst(line, 'http://');
          if (urlHttp !== '') {
            const url = 'http://' + urlHttp;
            pasteUrls += url + '\n';
            chrome.tabs.create({ url, active });
          }
          const urlHttps = _subLastDelimFirst(line, 'https://');
          if (urlHttps !== '') {
            const url = 'https://' + urlHttps;
            pasteUrls += url + '\n';
            chrome.tabs.create({ url, active });
          }
        }

        if (pasteUrls === '') {
          if (state.expandCopyView === true) {
            document.querySelector("#copyView")
              .textContent = `no urls in clipboard text.`;
          }
          return;
        }

        if (state.expandCopyView === true) {
          const copyViewArea = document.querySelector("#copyView");
          copyViewArea.textContent = `${pasteUrls}\npasted.`;
        } else {
          window.close();
        }
      });

      return;
    } break;

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

const setStorageParameter = (key, value, selector) => {
  document.querySelector(selector).checked = value;

  state[key] = value;
  chrome.storage.local.set({[key]: value}, () => {});
  // console.log({key, value});
}

const getStorageParameter = (key, selector) => {
  chrome.storage.local.get(key, ({[key]: result}) => {
    if (result === true) {
      state[key] = true;
    } else if (result === false) {
      state[key] = false;
    }

    document.querySelector(selector).checked = state[key];
    // console.log('getStorageParameter', result, key, state[key]);
  });
};

const onClickAccordionSelectOption = e => {
  const { checked } = e.target;
  e.target.checked = !checked;
  if (checked && state.expandSetting) {
    setStorageParameter(
      'expandSetting',
      false,
      '#accordionSetting'
    );
    setTimeout(() => {
      setStorageParameter(
        'expandSelectOption',
        true,
        '#accordionSelectOption'
      );
    }, 500)
  } else {
    setStorageParameter(
      'expandSelectOption',
      checked,
      '#accordionSelectOption'
    );
  }
}
const onClickCheckboxURLDeleteParameter = e => {
  const { checked } = e.target;
  setStorageParameter(
    'deleteURLParameter',
    checked,
    '#checkboxURLDeleteParameter'
  );
}
const onClickCheckboxTitleDeleteStartBracket = e => {
  const { checked } = e.target;
  setStorageParameter(
    'deleteTitleStartBracket',
    checked,
    '#checkboxTitleDeleteStartBracket'
  );
}
const onClickCheckboxTitleReplaceSpaceZenToHan = e => {
  const { checked } = e.target;
  setStorageParameter(
    'replaceTitleSpaceZenToHan',
    checked,
    '#checkboxTitleReplaceSpaceZenToHan'
  );
}
const onClickCheckboxTitleDeleteQuoraAnswerName = e => {
  const { checked } = e.target;
  setStorageParameter(
    'deleteTitleQuoraAnserName',
    checked,
    '#checkboxTitleDeleteQuoraAnswerName'
  );
}
const onClickCheckboxTitleDeleteNameGitHubPullRequest = e => {
  const { checked } = e.target;
  setStorageParameter(
    'deleteTitleNameGitHubPullRequest',
    checked,
    '#checkboxTitleDeleteNameGitHubPullRequest'
  );
}

const onClickAccordionSetting = e => {
  const { checked } = e.target;
  e.target.checked = !checked;
  if (checked && state.expandSelectOption) {
    setStorageParameter(
      'expandSelectOption',
      false,
      '#accordionSelectOption'
    );
    setTimeout(() => {
      setStorageParameter(
        'expandSetting',
        true,
        '#accordionSetting'
      );
    }, 500)
  } else {
    setStorageParameter(
      'expandSetting',
      checked,
      '#accordionSetting'
    );
  }
}
const onClickCheckboxURLShortAmazon = e => {
  const { checked } = e.target;
  setStorageParameter(
    'shortAmazonURL',
    checked,
    '#checkboxURLShortAmazon'
  );
}
const onClickCheckboxURLNoEncodeJapanese = e => {
  const { checked } = e.target;
  setStorageParameter(
    'noEncodeJapaneseURL',
    checked,
    '#checkboxURLNoEncodeJapanese'
  );
}

const onClickAccordionCopyView = e => {
  const { checked } = e.target;
  setStorageParameter(
    'expandCopyView',
    checked,
    '#accordionCopyView'
  );
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#copyView").placeholder =
    "Copy Tabs Title URL\nver 1.0.2\n\n" +
    "When copy view is expanded,\nmenu item click does not close."

  document.querySelectorAll(".copy-tabs-title-url_menu-item").forEach(el => {
    el.addEventListener("click", onClickMenuItem);
  });

  document.querySelector("#accordionSelectOption")
    .addEventListener("click", onClickAccordionSelectOption);
    document.querySelector("#checkboxURLDeleteParameter")
    .addEventListener("click", onClickCheckboxURLDeleteParameter);
  document.querySelector("#checkboxTitleDeleteStartBracket")
    .addEventListener("click", onClickCheckboxTitleDeleteStartBracket);
  document.querySelector("#checkboxTitleReplaceSpaceZenToHan")
    .addEventListener("click", onClickCheckboxTitleReplaceSpaceZenToHan);
  document.querySelector("#checkboxTitleDeleteQuoraAnswerName")
    .addEventListener("click", onClickCheckboxTitleDeleteQuoraAnswerName);
  document.querySelector("#checkboxTitleDeleteNameGitHubPullRequest")
    .addEventListener("click", onClickCheckboxTitleDeleteNameGitHubPullRequest);

  document.querySelector("#accordionSetting")
    .addEventListener("click", onClickAccordionSetting);
  document.querySelector("#checkboxURLShortAmazon")
    .addEventListener("click", onClickCheckboxURLShortAmazon);
  document.querySelector("#checkboxURLNoEncodeJapanese")
    .addEventListener("click", onClickCheckboxURLNoEncodeJapanese);

  document.querySelector("#accordionCopyView")
    .addEventListener("click", onClickAccordionCopyView);

  getStorageParameter('expandSelectOption', '#accordionSelectOption')
  getStorageParameter('deleteURLParameter', '#checkboxURLDeleteParameter')
  getStorageParameter('deleteTitleStartBracket', '#checkboxTitleDeleteStartBracket')
  getStorageParameter('replaceTitleSpaceZenToHan', '#checkboxTitleReplaceSpaceZenToHan')
  getStorageParameter('deleteTitleQuoraAnserName', '#checkboxTitleDeleteQuoraAnswerName')
  getStorageParameter('deleteTitleNameGitHubPullRequest', '#checkboxTitleDeleteNameGitHubPullRequest')

  getStorageParameter('expandSetting', '#accordionSetting')
  getStorageParameter('shortAmazonURL', '#checkboxURLShortAmazon')
  getStorageParameter('noEncodeJapaneseURL', '#checkboxURLNoEncodeJapanese')

  getStorageParameter('expandCopyView', '#accordionCopyView')

});
