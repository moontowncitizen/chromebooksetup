import { parse } from '../../../../adblocker-extended-selectors/dist/esm/parse.js';
import { classifySelector, SelectorType } from '../../../../adblocker-extended-selectors/dist/esm/extended.js';
import { Domains } from '../engine/domains.js';
import { sizeOfUTF8, sizeOfCosmeticSelector, sizeOfRawCosmetic, sizeOfASCII, EMPTY_UINT32_ARRAY } from '../data-view.js';
import { getHostnameHashesFromLabelsBackward, getEntityHashesFromLabelsBackward } from '../request.js';
import { setBit, fastStartsWithFrom, getBit, hasUnicode, fastHashBetween, tokenize, fastHash, HASH_INTERNAL_MULT, HASH_SEED } from '../utils.js';
import { extractHTMLSelectorFromRule } from '../html-filtering.js';

/*!
 * Copyright (c) 2017-present Ghostery GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const EMPTY_TOKENS = [EMPTY_UINT32_ARRAY];
const DEFAULT_HIDING_STYLE = 'display: none !important;';
const REGEXP_UNICODE_COMMA = new RegExp(/\\u002C/, 'g');
const REGEXP_UNICODE_BACKSLASH = new RegExp(/\\u005C/, 'g');
const REGEXP_ESCAPED_COMMA = new RegExp(/\\,/, 'g');
/**
 * Given a `selector` starting with either '#' or '.' check if what follows is
 * a simple CSS selector: /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/
 */
function isSimpleSelector(selector) {
    for (let i = 1; i < selector.length; i += 1) {
        const code = selector.charCodeAt(i);
        if (!(code === 45 /* '-' */ ||
            code === 95 /* '_' */ ||
            (code >= 48 && code <= 57) /* [0-9] */ ||
            (code >= 65 && code <= 90) /* [A-Z] */ ||
            (code >= 97 && code <= 122)) /* [a-z] */) {
            if (i < selector.length - 1) {
                // Check if what follows is a ' >' or ' ~' or ' +', in which case we
                // also consider it a simple selector and the token this filter can be
                // indexed with is the first selector.
                const nextCode = selector.charCodeAt(i + 1);
                if (code === 91 /* '[' */ ||
                    code === 46 /* '.' */ ||
                    code === 58 /* ':' */ ||
                    (code === 32 /* ' ' */ &&
                        (nextCode === 62 /* '>' */ ||
                            nextCode === 43 /* '+' */ ||
                            nextCode === 126 /* '~' */ ||
                            nextCode === 46 /* '.' */ ||
                            nextCode === 35)) /* '#' */) {
                    return true;
                }
            }
            return false;
        }
    }
    return true;
}
/**
 * Given a `selector` starting with either 'a[' or '[', check if what follows
 * is a simple href attribute selector of the form: 'href^=' or 'href*='.
 */
function isSimpleHrefSelector(selector, start) {
    return (selector.startsWith('href^="', start) ||
        selector.startsWith('href*="', start) ||
        selector.startsWith('href="', start));
}
/**
 * Validate CSS selector. There is a fast path for simple selectors (e.g.: #foo
 * or .bar) which are the most common case. For complex ones, we rely on
 * `Element.matches` (if available).
 */
const isValidCss = (() => {
    const div = typeof document !== 'undefined'
        ? document.createElement('div')
        : {
            matches: () => {
                /* noop */
            },
        };
    const matches = (selector) => div.matches(selector);
    const validSelectorRe = /^[#.]?[\w-.]+$/;
    return function isValidCssImpl(selector) {
        if (validSelectorRe.test(selector)) {
            return true;
        }
        try {
            matches(selector);
        }
        catch (ex) {
            return false;
        }
        return true;
    };
})();
/**
 * Masks used to store options of cosmetic filters in a bitmask.
 */
var COSMETICS_MASK;
(function (COSMETICS_MASK) {
    COSMETICS_MASK[COSMETICS_MASK["unhide"] = 1] = "unhide";
    COSMETICS_MASK[COSMETICS_MASK["scriptInject"] = 2] = "scriptInject";
    COSMETICS_MASK[COSMETICS_MASK["isUnicode"] = 4] = "isUnicode";
    COSMETICS_MASK[COSMETICS_MASK["isClassSelector"] = 8] = "isClassSelector";
    COSMETICS_MASK[COSMETICS_MASK["isIdSelector"] = 16] = "isIdSelector";
    COSMETICS_MASK[COSMETICS_MASK["isHrefSelector"] = 32] = "isHrefSelector";
    COSMETICS_MASK[COSMETICS_MASK["remove"] = 64] = "remove";
    COSMETICS_MASK[COSMETICS_MASK["extended"] = 128] = "extended";
})(COSMETICS_MASK || (COSMETICS_MASK = {}));
function computeFilterId(mask, selector, domains, style) {
    let hash = (HASH_SEED * HASH_INTERNAL_MULT) ^ mask;
    if (selector !== undefined) {
        for (let i = 0; i < selector.length; i += 1) {
            hash = (hash * HASH_INTERNAL_MULT) ^ selector.charCodeAt(i);
        }
    }
    if (domains !== undefined) {
        hash = domains.updateId(hash);
    }
    if (style !== undefined) {
        for (let i = 0; i < style.length; i += 1) {
            hash = (hash * HASH_INTERNAL_MULT) ^ style.charCodeAt(i);
        }
    }
    return hash >>> 0;
}
/***************************************************************************
 *  Cosmetic filters parsing
 * ************************************************************************ */
class CosmeticFilter {
    /**
     * Given a line that we know contains a cosmetic filter, create a CosmeticFiler
     * instance out of it. This function should be *very* efficient, as it will be
     * used to parse tens of thousands of lines.
     */
    static parse(line, debug = false) {
        const rawLine = line;
        // Mask to store attributes. Each flag (unhide, scriptInject, etc.) takes
        // only 1 bit at a specific offset defined in COSMETICS_MASK.
        // cf: COSMETICS_MASK for the offset of each property
        let mask = 0;
        let selector;
        let domains;
        let style;
        const sharpIndex = line.indexOf('#');
        // Start parsing the line
        const afterSharpIndex = sharpIndex + 1;
        let suffixStartIndex = afterSharpIndex + 1;
        // hostname1,hostname2#?#.selector
        // hostname1,hostname2#@#.selector
        //                    ^^ ^
        //                    || |
        //                    || suffixStartIndex
        //                    |afterSharpIndex
        //                    sharpIndex
        // Check if unhide
        if (line.length > afterSharpIndex) {
            if (line[afterSharpIndex] === '@') {
                mask = setBit(mask, COSMETICS_MASK.unhide);
                suffixStartIndex += 1;
            }
            else if (line[afterSharpIndex] === '?') {
                suffixStartIndex += 1;
            }
        }
        if (suffixStartIndex >= line.length) {
            return null;
        }
        // Parse hostnames and entitites as well as their negations.
        //
        // - ~hostname##.selector
        // - hostname##.selector
        // - entity.*##.selector
        // - ~entity.*##.selector
        //
        // Each kind will have its own Uint32Array containing hashes, sorted by
        // number of labels considered. This allows a compact representation of
        // hostnames and fast matching without any string copy.
        if (sharpIndex > 0) {
            domains = Domains.parse(line.slice(0, sharpIndex).split(','), debug);
        }
        if (line.endsWith(':remove()')) {
            // ##selector:remove()
            mask = setBit(mask, COSMETICS_MASK.remove);
            mask = setBit(mask, COSMETICS_MASK.extended);
            line = line.slice(0, -9);
        }
        else if (line.length - suffixStartIndex >= 8 &&
            line.endsWith(')') &&
            line.indexOf(':style(', suffixStartIndex) !== -1) {
            // ##selector:style(...)
            const indexOfStyle = line.indexOf(':style(', suffixStartIndex);
            style = line.slice(indexOfStyle + 7, -1);
            line = line.slice(0, indexOfStyle);
        }
        // Deal with HTML filters
        if (line.charCodeAt(suffixStartIndex) === 94 /* '^' */) {
            if (fastStartsWithFrom(line, 'script:has-text(', suffixStartIndex + 1) === false ||
                line.charCodeAt(line.length - 1) !== 41 /* ')' */) {
                return null;
            }
            // NOTE: currently only ^script:has-text(...) is supported.
            //
            //   ^script:has-text(selector)
            //   ^                         ^
            //   |                         |
            //   |                         |
            //   |                         line.length
            //   |
            //   suffixStartIndex
            //
            selector = line.slice(suffixStartIndex, line.length);
            if (extractHTMLSelectorFromRule(selector) === undefined) {
                return null;
            }
        }
        else if (line.length - suffixStartIndex > 4 &&
            line.charCodeAt(suffixStartIndex) === 43 /* '+' */ &&
            fastStartsWithFrom(line, '+js(', suffixStartIndex)) {
            // Generic scriptlets are invalid, unless they are un-hide
            if ((domains === undefined ||
                (domains.hostnames === undefined && domains.entities === undefined)) &&
                getBit(mask, COSMETICS_MASK.unhide) === false) {
                return null;
            }
            mask = setBit(mask, COSMETICS_MASK.scriptInject);
            selector = line.slice(suffixStartIndex + 4, line.length - 1);
            // An empty scriptlet (i.e. '+js()') can be specified to cancel injections
            // on a specific domain or globally. It does not make sense though to have
            // an empty scriptlet without an exception (i.e. '#@#' is mandatory).
            if (getBit(mask, COSMETICS_MASK.unhide) === false && selector.length === 0) {
                return null;
            }
        }
        else {
            selector = line.slice(suffixStartIndex);
            const selectorType = classifySelector(selector);
            if (selectorType === SelectorType.Extended) {
                mask = setBit(mask, COSMETICS_MASK.extended);
            }
            else if (selectorType === SelectorType.Invalid || !isValidCss(selector)) {
                // console.error('Invalid', line);
                // TODO - maybe perform `isValidCss` from the other module.
                return null;
            }
        }
        // Extended selectors should always be specific to some domain.
        if (domains === undefined && getBit(mask, COSMETICS_MASK.extended) === true) {
            return null;
        }
        if (selector !== undefined) {
            // Check if unicode appears in selector
            if (hasUnicode(selector)) {
                mask = setBit(mask, COSMETICS_MASK.isUnicode);
            }
            // Classify selector
            if (getBit(mask, COSMETICS_MASK.scriptInject) === false &&
                getBit(mask, COSMETICS_MASK.remove) === false &&
                getBit(mask, COSMETICS_MASK.extended) === false &&
                selector.startsWith('^') === false) {
                const c0 = selector.charCodeAt(0);
                const c1 = selector.charCodeAt(1);
                const c2 = selector.charCodeAt(2);
                // Check if we have a specific case of simple selector (id, class or
                // href) These are the most common filters and will benefit greatly from
                // a custom dispatch mechanism.
                if (getBit(mask, COSMETICS_MASK.scriptInject) === false) {
                    if (c0 === 46 /* '.' */ && isSimpleSelector(selector)) {
                        mask = setBit(mask, COSMETICS_MASK.isClassSelector);
                    }
                    else if (c0 === 35 /* '#' */ && isSimpleSelector(selector)) {
                        mask = setBit(mask, COSMETICS_MASK.isIdSelector);
                    }
                    else if (c0 === 97 /* a */ &&
                        c1 === 91 /* '[' */ &&
                        c2 === 104 /* 'h' */ &&
                        isSimpleHrefSelector(selector, 2)) {
                        mask = setBit(mask, COSMETICS_MASK.isHrefSelector);
                    }
                    else if (c0 === 91 /* '[' */ &&
                        c1 === 104 /* 'h' */ &&
                        isSimpleHrefSelector(selector, 1)) {
                        mask = setBit(mask, COSMETICS_MASK.isHrefSelector);
                    }
                }
            }
        }
        return new CosmeticFilter({
            mask,
            rawLine: debug === true ? rawLine : undefined,
            selector,
            style,
            domains,
        });
    }
    /**
     * Deserialize cosmetic filters. The code accessing the buffer should be
     * symetrical to the one in `serializeCosmeticFilter`.
     */
    static deserialize(buffer) {
        const mask = buffer.getUint8();
        const isUnicode = getBit(mask, COSMETICS_MASK.isUnicode);
        const optionalParts = buffer.getUint8();
        const selector = isUnicode ? buffer.getUTF8() : buffer.getCosmeticSelector();
        // The order of these fields should be the same as when we serialize them.
        return new CosmeticFilter({
            // Mandatory fields
            mask,
            selector,
            // Optional fields
            domains: (optionalParts & 1) === 1 ? Domains.deserialize(buffer) : undefined,
            rawLine: (optionalParts & 2) === 2 ? buffer.getRawCosmetic() : undefined,
            style: (optionalParts & 4) === 4 ? buffer.getASCII() : undefined,
        });
    }
    constructor({ mask, selector, domains, rawLine, style, }) {
        this.mask = mask;
        this.selector = selector;
        this.domains = domains;
        this.style = style;
        this.id = undefined;
        this.rawLine = rawLine;
    }
    isCosmeticFilter() {
        return true;
    }
    isNetworkFilter() {
        return false;
    }
    /**
     * The format of a cosmetic filter is:
     *
     * | mask | selector length | selector... | hostnames length | hostnames...
     *   32     16                              16
     *
     * The header (mask) is 32 bits, then we have a total of 32 bits to store the
     * length of `selector` and `hostnames` (16 bits each).
     *
     * Improvements similar to the onces mentioned in `serializeNetworkFilters`
     * could be applied here, to get a more compact representation.
     */
    serialize(buffer) {
        // Mandatory fields
        buffer.pushUint8(this.mask);
        const index = buffer.getPos();
        buffer.pushUint8(0);
        if (this.isUnicode()) {
            buffer.pushUTF8(this.selector);
        }
        else {
            buffer.pushCosmeticSelector(this.selector);
        }
        // This bit-mask indicates which optional parts of the filter were serialized.
        let optionalParts = 0;
        if (this.domains !== undefined) {
            optionalParts |= 1;
            this.domains.serialize(buffer);
        }
        if (this.rawLine !== undefined) {
            optionalParts |= 2;
            buffer.pushRawCosmetic(this.rawLine);
        }
        if (this.style !== undefined) {
            optionalParts |= 4;
            buffer.pushASCII(this.style);
        }
        buffer.setByte(index, optionalParts);
    }
    /**
     * Return an estimation of the size (in bytes) needed to persist this filter
     * in a DataView. This does not need to be 100% accurate but should be an
     * upper-bound. It should also be as fast as possible.
     */
    getSerializedSize(compression) {
        let estimate = 1 + 1; // mask (1 byte) + optional parts (1 byte)
        if (this.isUnicode()) {
            estimate += sizeOfUTF8(this.selector);
        }
        else {
            estimate += sizeOfCosmeticSelector(this.selector, compression);
        }
        if (this.domains !== undefined) {
            estimate += this.domains.getSerializedSize();
        }
        if (this.rawLine !== undefined) {
            estimate += sizeOfRawCosmetic(this.rawLine, compression);
        }
        if (this.style !== undefined) {
            estimate += sizeOfASCII(this.style);
        }
        return estimate;
    }
    /**
     * Create a more human-readable version of this filter. It is mainly used for
     * debugging purpose, as it will expand the values stored in the bit mask.
     */
    toString() {
        if (this.rawLine !== undefined) {
            return this.rawLine;
        }
        let filter = '';
        if (this.domains !== undefined) {
            if (this.domains.parts !== undefined) {
                filter += this.domains.parts;
            }
            else {
                filter += '<hostnames>';
            }
        }
        if (this.isUnhide()) {
            filter += '#@#';
        }
        else {
            filter += '##';
        }
        if (this.isScriptInject()) {
            filter += '+js(';
            filter += this.selector;
            filter += ')';
        }
        else {
            filter += this.selector;
        }
        return filter;
    }
    match(hostname, domain) {
        // Not constraint on hostname, match is true
        if (this.hasHostnameConstraint() === false) {
            return true;
        }
        // No `hostname` available but this filter has some constraints on hostname.
        if (!hostname && this.hasHostnameConstraint()) {
            return false;
        }
        if (this.domains !== undefined) {
            // TODO - this hashing could be re-used between cosmetics by using an
            // abstraction like `Request` (similar to network filters matching).
            // Maybe could we reuse `Request` directly without any change?
            return this.domains.match(hostname.length === 0
                ? EMPTY_UINT32_ARRAY
                : getHostnameHashesFromLabelsBackward(hostname, domain), hostname.length === 0
                ? EMPTY_UINT32_ARRAY
                : getEntityHashesFromLabelsBackward(hostname, domain));
        }
        return true;
    }
    /**
     * Get tokens for this filter. It can be indexed multiple times if multiple
     * hostnames are specified (e.g.: host1,host2##.selector).
     */
    getTokens() {
        const tokens = [];
        // Note, we do not need to use negated domains or entities as tokens here
        // since they will by definition not match on their own, unless accompanied
        // by a domain or entity. Instead, they are handled in
        // `CosmeticFilterBucket.getCosmeticsFilters(...)`.
        if (this.domains !== undefined) {
            const { hostnames, entities } = this.domains;
            if (hostnames !== undefined) {
                for (const hostname of hostnames) {
                    tokens.push(new Uint32Array([hostname]));
                }
            }
            if (entities !== undefined) {
                for (const entity of entities) {
                    tokens.push(new Uint32Array([entity]));
                }
            }
        }
        // Here we only take selector into account if the filter is not unHide.
        if (tokens.length === 0 && this.isUnhide() === false) {
            if (this.isIdSelector() || this.isClassSelector()) {
                // Here we try to identify the end of selector si that we can extract a
                // valid token out of it. In all these examples, 'selector' is our
                // token:
                //
                //   .selector[...]
                //   #selector[...]
                //   #selector ~ foo
                //   .selector:not(...)
                //   .selector.foo
                //
                // We now try to identify the first valid end of selector which will
                // also be the end of our token: space, bracket, colon, dot.
                let endOfSelector = 1;
                const selector = this.selector;
                for (; endOfSelector < selector.length; endOfSelector += 1) {
                    const code = selector.charCodeAt(endOfSelector);
                    if (code === 32 /* ' ' */ ||
                        code === 46 /* '.' */ ||
                        code === 58 /* ':' */ ||
                        code === 91 /* '[' */) {
                        break;
                    }
                }
                const arr = new Uint32Array(1);
                arr[0] = fastHashBetween(selector, 1, endOfSelector);
                tokens.push(arr);
            }
            else if (this.isHrefSelector() === true) {
                const selector = this.getSelector();
                // Locate 'href' in selector
                let hrefIndex = selector.indexOf('href');
                if (hrefIndex === -1) {
                    return EMPTY_TOKENS;
                }
                hrefIndex += 4;
                // Tokenize optimally depending on the kind of selector: 'href=',
                // 'href*=', 'href^='.
                let skipFirstToken = false;
                let skipLastToken = true;
                if (selector.charCodeAt(hrefIndex) === 42 /* '*' */) {
                    // skip: '*'
                    skipFirstToken = true;
                    hrefIndex += 1;
                }
                else if (selector.charCodeAt(hrefIndex) === 94 /* '^' */) {
                    // skip: '^'
                    hrefIndex += 1;
                }
                else {
                    skipLastToken = false;
                }
                hrefIndex += 2; // skip:  '="'
                // Locate end of href
                const hrefEnd = selector.indexOf('"', hrefIndex);
                if (hrefEnd === -1) {
                    // That cannot happen unless the filter is not well-formed. In this
                    // case, we just return no tokens, which will result in this filter
                    // ending up in the "wildcard" bucket of the index.
                    return EMPTY_TOKENS;
                }
                tokens.push(tokenize(this.selector.slice(hrefIndex, hrefEnd), skipFirstToken, skipLastToken));
            }
        }
        if (tokens.length === 0) {
            return EMPTY_TOKENS;
        }
        return tokens;
    }
    parseScript() {
        const selector = this.getSelector();
        if (selector.length === 0) {
            return undefined;
        }
        const parts = [];
        let index = 0;
        let lastComaIndex = -1;
        let inDoubleQuotes = false;
        let inSingleQuotes = false;
        let inRegexp = false;
        let objectNesting = 0;
        let lastCharIsBackslash = false;
        let inArgument = false;
        for (; index < selector.length; index += 1) {
            const char = selector[index];
            if (lastCharIsBackslash === false) {
                if (inDoubleQuotes === true) {
                    if (char === '"') {
                        inDoubleQuotes = false;
                    }
                }
                else if (inSingleQuotes === true) {
                    if (char === "'") {
                        inSingleQuotes = false;
                    }
                }
                else if (objectNesting !== 0) {
                    if (char === '{') {
                        objectNesting += 1;
                    }
                    else if (char === '}') {
                        objectNesting -= 1;
                    }
                    else if (char === '"') {
                        inDoubleQuotes = true;
                    }
                    else if (char === "'") {
                        inSingleQuotes = true;
                    }
                }
                else if (inRegexp === true) {
                    if (char === '/') {
                        inRegexp = false;
                    }
                }
                else {
                    if (inArgument === false) {
                        if (char === ' ') ;
                        else if (char === '"' && selector.indexOf('"', index + 1) > 0) {
                            inDoubleQuotes = true;
                        }
                        else if (char === "'" && selector.indexOf("'", index + 1) > 0) {
                            inSingleQuotes = true;
                        }
                        else if (char === '{' && selector.indexOf('}', index + 1) > 0) {
                            objectNesting += 1;
                        }
                        else if (char === '/' && selector.indexOf('/', index + 1) > 0) {
                            inRegexp = true;
                        }
                        else {
                            inArgument = true;
                        }
                    }
                    if (char === ',') {
                        parts.push(selector.slice(lastComaIndex + 1, index).trim());
                        lastComaIndex = index;
                        inArgument = false;
                    }
                }
            }
            lastCharIsBackslash = char === '\\';
        }
        parts.push(selector.slice(lastComaIndex + 1).trim());
        if (parts.length === 0) {
            return undefined;
        }
        const args = parts
            .slice(1)
            .map((part) => {
            if ((part.startsWith(`'`) && part.endsWith(`'`)) ||
                (part.startsWith(`"`) && part.endsWith(`"`))) {
                return part.substring(1, part.length - 1);
            }
            return part;
        })
            .map((part) => part
            .replace(REGEXP_UNICODE_COMMA, ',')
            .replace(REGEXP_UNICODE_BACKSLASH, '\\')
            .replace(REGEXP_ESCAPED_COMMA, ','));
        return { name: parts[0], args };
    }
    getScript(js) {
        const parsed = this.parseScript();
        if (parsed === undefined) {
            return undefined;
        }
        const { name, args } = parsed;
        let script = js.get(name);
        if (script !== undefined) {
            for (let i = 0; i < args.length; i += 1) {
                // escape some characters so they wont get evaluated with escape characters during script injection
                const arg = args[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                script = script.replace(`{{${i + 1}}}`, arg);
            }
            return script;
        } // TODO - else throw an exception?
        return undefined;
    }
    hasHostnameConstraint() {
        return this.domains !== undefined;
    }
    getId() {
        if (this.id === undefined) {
            this.id = computeFilterId(this.mask, this.selector, this.domains, this.style);
        }
        return this.id;
    }
    hasCustomStyle() {
        return this.style !== undefined;
    }
    getStyle(defaultStyle = DEFAULT_HIDING_STYLE) {
        return this.style || defaultStyle;
    }
    getStyleAttributeHash() {
        return `s${fastHash(this.getStyle())}`;
    }
    getSelector() {
        return this.selector;
    }
    getSelectorAST() {
        return parse(this.getSelector());
    }
    getExtendedSelector() {
        return extractHTMLSelectorFromRule(this.selector);
    }
    isExtended() {
        return getBit(this.mask, COSMETICS_MASK.extended);
    }
    isRemove() {
        return getBit(this.mask, COSMETICS_MASK.remove);
    }
    isUnhide() {
        return getBit(this.mask, COSMETICS_MASK.unhide);
    }
    isScriptInject() {
        return getBit(this.mask, COSMETICS_MASK.scriptInject);
    }
    isCSS() {
        return this.isScriptInject() === false;
    }
    isIdSelector() {
        return getBit(this.mask, COSMETICS_MASK.isIdSelector);
    }
    isClassSelector() {
        return getBit(this.mask, COSMETICS_MASK.isClassSelector);
    }
    isHrefSelector() {
        return getBit(this.mask, COSMETICS_MASK.isHrefSelector);
    }
    isUnicode() {
        return getBit(this.mask, COSMETICS_MASK.isUnicode);
    }
    isHtmlFiltering() {
        return this.getSelector().startsWith('^');
    }
    // A generic hide cosmetic filter is one that:
    //
    // * Do not have a domain specified. "Hide this element on all domains"
    // * Have only domain exceptions specified. "Hide this element on all domains except example.com"
    //
    // For example: ~example.com##.ad  is a generic filter as well!
    isGenericHide() {
        var _a, _b;
        return ((_a = this === null || this === void 0 ? void 0 : this.domains) === null || _a === void 0 ? void 0 : _a.hostnames) === undefined && ((_b = this === null || this === void 0 ? void 0 : this.domains) === null || _b === void 0 ? void 0 : _b.entities) === undefined;
    }
}

export { DEFAULT_HIDING_STYLE, CosmeticFilter as default };
