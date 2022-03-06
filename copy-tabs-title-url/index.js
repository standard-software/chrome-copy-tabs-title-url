
let state = {
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
        text += `${title}\n${url}\n\n`
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

const onLoaded = _ => {
  document.querySelectorAll(".copy-tabs-title-url_menu-item").forEach(el => {
    el.addEventListener("click", onClickMenuItem);
  });
}

document.addEventListener("DOMContentLoaded", onLoaded);
