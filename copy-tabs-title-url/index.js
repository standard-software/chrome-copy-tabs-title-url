
let stores = {
  shortAmazonURL: true,
  noEncodeJapaneseURL: true,
  deleteURLParameter: false,
  deleteTitleStartBracket: true,
}



const onClickMenuItem = function(evt) {
  const menuItemId = this.id;
  console.log({menuItemId})
}

const onLoaded = _ => {
  document.querySelectorAll(".copy-tabs-title-url_menu-item").forEach(el => {
    el.addEventListener("click", onClickMenuItem);
  });
}

document.addEventListener("DOMContentLoaded", onLoaded);
