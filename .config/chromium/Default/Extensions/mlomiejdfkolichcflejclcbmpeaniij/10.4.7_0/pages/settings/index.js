import '../../npm/@ghostery/ui/src/modules/panel/index.js';
import Options from '../../store/options.js';
import Settings from './settings.js';
import __vite_glob_0_0 from './components/badge.js';
import __vite_glob_0_1 from './components/button.js';
import __vite_glob_0_2 from './components/card.js';
import __vite_glob_0_3 from './components/checkbox.js';
import __vite_glob_0_4 from './components/custom-filters.js';
import __vite_glob_0_5 from './components/devtools.js';
import __vite_glob_0_6 from './components/dialog.js';
import __vite_glob_0_7 from './components/help-image.js';
import __vite_glob_0_8 from './components/input.js';
import __vite_glob_0_9 from './components/layout.js';
import __vite_glob_0_10 from './components/page-layout.js';
import __vite_glob_0_11 from './components/preview-dialog.js';
import __vite_glob_0_12 from './components/protection-badge.js';
import __vite_glob_0_13 from './components/protection-status.js';
import __vite_glob_0_14 from './components/table.js';
import __vite_glob_0_15 from './components/trackers-list.js';
import __vite_glob_0_16 from './components/wtm-link.js';
import __vite_glob_0_17 from './views/account.js';
import __vite_glob_0_18 from './views/preview.js';
import __vite_glob_0_19 from './views/privacy.js';
import __vite_glob_0_20 from './views/tracker-add-exception.js';
import __vite_glob_0_21 from './views/tracker-details.js';
import __vite_glob_0_22 from './views/trackers.js';
import __vite_glob_0_23 from './views/website-details.js';
import __vite_glob_0_24 from './views/websites-add.js';
import __vite_glob_0_25 from './views/websites.js';
import __vite_glob_0_26 from './views/whotracksme.js';
import store from '../../npm/hybrids/src/store.js';
import define from '../../npm/hybrids/src/define.js';
import mount from '../../npm/hybrids/src/mount.js';

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


// As the user can access settings page from browser native UI
// we must redirect to onboarding if terms are not accepted
store
  .resolve(Options)
  .then(({ terms }) => {
    if (!terms) throw Error('Terms not accepted');

    define.from(
      /* #__PURE__ */ Object.assign({"./components/badge.js": __vite_glob_0_0,"./components/button.js": __vite_glob_0_1,"./components/card.js": __vite_glob_0_2,"./components/checkbox.js": __vite_glob_0_3,"./components/custom-filters.js": __vite_glob_0_4,"./components/devtools.js": __vite_glob_0_5,"./components/dialog.js": __vite_glob_0_6,"./components/help-image.js": __vite_glob_0_7,"./components/input.js": __vite_glob_0_8,"./components/layout.js": __vite_glob_0_9,"./components/page-layout.js": __vite_glob_0_10,"./components/preview-dialog.js": __vite_glob_0_11,"./components/protection-badge.js": __vite_glob_0_12,"./components/protection-status.js": __vite_glob_0_13,"./components/table.js": __vite_glob_0_14,"./components/trackers-list.js": __vite_glob_0_15,"./components/wtm-link.js": __vite_glob_0_16,"./views/account.js": __vite_glob_0_17,"./views/preview.js": __vite_glob_0_18,"./views/privacy.js": __vite_glob_0_19,"./views/tracker-add-exception.js": __vite_glob_0_20,"./views/tracker-details.js": __vite_glob_0_21,"./views/trackers.js": __vite_glob_0_22,"./views/website-details.js": __vite_glob_0_23,"./views/websites-add.js": __vite_glob_0_24,"./views/websites.js": __vite_glob_0_25,"./views/whotracksme.js": __vite_glob_0_26


}),
      {
        root: ['components', 'views'],
        prefix: 'gh-settings',
      },
    );

    mount(document.body, Settings);
  })
  .catch(() => {
    window.location.replace(
      chrome.runtime.getURL('/pages/onboarding/index.html'),
    );
  });
