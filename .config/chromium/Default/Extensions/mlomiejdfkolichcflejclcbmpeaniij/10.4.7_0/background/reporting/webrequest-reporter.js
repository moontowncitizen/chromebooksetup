import '../../npm/@whotracksme/reporting/reporting/src/patterns.js';
import '../../npm/@whotracksme/reporting/reporting/src/logger.js';
import '../../npm/@whotracksme/reporting/reporting/src/pages.js';
import '../../npm/linkedom/esm/cached.js';
import RequestReporter from '../../npm/@whotracksme/reporting/reporting/src/request-reporter.js';
import WebRequestPipeline from '../../npm/@whotracksme/reporting/reporting/src/webrequest-pipeline/index.js';
import cachedGetBrowserInfo from '../../utils/browser-info.js';
import { observe, isPaused } from '../../store/options.js';
import ExtendedRequest from '../../utils/request.js';
import { updateTabStats } from '../stats.js';
import config from './config.js';
import communication from './communication.js';
import urlReporter from './url-reporter.js';

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


let webRequestReporter = null;

{
  const webRequestPipeline = new WebRequestPipeline();

  // Important to call it in a first tick as it assigns chrome. listeners
  webRequestPipeline.init();

  let options = {};
  observe((value) => {
    options = value;
  });

  webRequestReporter = new RequestReporter(config.request, {
    webRequestPipeline,
    communication,
    countryProvider: urlReporter.countryProvider,
    trustedClock: communication.trustedClock,
    getBrowserInfo: cachedGetBrowserInfo,
    isRequestAllowed: (state) =>
      !options.blockTrackers || isPaused(options, state.tabUrlParts.hostname),
    onTrackerInteraction: (event, state) => {
      if (event === 'observed') {
        return;
      }

      const request = ExtendedRequest.fromRequestDetails({
        url: state.url,
        originUrl: state.tabUrl,
      });
      request.modified = true;

      updateTabStats(state.tabId, [request]);
    },
  });

  chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg.action === 'mousedown') {
      webRequestReporter.recordClick(msg.event, msg.context, msg.href, sender);
    }
  });
}

const webRequestReporter$1 = webRequestReporter;

export { webRequestReporter$1 as default };
