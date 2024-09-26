import '../../npm/@ghostery/ui/src/modules/panel/index.js';
import { getWTMStats } from '../../utils/wtm-stats.js';
import __vite_glob_0_0 from './components/layout.js';
import define from '../../npm/hybrids/src/define.js';
import mount from '../../npm/hybrids/src/mount.js';
import { html } from '../../npm/hybrids/src/template/index.js';

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


function close() {
  window.parent.postMessage('WTMReportClosePopups', '*');
}

function disable() {
  window.parent.postMessage('WTMReportDisable', '*');
}

const domain = new URLSearchParams(window.location.search).get('domain');

// The page attached in the iframe is a child of the parent window
if (window.parent !== window) {
  const resizeObserver = new ResizeObserver(() => {
    const height = document.body.clientHeight;
    window.parent.postMessage(`WTMReportResize:${height}`, '*');
  });
  resizeObserver.observe(document.body, {
    box: 'border-box',
  });
}

define.from(
  /* #__PURE__ */ Object.assign({"./components/layout.js": __vite_glob_0_0


}),
  {
    root: ['components'],
    prefix: 'gh-trackers-preview',
  },
);

mount(document.body, {
  render: () => html`
    <template layout="block">
      <gh-trackers-preview-layout
        stats="${getWTMStats(domain)}"
        domain="${domain}"
        onclose="${close}"
        ondisable="${disable}"
      ></gh-trackers-preview-layout>
    </template>
  `,
});
