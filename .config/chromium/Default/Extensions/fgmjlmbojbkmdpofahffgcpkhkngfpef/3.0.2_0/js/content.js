/**
 *  Communicate that Extension is already installed.
 */
var isInstalledNode = document.createElement('div');
isInstalledNode.id = 'chrome-extension-installed';
document.body.appendChild(isInstalledNode);

/**
 * Add a Generic class on the body.
 */
document.body.classList.add("search_plugin_added");

(function () {
  const u = new URL(document.URL);
  if (u.hostname !== 'add.startpage.com'
      || !u.pathname.endsWith('/success/')) return;

  const store = window.localStorage;
  let fields;
  try {
    fields = JSON.parse(store.getItem('extMeta')) || {};
  } catch(ex) {
    fields = {};
  }
  const data = {
    event: 'spcontentpl',
    campaign: fields.campaign,
    date: fields.date,
    source: fields.source,
    live: true,
  };
  chrome.runtime.sendMessage(data);
  store.setItem('extLoaded', 'true');
})();
