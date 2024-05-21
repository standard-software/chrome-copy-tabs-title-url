const stateSettings = [
  [`expandCopyOption1`,          false,   `#accordionCopyOption1`],
  [`titleDeleteBrackets`,        false,   `#chkTitleDeleteBrackets`],
  [`titleReplaceSpaceZenToHan`,  false,   `#chkTitleReplaceSpaceZenToHan`],
  [`titleAfterDelim`,            false,   `#chkTitleAfterDelim`],
  [`urlDeleteParameter`,         false,   `#chkUrlDeleteParameter`],

  [`expandCopyOption2`,          false,   `#accordionCopyOption2`],
  [`titleDeleteUserGitHubPr`,    true,    `#chkTitleDeleteUserGitHubPr`],
  [`titleDeleteQuoraAnswer`,     true,    `#chkTitleDeleteQuoraAnswer`],
  [`urlShortAmazon`,             true,    `#chkUrlShortAmazon`],
  [`urlNoEncodeJapanese`,        true,    `#chkUrlNoEncodeJapanese`],

  [`expandInfoView`,             false,   `#accordionInfoView`],
];
const state = {};
const selector = {};
const stateKeys = [];
for (const setting of stateSettings) {
  const [key, value, selectorValue] = setting;
  state[key] = value;
  selector[key] = selectorValue;
  stateKeys.push(key);
}

const copyText = str => {
  // console.log(`copyText`, str);

  navigator.clipboard.writeText(str);
};

const pasteText = (callback) => {
  navigator.clipboard.readText().then(
    callback
  );
};

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

const formatTitleURL = ({title, url, state}) => {
  if (state.titleDeleteBrackets) {
    title = _removeTagOuterAll(title, '(', ') ');
    title = _removeTagOuterAll(title, '(', ')');
  }
  if (state.titleReplaceSpaceZenToHan) {
    title = title.replaceAll('　', ' ');
  }
  if (state.titleDeleteQuoraAnswer) {
    title = _removeTagInnerFirst(title, 'に対する', '回答');
    title = _removeTagInnerFirst(title, '', "'s answer to").replace("'s a", 'A');
  }
  if (state.titleDeleteUserGitHubPr) {
    title = _removeTagInnerFirst(title, 'by ', ' Pull Request').replace("by  ", '');
  }
  if (state.titleAfterDelim) {
    if (title.indexOf(' · ') !== -1) {
      title = _subFirstDelimLast(title, ' · ');
    }
    if (title.indexOf(' | ') !== -1) {
      title = _subFirstDelimLast(title, ' | ');
    }
    if (title.indexOf(' - ') !== -1) {
      title = _subFirstDelimLast(title, ' - ');
    }
    if (title.indexOf(' – ') !== -1) {
      title = _subFirstDelimLast(title, ' – ');
    }
  }
  console.log(`98`, state.titleAfterDelim, title);

  if (state.urlDeleteParameter) {
    url = urlDeleteParameter(url);
  }
  if (state.urlShortAmazon) {
    url = urlShortAmazon(url);
  }
  if (state.urlNoEncodeJapanese) {
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

        const active = state.expandInfoView !== true;
        let pasteUrls = '';
        const getUrl = (line, protocol, newProtocol = protocol) => {
          const urlProtocolBracket = _subLastDelimFirst(line, `(${protocol}`);
          if (urlProtocolBracket !== '') {
            const url = `${newProtocol}${_subFirstDelimLast(urlProtocolBracket, ')')}`;
            pasteUrls += url + '\n';
            chrome.tabs.create({ url, active });
            return;
          }
          const urlProtocol = _subLastDelimFirst(line, protocol);
          if (urlProtocol !== '') {
            const url = `${newProtocol}${urlProtocol}`;
            pasteUrls += url + '\n';
            chrome.tabs.create({ url, active });
            return;
          }
        }
        for (const line of text.split('\n')) {
          getUrl(line, 'http://');
          getUrl(line, 'https://');
          getUrl(line, 'chrome://');
          getUrl(line, 'edge://', 'chrome://');
        }

        if (pasteUrls === '') {
          if (state.expandInfoView === true) {
            document.querySelector("#infoView")
              .textContent = `no urls in clipboard text.`;
          }
          return;
        }

        if (state.expandInfoView === true) {
          document.querySelector("#infoView")
            .textContent = `${pasteUrls}\npasted.`;
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
    if (state.expandInfoView === true) {
      document.querySelector("#infoView")
        .textContent = `${text}\ncopied.`;
    } else {
      window.close();
    }

  })

}

const setStorageParam = (key, value) => {
  document.querySelector(selector[key]).checked = value;

  state[key] = value;
  chrome.storage.local.set({[key]: value}, () => {});
  // console.log({key, value});
}

const onClickAccordionCopyOption1 = e => {
  const { checked } = e.target;
  e.target.checked = !checked;
  if (checked && state.expandCopyOption2) {
    setStorageParam('expandCopyOption2', false);
    setTimeout(() => {
      setStorageParam('expandCopyOption1', true);
    }, 500)
  } else {
    setStorageParam('expandCopyOption1', checked);
  }
}
const onClickCheckboxUrlDeleteParameter = e => {
  const { checked } = e.target;
  setStorageParam('urlDeleteParameter', checked);
}
const onClickCheckboxTitleDeleteBrackets = e => {
  const { checked } = e.target;
  setStorageParam('titleDeleteBrackets', checked);
}
const onClickCheckboxTitleReplaceSpaceZenToHan = e => {
  const { checked } = e.target;
  setStorageParam('titleReplaceSpaceZenToHan', checked);
}
const onClickCheckboxTitleDeleteQuoraAnswer = e => {
  const { checked } = e.target;
  setStorageParam('titleDeleteQuoraAnswer', checked);
}
const onClickCheckboxTitleDeleteUserGitHubPr = e => {
  const { checked } = e.target;
  setStorageParam('titleDeleteUserGitHubPr', checked);
}

const onClickAccordionCopyOption2 = e => {
  const { checked } = e.target;
  e.target.checked = !checked;
  if (checked && state.expandCopyOption1) {
    setStorageParam('expandCopyOption1', false);
    setTimeout(() => {
      setStorageParam('expandCopyOption2', true);
    }, 500)
  } else {
    setStorageParam('expandCopyOption2', checked);
  }
}
const onClickCheckboxUrlShortAmazon = e => {
  const { checked } = e.target;
  setStorageParam('urlShortAmazon', checked);
}
const onClickCheckboxUrlNoEncodeJapanese = e => {
  const { checked } = e.target;
  setStorageParam('urlNoEncodeJapanese', checked);
}

const onClickCheckboxTitleAfterDelim = e => {
  const { checked } = e.target;
  setStorageParam('titleAfterDelim', checked);
}

const onClickAccordionInfoView = e => {
  const { checked } = e.target;
  setStorageParam('expandInfoView', checked);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#infoView").placeholder =
    "Copy Tabs Title URL\nver 1.2.0 β\n\n" +
    "When copy view is expanded,\nmenu item click does not close."

  document.querySelectorAll(".copy-tabs-title-url_menu-item").forEach(el => {
    el.addEventListener("click", onClickMenuItem);
  });

  const addEventClick = (selector, fn) => {
    document.querySelector(selector).addEventListener(`click`, fn);
  };
  addEventClick("#accordionCopyOption1",          onClickAccordionCopyOption1);
  addEventClick("#chkTitleDeleteBrackets",        onClickCheckboxTitleDeleteBrackets);
  addEventClick("#chkTitleReplaceSpaceZenToHan",  onClickCheckboxTitleReplaceSpaceZenToHan);
  addEventClick("#chkTitleAfterDelim",            onClickCheckboxTitleAfterDelim);
  addEventClick("#chkUrlDeleteParameter",         onClickCheckboxUrlDeleteParameter);

  addEventClick("#accordionCopyOption2",          onClickAccordionCopyOption2);
  addEventClick("#chkTitleDeleteUserGitHubPr",    onClickCheckboxTitleDeleteUserGitHubPr);
  addEventClick("#chkTitleDeleteQuoraAnswer",     onClickCheckboxTitleDeleteQuoraAnswer);
  addEventClick("#chkUrlShortAmazon",             onClickCheckboxUrlShortAmazon);
  addEventClick("#chkUrlNoEncodeJapanese",        onClickCheckboxUrlNoEncodeJapanese);

  addEventClick("#accordionInfoView",             onClickAccordionInfoView);

  chrome.storage.local.get(stateKeys, (data) => {
    if (stateKeys.every(key => !isUndefined(data[key]))) {
      for (const key of Object.keys(data)) {
        state[key] = data[key];
        document.querySelector(selector[key]).checked = data[key];
      }
      return;
    }

    console.log(`version up`, {data});

    // version up
    const verUpKeyTable = [
      [`expandSelectOption`,                `expandCopyOption1`],
      [`deleteURLParameter`,                `urlDeleteParameter`],
      [`deleteTitleStartBracket`,           `titleDeleteBrackets`],
      [`replaceTitleSpaceZenToHan`,         `titleReplaceSpaceZenToHan`],
      [`deleteTitleQuoraAnserName`,         `titleDeleteQuoraAnswer`],
      [`deleteTitleNameGitHubPullRequest`,  `titleDeleteUserGitHubPr`],

      [`expandSetting`,                     `expandCopyOption2`],
      [`shortAmazonURL`,                    `urlShortAmazon`],
      [`noEncodeJapaneseURL`,               `urlNoEncodeJapanese`],

      [`expandCopyView`,                    `expandInfoView`],
    ];
    const oldStateKeys = [];
    for (const [oldKey, _] of verUpKeyTable) {
      oldStateKeys.push(oldKey);
    }

    chrome.storage.local.get(oldStateKeys, (data) => {
      for (const [oldKey, newKey] of verUpKeyTable) {
        if (data[oldKey] === true) {
          state[newKey] = true;
        } else if (data[oldKey] === false) {
          state[newKey] = true;
        } else {
          continue;
        }
      }

      for (const key of stateKeys) {
        document.querySelector(selector[key]).checked = state[key];
      }

      chrome.storage.local.clear(() => {
        chrome.storage.local.set(state, () => {});
      });

    });
  })


});
