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

  [`expandCopyView`,             false,   `#accordionCopyView`],
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

        const active = state.expandCopyView !== true;
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

const setStorageParam = (key, value, selector) => {
  document.querySelector(selector).checked = value;

  state[key] = value;
  chrome.storage.local.set({[key]: value}, () => {});
  // console.log({key, value});
}

const onClickAccordionCopyOption1 = e => {
  const { checked } = e.target;
  e.target.checked = !checked;
  if (checked && state.expandCopyOption2) {
    setStorageParam(
      'expandCopyOption2',
      false,
      '#accordionCopyOption2'
    );
    setTimeout(() => {
      setStorageParam(
        'expandCopyOption1',
        true,
        '#accordionCopyOption1'
      );
    }, 500)
  } else {
    setStorageParam(
      'expandCopyOption1',
      checked,
      '#accordionCopyOption1'
    );
  }
}
const onClickCheckboxUrlDeleteParameter = e => {
  const { checked } = e.target;
  setStorageParam(
    'urlDeleteParameter',
    checked,
    '#chkUrlDeleteParameter'
  );
}
const onClickCheckboxTitleDeleteBrackets = e => {
  const { checked } = e.target;
  setStorageParam(
    'titleDeleteBrackets',
    checked,
    '#chkTitleDeleteBrackets'
  );
}
const onClickCheckboxTitleReplaceSpaceZenToHan = e => {
  const { checked } = e.target;
  setStorageParam(
    'titleReplaceSpaceZenToHan',
    checked,
    '#chkTitleReplaceSpaceZenToHan'
  );
}
const onClickCheckboxTitleDeleteQuoraAnswer = e => {
  const { checked } = e.target;
  setStorageParam(
    'titleDeleteQuoraAnswer',
    checked,
    '#chkTitleDeleteQuoraAnswer'
  );
}
const onClickCheckboxTitleDeleteUserGitHubPr = e => {
  const { checked } = e.target;
  setStorageParam(
    'titleDeleteUserGitHubPr',
    checked,
    '#chkTitleDeleteUserGitHubPr'
  );
}

const onClickAccordionCopyOption2 = e => {
  const { checked } = e.target;
  e.target.checked = !checked;
  if (checked && state.expandCopyOption1) {
    setStorageParam(
      'expandCopyOption1',
      false,
      '#accordionCopyOption1'
    );
    setTimeout(() => {
      setStorageParam(
        'expandCopyOption2',
        true,
        '#accordionCopyOption2'
      );
    }, 500)
  } else {
    setStorageParam(
      'expandCopyOption2',
      checked,
      '#accordionCopyOption2'
    );
  }
}
const onClickCheckboxUrlShortAmazon = e => {
  const { checked } = e.target;
  setStorageParam(
    'urlShortAmazon',
    checked,
    '#chkUrlShortAmazon'
  );
}
const onClickCheckboxUrlNoEncodeJapanese = e => {
  const { checked } = e.target;
  setStorageParam(
    'urlNoEncodeJapanese',
    checked,
    '#chkUrlNoEncodeJapanese'
  );
}

const onClickCheckboxTitleAfterDelim = e => {
  const { checked } = e.target;
  setStorageParam(
    'titleAfterDelim',
    checked,
    '#chkTitleAfterDelim'
  );
}

const onClickAccordionCopyView = e => {
  const { checked } = e.target;
  setStorageParam(
    'expandCopyView',
    checked,
    '#accordionCopyView'
  );
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#copyView").placeholder =
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

  addEventClick("#accordionCopyView",             onClickAccordionCopyView);

  chrome.storage.local.get(stateKeys, (data) => {
    const dataValues = Object.values(data);
    if (dataValues.every(v => !isUndefined(v))) {
      for (const key of Object.keys(data)) {
        state[key] = data[key];
        document.querySelector(selector[key]).checked = data[key];
      }
    }
  })


});
