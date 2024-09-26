/*!
 * Copyright (c) 2017-present Ghostery GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
/* eslint-disable prettier/prettier */
const networkFilterCodebook = [
    "/homad-global-configs.schneevonmorgen.com/global_config",
    "/videojs-vast-vpaid@2.0.2/bin/videojs_5.vast.vpaid.min",
    "/etc.clientlibs/logitech-common/clientlibs/onetrust.",
    "/^https?:\\/\\/[-a-z]{8,15}\\.(?:com|net)\\/",
    "/pagead/managed/js/gpt/*/pubads_impl",
    "/pagead/js/adsbygoogle.js",
    "/js/sdkloader/ima3.js",
    "/js/sdkloader/ima3_d",
    "/videojs-contrib-ads",
    "/wp-content/plugins/",
    "/wp-content/uploads/",
    "/wp-content/themes/",
    "/detroitchicago/",
    "/appmeasurement",
    "/413gkwmt/init",
    "/cdn-cgi/trace",
    "/^https?:\\/\\/",
    "[a-zA-Z0-9]{",
    "/^https:\\/\\/",
    "notification",
    "\\/[a-z0-9]{",
    "fingerprint",
    "/ljub4etb/",
    "impression",
    "/plugins/",
    "affiliate",
    "analytics",
    "telemetry",
    "(.+?\\.)?",
    "[0-9a-z]",
    "/assets/",
    "/images/",
    "/pagead/",
    "pageview",
    "template",
    "tracking",
    "/public",
    "300x250",
    "ampaign",
    "collect",
    "consent",
    "content",
    "counter",
    "metrics",
    "privacy",
    "[a-z]{",
    "/embed",
    "728x90",
    "banner",
    "bundle",
    "client",
    "cookie",
    "detect",
    "dn-cgi",
    "google",
    "iframe",
    "module",
    "prebid",
    "script",
    "source",
    "widget",
    ".aspx",
    ".cgi?",
    ".com/",
    ".html",
    "/api/",
    "/beac",
    "/img/",
    "/java",
    "/stat",
    "block",
    "click",
    "count",
    "event",
    "manag",
    "media",
    "pixel",
    "popup",
    "tegra",
    "track",
    "type=",
    "video",
    "visit",
    ".css",
    ".gif",
    ".jpg",
    ".min",
    ".php",
    ".png",
    "/jqu",
    "/js/",
    "/lib",
    "/log",
    "/web",
    "/wp-",
    "468x",
    "data",
    "gdpr",
    "gi-b",
    "http",
    "ight",
    "mail",
    "play",
    "plug",
    "publ",
    "show",
    "stat",
    "uild",
    "view",
    ".js",
    "/ad",
    "=*&",
    "age",
    "com",
    "ext",
    "fig",
    "gpt",
    "id=",
    "jax",
    "key",
    "log",
    "new",
    "sdk",
    "tag",
    "web",
    "ync",
    "*/",
    "*^",
    "/_",
    "/?",
    "/*",
    "/d",
    "/f",
    "/g",
    "/h",
    "/l",
    "/n",
    "/r",
    "/u",
    "/w",
    "^*",
    "00",
    "1/",
    "ac",
    "ad",
    "al",
    "am",
    "an",
    "ap",
    "ar",
    "as",
    "at",
    "bo",
    "ce",
    "ch",
    "co",
    "de",
    "e-",
    "e/",
    "ec",
    "ed",
    "el",
    "em",
    "en",
    "er",
    "es",
    "et",
    "g/",
    "ic",
    "id",
    "im",
    "in",
    "is",
    "it",
    "js",
    "la",
    "le",
    "li",
    "lo",
    "mo",
    "mp",
    "ol",
    "om",
    "on",
    "op",
    "or",
    "ot",
    "re",
    "ro",
    "s_",
    "s-",
    "s?",
    "s/",
    "si",
    "sp",
    "st",
    "t/",
    "ti",
    "tm",
    "tr",
    "ub",
    "un",
    "ur",
    "us",
    "ut",
    "ve",
    "_",
    "-",
    ":",
    "?",
    ".",
    "}",
    "*",
    "/",
    "\\",
    "&",
    "^",
    "=",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z"
];

export { networkFilterCodebook as default };
