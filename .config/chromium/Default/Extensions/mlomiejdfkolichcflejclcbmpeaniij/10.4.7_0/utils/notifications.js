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

// Actions to be used in the background script
const OPEN_ACTION = 'notifications:open';
const CLOSE_ACTION = 'notifications:close';

// Actions to be used in the content script
const MOUNT_ACTION = 'notifications:mount';
const UNMOUNT_ACTION = 'notifications:unmount';

// Action triggered by the content script
const CLEAR_ACTION = 'notifications:clear';

// Events from the iframe page sent to the content script
const RESIZE_WINDOW_EVENT = 'ghostery:notifications:resize';
const CLOSE_WINDOW_EVENT = 'ghostery:notifications:close';

/*
 * Setup the notification page to send messages to the parent window
 */
function setupNotificationPage(width = 440) {
  const resizeObserver = new ResizeObserver(() => {
    window.parent.postMessage(
      {
        type: RESIZE_WINDOW_EVENT,
        height: document.body.clientHeight,
        width,
      },
      '*',
    );
  });

  resizeObserver.observe(document.body, { box: 'border-box' });
  document.body.style.overflow = 'hidden';

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === CLEAR_ACTION && location.href === msg.url) {
      window.parent.postMessage({ type: CLOSE_WINDOW_EVENT }, '*');
    }
  });

  return (clear = true) => {
    // In some cases await for store.set() is not enough to propagate changes
    // so we need to wait a bit before sending the message
    setTimeout(() => {
      window.parent.postMessage({ type: CLOSE_WINDOW_EVENT, clear }, '*');
    }, 100);
  };
}

export { CLEAR_ACTION, CLOSE_ACTION, CLOSE_WINDOW_EVENT, MOUNT_ACTION, OPEN_ACTION, RESIZE_WINDOW_EVENT, UNMOUNT_ACTION, setupNotificationPage };
