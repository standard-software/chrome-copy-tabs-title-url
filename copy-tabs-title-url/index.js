
const state = {
  settingExpand: true,
  shortAmazonURL: true,
  noEncodeJapaneseURL: true,
  deleteURLParameter: false,
  deleteTitleStartBracket: true,
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
  if (!title.trim().startsWith('(')) {
    return title;
  }
  if (!title.includes(')')) {
    return title;
  }
  let result = _subLastDelimFirst(title, ') ');
  if (result !== title) {
    return result;
  }
  result = _subLastDelimFirst(title, ')');
  return result;
}

const formatURL = (url, state) => {
  // console.log('formatURL', {url, state});

  if (state.deleteURLParameter) {
    url = urlDeleteParameter(url);
  }
  if (state.shortAmazonURL) {
    url = urlShortAmazon(url);
  }
  if (state.noEncodeJapaneseURL) {
    url = urlNoEncodeJapanese(url);
  }
  return url;
}

const formatTitle = (title, state) => {
  // console.log('formatTitle', {title, state});
  if (state.deleteTitleStartBracket) {
    title = titleDeleteStartBracket(title);
  }
  return title;
}

const copyTitleURL = menuItemId => {
  // console.log('copyTitleURL', menuItemId);
  chrome.tabs.query({ currentWindow: true, lastFocusedWindow: true, highlighted: true }, tabs => {
    let text = '';
    switch (menuItemId) {

    case 'SelectTabs-TitleURL': {
      // console.log('copyTitleURL SelectTabs-TitleURL', tabs)
      for (const tab of tabs) {
        let url = tab.url;
        let title = tab.title;
        url = formatURL(url, state);
        title = formatTitle(title, state);
        text += text === '' ? '' : '\n';
        text += `${title}\n${url}\n`
      }
    } break;

    case 'SelectTabs-Markdown': {
      for (const tab of tabs) {
        let url = tab.url;
        let title = tab.title;
        url = formatURL(url, state);
        title = formatTitle(title, state);
        text += `[${title}](${url})\n`
      }
    } break;

    case 'SelectTabs-Title': {
      for (const tab of tabs) {
        let title = tab.title;
        title = formatTitle(title, state);
        text += `${title}\n`
      }
    } break;

    case 'SelectTabs-URL': {
      for (const tab of tabs) {
        let url = tab.url;
        url = formatURL(url, state);
        text += `${url}\n`
      }
    } break;
    }

    copyText(text);
    window.close();

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
  console.log({key, value});
}

const onClickAccordionSetting = e => {
  console.log({e})
  setStorageParameter('settingExpand', e.srcElement.checked);
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

const onLoaded = _ => {
  document.querySelectorAll(".copy-tabs-title-url_menu-item").forEach(el => {
    el.addEventListener("click", onClickMenuItem);
  });

  document.querySelector("#accordionInputSetting")
    .addEventListener("click", onClickAccordionSetting);
  document.querySelector("#checkboxURLShortAmazon")
    .addEventListener("click", onClickCheckboxURLShortAmazon);
  document.querySelector("#checkboxURLNoEncodeJapanese")
    .addEventListener("click", onClickCheckboxURLNoEncodeJapanese);
  document.querySelector("#checkboxURLDeleteParameter")
    .addEventListener("click", onClickCheckboxURLDeleteParameter);
  document.querySelector("#checkboxTitleDeleteStartBracket")
    .addEventListener("click", onClickCheckboxTitleDeleteStartBracket);

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
      console.log('getStorageParameter', result, key, state[key]);
    });
  };
  getStorageParameter('settingExpand', '#accordionInputSetting')
  getStorageParameter('shortAmazonURL', '#checkboxInputURLShortAmazon')
  getStorageParameter('noEncodeJapaneseURL', '#checkboxInputURLNoEncodeJapanese')
  getStorageParameter('deleteURLParameter', '#checkboxInputURLDeleteParameter')
  getStorageParameter('deleteTitleStartBracket', '#checkboxInputTitleDeleteStartBracket')

}

document.addEventListener("DOMContentLoaded", onLoaded);
