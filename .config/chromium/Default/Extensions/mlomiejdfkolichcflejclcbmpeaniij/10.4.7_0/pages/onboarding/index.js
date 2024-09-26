import '../../npm/@ghostery/ui/src/modules/onboarding/index.js';
import Options from '../../store/options.js';
import { getBrowserId } from '../../utils/browser-info.js';
import mount from '../../npm/hybrids/src/mount.js';
import { html } from '../../npm/hybrids/src/template/index.js';
import store from '../../npm/hybrids/src/store.js';

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


async function updateOptions(host, event) {
  const success = event.type === 'success';

  await store.set(Options, {
    terms: success,
    onboarding: { done: true },
  });
}

mount(document.body, {
  render: () => html`
    <ui-onboarding
      platform="${getBrowserId()}"
      onsuccess="${updateOptions}"
      onskip="${updateOptions}"
    ></ui-onboarding>
  `,
});

store.resolve(Options).then(({ installDate, onboarding }) => {
  store.set(Options, {
    onboarding: {
      shownAt: Date.now(),
      shown: onboarding.shown + 1,
    },
    installDate,
  });
});
