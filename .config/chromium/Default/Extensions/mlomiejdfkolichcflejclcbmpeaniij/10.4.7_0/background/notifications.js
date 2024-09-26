import { CLOSE_ACTION, OPEN_ACTION, MOUNT_ACTION, UNMOUNT_ACTION } from '../utils/notifications.js';

/**
 * Ghostery Browser Extension
 * https://www.ghostery.com/
 *
 * Copyright 2017-present Ghostery GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0
 */


function openNotification(tabId, id, params) {
  const url = chrome.runtime.getURL(
    `/pages/notifications/${id}.html` +
      (params
        ? `?${Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&')}`
        : ''),
  );

  chrome.tabs.sendMessage(tabId, {
    action: MOUNT_ACTION,
    url,
  });
}

function closeNotification(tabId) {
  chrome.tabs.sendMessage(tabId, {
    action: UNMOUNT_ACTION,
  });
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  const tabId = sender.tab?.id;
  if (!tabId) return;

  switch (msg.action) {
    case OPEN_ACTION: {
      openNotification(tabId, msg.id, msg.params);
      break;
    }
    case CLOSE_ACTION: {
      closeNotification(tabId);
      break;
    }
  }
});

export { closeNotification, openNotification };
