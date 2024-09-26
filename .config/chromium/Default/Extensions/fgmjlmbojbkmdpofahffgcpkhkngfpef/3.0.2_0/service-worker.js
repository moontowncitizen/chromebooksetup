const EXT_LABEL = 'ext-chrome';
const SEGMENT = 'startpage.defaultchx';
const INSTALL_PARAMS = {
  source: 'organic',
  campaign: 'none',
  date: '2000-01-01',
  live: false,
};

// NOTE: load params into global var for use in webrequest listener
chrome.storage.onChanged.addListener((c, n) => {
  let currentParams = {};
  if (n !== 'local') return;
  chrome.storage.local.get(INSTALL_PARAMS, (data) => {
    currentParams = data;
    for (const k of Object.keys(c)) {
      currentParams[k] = c[k].newValue;
    }
    updateRules(currentParams);
    updateUninstallUrl(getLangCode(), currentParams);
  });
});

chrome.runtime.onInstalled.addListener(e => launchSuccess(e.reason));

chrome.action.onClicked.addListener(
  () => chrome.tabs.create({url: 'https://www.startpage.com/'})
);

chrome.runtime.onMessage.addListener(msg => {
  chrome.storage.local.get(INSTALL_PARAMS, (data) => { 
    if (msg.event !== 'spcontentpl' || data.live) return;
    const args = Object.keys(INSTALL_PARAMS).reduce(
      (a, p) => (a[p] = msg[p] || a[p], a),
      Object.assign({}, INSTALL_PARAMS)
    );
    updateRules(args);
    chrome.storage.local.set(args);
  });
});

function updateRules(updateParams) {
  const RULE_1 = {
    id: 1,
    priority: 1,
    condition: {
      urlFilter : "|http*",
      resourceTypes : ["main_frame"]
    },
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        { "header": "Startpage-Extension", "operation": "set", "value": EXT_LABEL },
        { "header": "Startpage-Extension-Version", "operation": "set", "value": chrome.runtime.getManifest().version },
        { "header": "Startpage-Extension-Segment", "operation": "set", "value": SEGMENT },
      ]
    },
  };
  const RULE_2 = {
    id: 2,
    priority: 2,
    condition: {
      urlFilter : "/do/dsearch",
      resourceTypes : ["main_frame"]
    },
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        { "header": "Startpage-Extension", "operation": "set", "value": EXT_LABEL },
        { "header": "Startpage-Extension-Version", "operation": "set", "value": chrome.runtime.getManifest().version },
        { "header": "Startpage-Extension-Segment", "operation": "set", "value": SEGMENT },
        { "header": "Startpage-Extension-Campaign", "operation": "set", "value": updateParams['campaign'] },
        { "header": "Startpage-Extension-Date", "operation": "set", "value": updateParams['date'] },
        { "header": "Startpage-Extension-Source", "operation": "set", "value": updateParams['source'] },
      ]
    },
  };
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_1.id],
    addRules: [RULE_1],
  });
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_2.id],
    addRules: [RULE_2],
  });
}

function launchSuccess(reason) {
  if (reason !== 'install') return;

  chrome.storage.local.get(
    INSTALL_PARAMS,
    data => {
      const lang = getLangCode();
      updateUninstallUrl(lang, data);
      chrome.tabs.create({url: `https://add.startpage.com/${lang}/success/`});
    }
  );
}

function updateUninstallUrl(lang, params) {
  const urlBase = `https://add.startpage.com/${lang}/uninstall/`
  const u = buildUrl(urlBase, params)
  chrome.runtime.setUninstallURL(u);
}

function buildUrl(base, data) {
  const u = new URL(base);
  u.searchParams.set('pl', EXT_LABEL);
  u.searchParams.set('segment', SEGMENT);
  u.searchParams.set('extVersion', chrome.runtime.getManifest().version);
  u.searchParams.set('campaign', data.campaign);
  u.searchParams.set('date', data.date);
  u.searchParams.set('source', data.source);
  return u.toString();
}

// NOTE: localization of urls is only en/de for now
function getLangCode() {
  const lang = chrome.i18n.getUILanguage().split('-')[0];
  return lang === 'de' ? lang : 'en';
}
