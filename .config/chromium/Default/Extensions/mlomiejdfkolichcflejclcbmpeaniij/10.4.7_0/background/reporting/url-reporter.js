import Reporting from '../../npm/@whotracksme/reporting/reporting/src/reporting.js';
import '../../npm/@whotracksme/reporting/reporting/src/webrequest-pipeline/logger.js';
import '../../npm/@whotracksme/reporting/reporting/src/utils/pacemaker.js';
import '../../npm/@whotracksme/reporting/reporting/src/md5.js';
import '../../npm/@whotracksme/reporting/reporting/src/logger.js';
import '../../npm/@whotracksme/reporting/reporting/src/request/hash.js';
import '../../npm/idb/build/index.js';
import '../../npm/@whotracksme/reporting/reporting/src/webrequest-pipeline/cname-uncloak.js';
import cachedGetBrowserInfo from '../../utils/browser-info.js';
import config from './config.js';
import communication from './communication.js';
import prefixedIndexedDBKeyValueStore from './storage-indexeddb.js';
import StorageLocal from './storage-chrome-local.js';

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


const urlReporter = new Reporting({
  config: config.url,
  storage: new StorageLocal('reporting'),
  connectDatabase: prefixedIndexedDBKeyValueStore('reporting'),
  communication,
  browserInfoProvider: cachedGetBrowserInfo.getRawBrowserInfo,
});

export { urlReporter as default };
