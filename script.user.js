// ==UserScript==
// @name         X - Default All + Legacy Media
// @namespace    x-profile-media-control.pub
// @version      3.0.0
// @author       bbb
// @description  Default profile to All, restore legacy mixed Media, add Media/Likes shortcut buttons, SPA navigation
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/bbb-update/x-twitter-view/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/bbb-update/x-twitter-view/main/script.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    // ★ USER SETTINGS ★
    //
    // 以下の値は初回インストール時のデフォルト設定です。
    // 設定ボタンから一度保存すると、保存された設定が優先されます。
    //
    // The values below are the defaults used on first install.
    // Once saved from the Settings button, the saved settings take priority.
    // ============================================================

    // プロフの基本タブを「すべて」に / Set default profile tab to “All”
    const DEFAULT_OPEN_PROFILE_FROM_ALL = 'O';

    // メディアの基本タブを「写真」に / Set default media tab to “Photos”
    const DEFAULT_OPEN_MEDIA_FROM_PHOTO = 'X';

    // 写真・動画の個別ボタンを表示 / Show Photos・Videos buttons
    const DEFAULT_SHOW_MEDIA_BUTTONS = 'O';

    // いいね欄への移動ボタンを表示 / Show Likes navigation button
    const DEFAULT_SHOW_LIKES_BUTTON = 'O';

    // ============================================================

    // 「すべて」で他者宛の返信を隠す / Hide replies to others in “All”
    const DEFAULT_HIDE_OTHER_MENTIONS_IN_ALL = 'O';

    // フォロー中の人宛の返信も隠す / Hide replies to followed users
    const DEFAULT_HIDE_FOLLOWED_MENTIONS_IN_ALL = 'X';

    // 返信を隠したポストに目印 / Mark posts with hidden replies
    const DEFAULT_SHOW_HIDDEN_REPLY_MARKER = 'O';

    // ホームで未フォロー宛の返信を隠す / Hide replies to non-follows in Home
    const DEFAULT_HIDE_UNFOLLOWED_MENTIONS_IN_HOME = 'X';

    // ============================================================

    // ポスト内のメディアをグリッドに / Show post media in a grid
    const DEFAULT_REVERT_MEDIA_CAROUSEL = 'X';

    // リポスト（リツイート）時刻表示 / Show repost (retweet) Timestamp
    const DEFAULT_SHOW_REPOST_TIMESTAMP = 'X';

    // 表示言語 / Language
    const DEFAULT_MEDIA_BUTTON_LANGUAGE = 'J';

    // ============================================================
    // ボタンのポイントカラー / Button accent color
    //
    // 1 = Blue   #1d9bf0
    // 2 = Yellow #ffd400
    // 3 = Pink   #f91880
    // 4 = Purple #7856ff
    // 5 = Orange #ff7a00
    // 6 = Green  #00ba7c
    //
    const DEFAULT_BUTTON_COLOR_THEME = 1;
    //
    // ============================================================


    // ============================================================
    // Base settings
    // ============================================================

    const excludedPaths = new Set([
        'home',
        'explore',
        'notifications',
        'messages',
        'i',
        'search',
        'settings',
        'logout',
        'compose',
        'jobs',
        'communities'
    ]);

    // ============================================================
    // Direct profile entry (new tab / new window)
    // ============================================================

    function redirectDirectProfileEntryToAll() {
        if (
            String(GM_getValue(
                'openProfileFromAll',
                DEFAULT_OPEN_PROFILE_FROM_ALL
            )).toUpperCase() !== 'O'
        ) {
            return false;
        }

        const parts =
            location.pathname
                .split('/')
                .filter(Boolean);

        if (parts.length !== 1) {
            return false;
        }

        const username = parts[0];

        if (
            !/^[A-Za-z0-9_]{1,15}$/.test(username) ||
            excludedPaths.has(username.toLowerCase())
        ) {
            return false;
        }

        location.replace(
            location.origin +
            '/' + username + '/all' +
            location.search +
            location.hash
        );

        return true;
    }

    // ============================================================
    if (redirectDirectProfileEntryToAll()) {
        return;
    }

    function redirectDirectMediaEntryToPhoto() {
        if (!/^\/[^/]+\/media\/?$/.test(location.pathname)) {
            return false;
        }

        const params = new URLSearchParams(location.search);

        if (
            params.has('filter') ||
            String(GM_getValue(
                'openMediaFromPhoto',
                DEFAULT_OPEN_MEDIA_FROM_PHOTO
            )).toUpperCase() !== 'O'
        ) {
            return false;
        }

        params.set('filter', 'photo');
        location.replace(
            location.origin +
            location.pathname +
            '?' + params.toString() +
            location.hash
        );

        return true;
    }

    // ============================================================
    if (redirectDirectMediaEntryToPhoto()) {
        return;
    }

    const accentColors = {
        1: '#1d9bf0',
        2: '#ffd400',
        3: '#f91880',
        4: '#7856ff',
        5: '#ff7a00',
        6: '#00ba7c'
    };

    const pressedBrightness = {
        1: 1.25,
        2: 1.10,
        3: 1.80,
        4: 1.42,
        5: 1.38,
        6: 1.24
    };

    // ============================================================
    // Saved settings
    // ============================================================

    function normalizeOnOff(value, fallback) {
        const normalized = String(value).toUpperCase();

        if (normalized === 'O' || normalized === 'X') {
            return normalized;
        }

        return fallback;
    }

    function normalizeLanguage(value) {
        const normalized =
            String(value).toUpperCase();

        return [
            'J',
            'E',
            'K',
            'SC',
            'TC'
        ].includes(normalized)
            ? normalized
            : 'E';
    }

    function normalizeColorTheme(value) {
        const number = Number(value);

        return number >= 1 && number <= 6
            ? number
            : DEFAULT_BUTTON_COLOR_THEME;
    }

    let userSettings = {
        openProfileFromAll: normalizeOnOff(
            GM_getValue(
                'openProfileFromAll',
                DEFAULT_OPEN_PROFILE_FROM_ALL
            ),
            DEFAULT_OPEN_PROFILE_FROM_ALL
        ),

        openMediaFromPhoto: normalizeOnOff(
            GM_getValue(
                'openMediaFromPhoto',
                DEFAULT_OPEN_MEDIA_FROM_PHOTO
            ),
            DEFAULT_OPEN_MEDIA_FROM_PHOTO
        ),

        hideOtherMentionsInAll: normalizeOnOff(
            GM_getValue(
                'hideOtherMentionsInAll',
                DEFAULT_HIDE_OTHER_MENTIONS_IN_ALL
            ),
            DEFAULT_HIDE_OTHER_MENTIONS_IN_ALL
        ),

        hideFollowedMentionsInAll: normalizeOnOff(
            GM_getValue(
                'hideFollowedMentionsInAll',
                DEFAULT_HIDE_FOLLOWED_MENTIONS_IN_ALL
            ),
            DEFAULT_HIDE_FOLLOWED_MENTIONS_IN_ALL
        ),

        showHiddenReplyMarker: normalizeOnOff(
            GM_getValue(
                'showHiddenReplyMarker',
                DEFAULT_SHOW_HIDDEN_REPLY_MARKER
            ),
            DEFAULT_SHOW_HIDDEN_REPLY_MARKER
        ),

        hideUnfollowedMentionsInHome: normalizeOnOff(
            GM_getValue(
                'hideUnfollowedMentionsInHome',
                DEFAULT_HIDE_UNFOLLOWED_MENTIONS_IN_HOME
            ),
            DEFAULT_HIDE_UNFOLLOWED_MENTIONS_IN_HOME
        ),

        showMediaButtons: normalizeOnOff(
            GM_getValue(
                'showMediaButtons',
                DEFAULT_SHOW_MEDIA_BUTTONS
            ),
            DEFAULT_SHOW_MEDIA_BUTTONS
        ),

        showLikesButton: normalizeOnOff(
            GM_getValue(
                'showLikesButton',
                DEFAULT_SHOW_LIKES_BUTTON
            ),
            DEFAULT_SHOW_LIKES_BUTTON
        ),

        language: normalizeLanguage(
            GM_getValue(
                'buttonLanguage',
                DEFAULT_MEDIA_BUTTON_LANGUAGE
            )
        ),

        colorTheme: normalizeColorTheme(
            GM_getValue(
                'buttonColorTheme',
                DEFAULT_BUTTON_COLOR_THEME
            )
        ),

        showRepostTimestamp: normalizeOnOff(
            GM_getValue(
                'showRepostTimestamp',
                DEFAULT_SHOW_REPOST_TIMESTAMP
            ),
            DEFAULT_SHOW_REPOST_TIMESTAMP
        ),

        revertMediaCarousel: normalizeOnOff(
            GM_getValue(
                'revertMediaCarousel',
                DEFAULT_REVERT_MEDIA_CAROUSEL
            ),
            DEFAULT_REVERT_MEDIA_CAROUSEL
        )
    };

    function isEnabled(value) {
        return String(value).toUpperCase() === 'O';
    }

    function getAccentColor() {
        return (
            accentColors[userSettings.colorTheme] ||
            accentColors[1]
        );
    }

    function getPressedBrightness() {
        return (
            pressedBrightness[userSettings.colorTheme] ||
            1.25
        );
    }

    function saveUserSettings(nextSettings) {
        userSettings = {
            openProfileFromAll: normalizeOnOff(
                nextSettings.openProfileFromAll,
                DEFAULT_OPEN_PROFILE_FROM_ALL
            ),

            openMediaFromPhoto: normalizeOnOff(
                nextSettings.openMediaFromPhoto,
                DEFAULT_OPEN_MEDIA_FROM_PHOTO
            ),

            hideOtherMentionsInAll: normalizeOnOff(
                nextSettings.hideOtherMentionsInAll,
                DEFAULT_HIDE_OTHER_MENTIONS_IN_ALL
            ),

            hideFollowedMentionsInAll: normalizeOnOff(
                nextSettings.hideFollowedMentionsInAll,
                DEFAULT_HIDE_FOLLOWED_MENTIONS_IN_ALL
            ),

            showHiddenReplyMarker: normalizeOnOff(
                nextSettings.showHiddenReplyMarker,
                DEFAULT_SHOW_HIDDEN_REPLY_MARKER
            ),

            hideUnfollowedMentionsInHome: normalizeOnOff(
                nextSettings.hideUnfollowedMentionsInHome,
                DEFAULT_HIDE_UNFOLLOWED_MENTIONS_IN_HOME
            ),

            showMediaButtons: normalizeOnOff(
                nextSettings.showMediaButtons,
                DEFAULT_SHOW_MEDIA_BUTTONS
            ),

            showLikesButton: normalizeOnOff(
                nextSettings.showLikesButton,
                DEFAULT_SHOW_LIKES_BUTTON
            ),

            language: normalizeLanguage(
                nextSettings.language
            ),

            colorTheme: normalizeColorTheme(
                nextSettings.colorTheme
            ),
            showRepostTimestamp: normalizeOnOff(
                nextSettings.showRepostTimestamp,
                DEFAULT_SHOW_REPOST_TIMESTAMP
            ),
            revertMediaCarousel: normalizeOnOff(
                nextSettings.revertMediaCarousel,
                DEFAULT_REVERT_MEDIA_CAROUSEL
            )
        };

        GM_setValue(
            'openProfileFromAll',
            userSettings.openProfileFromAll
        );

        GM_setValue(
            'openMediaFromPhoto',
            userSettings.openMediaFromPhoto
        );

        GM_setValue(
            'hideOtherMentionsInAll',
            userSettings.hideOtherMentionsInAll
        );

        GM_setValue(
            'hideFollowedMentionsInAll',
            userSettings.hideFollowedMentionsInAll
        );

        GM_setValue(
            'showHiddenReplyMarker',
            userSettings.showHiddenReplyMarker
        );

        GM_setValue(
            'hideUnfollowedMentionsInHome',
            userSettings.hideUnfollowedMentionsInHome
        );

        GM_setValue(
            'showMediaButtons',
            userSettings.showMediaButtons
        );

        GM_setValue(
            'showLikesButton',
            userSettings.showLikesButton
        );

        GM_setValue(
            'buttonLanguage',
            userSettings.language
        );

        GM_setValue(
            'buttonColorTheme',
            userSettings.colorTheme
        );

        GM_setValue(
            'showRepostTimestamp',
            userSettings.showRepostTimestamp
        );

        GM_setValue(
            'revertMediaCarousel',
            userSettings.revertMediaCarousel
        );
    }

    let History_push = null;
    let History_replace = null;
    let shortcutUsername = null;
    let lastLightTheme = null;
    let featureSwitchWrapperInstalled =
        false;

    let featureSwitchRefreshScheduled =
        false;

    // ============================================================
    // Find top-level X React props
    // ============================================================

    function getTopLevelProps() {
        const root =
            document.querySelector('#react-root');

        if (!root || !root.firstElementChild) {
            return null;
        }

        const element =
            root.firstElementChild;

        let reactPropsKey = null;

        for (const key of Object.keys(element)) {
            if (key.indexOf('__reactProps') === 0) {
                reactPropsKey = key;
                break;
            }
        }

        if (!reactPropsKey) {
            return null;
        }

        try {
            return (
                element[reactPropsKey]
                    .children
                    .props
                    .children
                    .props
            ) || null;

        } catch (e) {
            return null;
        }
    }

    // ============================================================
    // history.push
    // ============================================================

    function tryFindHistory() {
        if (History_push) {
            return true;
        }

        const props = getTopLevelProps();

        if (
            !props ||
            !props.history ||
            typeof props.history.push !== 'function'
        ) {
            return false;
        }

        History_push = props.history.push;

        History_replace =
            typeof props.history.replace ===
                'function'
                ? props.history.replace
                : null;

        return true;
    }

    // ============================================================
    // SPA navigation
    // ============================================================

    function navigate(pathname, search = '') {
        if (History_push) {
            const query = {};

            if (search) {
                const params =
                    new URLSearchParams(
                        search.replace(/^\?/, '')
                    );

                for (const [key, value] of params) {
                    query[key] = value;
                }
            }

            try {
                History_push({
                    pathname,
                    hash: '',
                    query,
                    search
                });

                return;

            } catch (e) {
                // Fall back to location.href on failure
            }
        }

        location.href = pathname + search;
    }

    function refreshCurrentRoute() {
        tryPatchFeatureSwitch();

        const mediaItems =
            document.querySelectorAll(
                'main [data-testid="tweetPhoto"]'
            );

        for (const mediaItem of mediaItems) {
            const rect =
                mediaItem.getBoundingClientRect();

            if (
                rect.bottom <= 0 ||
                rect.top >= window.innerHeight ||
                rect.right <= 0 ||
                rect.left >= window.innerWidth
            ) {
                continue;
            }

            focusMediaComponent(mediaItem);
        }

        pulseVisibleMediaArticles(
            mediaItems,
            isEnabled(
                userSettings.revertMediaCarousel
            )
        );

        return mediaItems.length > 0;
    }

    function pulseVisibleMediaArticles(
        mediaItems,
        switchingToGrid
    ) {
        const visibilityTargets =
            new Set();

        for (const mediaItem of mediaItems) {
            const article =
                mediaItem.closest('article');

            if (!article) {
                continue;
            }

            const isCarousel =
                Boolean(
                    mediaItem.closest(
                        '[data-testid="ScrollSnap-SwipeableList"], [data-testid="ScrollSnap-List"]'
                    )
                );

            const isMultiImageGrid =
                !isCarousel &&
                article.querySelectorAll(
                    '[data-testid="tweetPhoto"]'
                ).length > 1;

            if (
                switchingToGrid
                    ? !isCarousel
                    : !isMultiImageGrid
            ) {
                continue;
            }

            const rect =
                mediaItem.getBoundingClientRect();

            if (
                rect.bottom <= 0 ||
                rect.top >= window.innerHeight ||
                rect.right <= 0 ||
                rect.left >= window.innerWidth
            ) {
                continue;
            }

            const visibilityTarget =
                article.closest(
                    '[data-testid="cellInnerDiv"]'
                ) || article;

            visibilityTargets.add(
                visibilityTarget
            );
        }

        for (
            const visibilityTarget of
            visibilityTargets
        ) {
            const previous = {
                transform:
                    visibilityTarget
                        .style.transform,
                visibility:
                    visibilityTarget
                        .style.visibility,
                pointerEvents:
                    visibilityTarget
                        .style.pointerEvents,
                transition:
                    visibilityTarget
                        .style.transition
            };

            visibilityTarget.style.transition =
                'none';

            visibilityTarget.style.pointerEvents =
                'none';

            visibilityTarget.style.visibility =
                'hidden';

            visibilityTarget.style.transform =
                'translate3d(0, calc(100vh + 2000px), 0)';

            visibilityTarget
                .getBoundingClientRect();

            function restoreArticle() {
                if (restored) {
                    return;
                }

                restored = true;

                clearTimeout(safetyTimer);

                tryPatchFeatureSwitch();

                visibilityTarget.style.transform =
                    previous.transform;

                visibilityTarget.style.visibility =
                    previous.visibility;

                visibilityTarget.style.pointerEvents =
                    previous.pointerEvents;

                visibilityTarget.style.transition =
                    previous.transition;
            }

            let restored = false;

            let safetyTimer = null;

            safetyTimer = setTimeout(
                restoreArticle,
                40
            );

            requestAnimationFrame(
                function () {
                    requestAnimationFrame(
                        restoreArticle
                    );
                }
            );
        }
    }

    function focusMediaComponent(mediaItem) {
        if (!mediaItem) {
            return;
        }

        const mediaLink =
            mediaItem.closest('a[href]');

        if (!mediaLink) {
            return;
        }

        try {
            mediaLink.focus({
                preventScroll: true
            });
        } catch (e) {
            mediaLink.focus();
        }
    }

    document.addEventListener(
        'pointerover',
        function (event) {
            if (
                !isEnabled(
                    userSettings.revertMediaCarousel
                )
            ) {
                return;
            }

            const mediaItem =
                event.target.closest &&
                event.target.closest(
                    '[data-testid="tweetPhoto"]'
                );

            if (
                !mediaItem ||
                !mediaItem.closest(
                    '[data-testid="ScrollSnap-SwipeableList"], [data-testid="ScrollSnap-List"]'
                )
            ) {
                return;
            }

            focusMediaComponent(mediaItem);
        },
        true
    );

    // ============================================================
    // Detect profile pages
    // ============================================================

    function getProfileUsername() {
        const parts =
            location.pathname
                .split('/')
                .filter(Boolean);

        if (parts.length === 0) {
            return null;
        }

        const username = parts[0];

        if (
            excludedPaths.has(
                username.toLowerCase()
            )
        ) {
            return null;
        }

        if (parts.length === 1) {
            return username;
        }

        const profileTabs = new Set([
            'all',
            'reposts',
            'media',
            'with_replies',
            'highlights',
            'likes'
        ]);

        if (
            profileTabs.has(
                parts[1].toLowerCase()
            )
        ) {
            return username;
        }

        return null;
    }

    function getUsernameFromUserCell(userCell) {
        const avatar =
            userCell.querySelector(
                '[data-testid^="UserAvatar-Container-"]'
            );

        if (avatar) {
            const testId =
                avatar.getAttribute('data-testid') || '';

            const username =
                testId.replace(
                    'UserAvatar-Container-',
                    ''
                );

            if (/^[A-Za-z0-9_]{1,15}$/.test(username)) {
                return username;
            }
        }

        for (
            const element of
            userCell.querySelectorAll('span')
        ) {
            const text =
                element.textContent.trim();

            const match =
                text.match(
                    /^@([A-Za-z0-9_]{1,15})$/
                );

            if (match) {
                return match[1];
            }
        }

        return null;
    }

    // ============================================================
    // Detect plain /media pages
    // ============================================================

    function isPlainMediaPage() {
        if (
            !/^\/[^/]+\/media\/?$/.test(
                location.pathname
            )
        ) {
            return false;
        }

        const params =
            new URLSearchParams(
                location.search
            );

        return !params.has('filter');
    }

    // ============================================================
    // Legacy Media feature flag
    // ============================================================

    function tryPatchFeatureSwitch() {
        const props = getTopLevelProps();

        if (
            !props ||
            !props.contextProviderProps ||
            !props.contextProviderProps.featureSwitches
        ) {
            return false;
        }

        const featureSwitches =
            props.contextProviderProps.featureSwitches;

        const currentIsTrue =
            featureSwitches.isTrue;

        if (
            typeof currentIsTrue !== 'function'
        ) {
            return false;
        }

        if (
            currentIsTrue
                .__xProfileMediaControlWrapper ===
                    true
        ) {
            featureSwitchWrapperInstalled =
                true;

            return true;
        }

        const wrapperWasReplaced =
            featureSwitchWrapperInstalled;

        const wrappedIsTrue =
            function (flag) {
                if (
                    isEnabled(
                        userSettings
                            .revertMediaCarousel
                    ) &&
                    flag ===
                        'rweb_media_carousel_enabled'
                ) {
                    return false;
                }

                if (
                    flag ===
                        'responsive_web_profile_redesign_enabled' &&
                    isPlainMediaPage()
                ) {
                    return false;
                }

                return currentIsTrue.call(
                    this,
                    flag
                );
            };

        Object.defineProperty(
            wrappedIsTrue,
            '__xProfileMediaControlWrapper',
            {
                value: true
            }
        );

        featureSwitches.isTrue =
            wrappedIsTrue;

        featureSwitchWrapperInstalled =
            true;

        if (
            wrapperWasReplaced &&
            !featureSwitchRefreshScheduled
        ) {
            featureSwitchRefreshScheduled =
                true;

            setTimeout(
                function () {
                    featureSwitchRefreshScheduled =
                        false;

                    tryPatchFeatureSwitch();
                    refreshCurrentRoute();
                },
                0
            );
        }

        return (
            featureSwitches.isTrue ===
                wrappedIsTrue
        );
    }

    const initTimer =
        setInterval(
            function () {
                tryPatchFeatureSwitch();

                const historyReady =
                    tryFindHistory();

                if (historyReady) {
                    clearInterval(initTimer);
                }
            },
            200
        );

    // ============================================================
    // Media tab
    // ============================================================

    function findMediaTab() {
        const links =
            document.querySelectorAll(
                'a[href]'
            );

        for (const link of links) {
            const href =
                link.getAttribute('href');

            if (!href) {
                continue;
            }

            let url;

            try {
                url =
                    new URL(
                        href,
                        location.origin
                    );

            } catch (e) {
                continue;
            }

            if (
                !/^\/[^/]+\/media\/?$/.test(
                    url.pathname
                )
            ) {
                continue;
            }

            const rect =
                link.getBoundingClientRect();

            if (
                rect.width > 40 &&
                rect.height > 20
            ) {
                return link;
            }
        }

        return null;
    }

    // ============================================================
    // Profile UI reference
    // ============================================================

    function getProfileUiContext() {
        const mediaTab =
            findMediaTab();

        if (!mediaTab) {
            return null;
        }

        const tabList =
            mediaTab.closest(
                '[role="tablist"]'
            );

        if (
            !tabList ||
            !tabList.parentElement
        ) {
            return null;
        }

        let host =
            tabList.parentElement;

        let candidate = host;

        for (
            let i = 0;
            i < 4 &&
            candidate &&
            candidate !== document.body;
            i++
        ) {
            const rect =
                candidate.getBoundingClientRect();

            if (
                rect.width > 500 &&
                rect.height > 80
            ) {
                host = candidate;
            }

            candidate =
                candidate.parentElement;
        }

        return {
            mediaTab,
            tabList,
            host
        };
    }

    // ============================================================
    // Light / Dark theme
    // ============================================================

    function isLightTheme() {
        const color =
            getComputedStyle(
                document.body
            ).backgroundColor;

        const match =
            color.match(
                /rgba?\((\d+),\s*(\d+),\s*(\d+)/
            );

        if (!match) {
            return false;
        }

        const r = Number(match[1]);
        const g = Number(match[2]);
        const b = Number(match[3]);

        const brightness =
            (
                r * 299 +
                g * 587 +
                b * 114
            ) / 1000;

        return brightness > 160;
    }

    function getBaseThemeColors() {
        const light = isLightTheme();

        return {
            background: light
                ? '#ffffff'
                : '#0e1217',

            border: light
                ? '#dde5e9'
                : '#3f474e',

            text: light
                ? '#0f1419'
                : '#e7e9ea'
        };
    }

    function getAccentTextColor() {
        return isLightTheme()
            ? '#0f1419'
            : '#e7e9ea';
    }

    // ============================================================
    // Button styles
    // ============================================================

    function refreshButtonStyle(button) {
        const base =
            getBaseThemeColors();

        const hovered =
            button.dataset.hovered === 'true';

        const pressed =
            button.dataset.pressed === 'true';

        if (hovered || pressed) {
            button.style.background =
                getAccentColor();

            button.style.borderColor =
                getAccentColor();

            button.style.color =
                getAccentTextColor();

        } else {
            button.style.background =
                base.background;

            button.style.borderColor =
                base.border;

            button.style.color =
                base.text;
        }

        button.style.filter =
            pressed
                ? `brightness(${getPressedBrightness()})`
                : 'none';
    }

    function addButtonEffects(button) {
        button.dataset.hovered = 'false';
        button.dataset.pressed = 'false';

        button.addEventListener(
            'mouseenter',
            function () {
                button.dataset.hovered = 'true';
                refreshButtonStyle(button);
            }
        );

        button.addEventListener(
            'mouseleave',
            function () {
                button.dataset.hovered = 'false';
                button.dataset.pressed = 'false';

                refreshButtonStyle(button);
            }
        );

        button.addEventListener(
            'mousedown',
            function () {
                button.dataset.pressed = 'true';
                refreshButtonStyle(button);
            }
        );

        button.addEventListener(
            'mouseup',
            function () {
                button.dataset.pressed = 'false';
                refreshButtonStyle(button);
            }
        );

        refreshButtonStyle(button);
    }

    function refreshAllShortcutButtons() {
        const wrapper =
            document.querySelector(
                '.x-profile-shortcut-wrapper'
            );

        if (!wrapper) {
            return;
        }

        for (
            const button of
            wrapper.querySelectorAll('button')
        ) {
            refreshButtonStyle(button);
        }
    }

    // ============================================================
    // Shortcut buttons
    // ============================================================

    function createShortcutButton(
        text,
        width,
        onClick
    ) {
        const button =
            document.createElement('button');

        button.textContent = text;

        button.style.cssText = `
            width: ${width}px;
            height: 22px;

            padding: 0 8px;

            border-style: solid;
            border-width: 1px;
            border-radius: 5px;

            font-size: 11px;
            font-weight: 600;
            line-height: 20px;
            text-align: center;
            white-space: nowrap;

            cursor: pointer;
            box-sizing: border-box;

            transition:
                background-color 0.10s ease,
                border-color 0.10s ease,
                color 0.10s ease,
                filter 0.06s ease;
        `;

        addButtonEffects(button);

        button.addEventListener(
            'click',
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                onClick();
            }
        );

        return button;
    }

    function rebuildShortcutButtons() {
        const old =
            document.querySelector(
                '.x-profile-shortcut-wrapper'
            );

        if (old) {
            old.remove();
        }

        shortcutUsername = null;

        ensureShortcutButtons();
    }

    function ensureShortcutButtons() {
        const old =
            document.querySelector(
                '.x-profile-shortcut-wrapper'
            );

        const currentUsername =
            getProfileUsername();

        if (
            (
                !isEnabled(
                    userSettings.showMediaButtons
                ) &&
                !isEnabled(
                    userSettings.showLikesButton
                )
            ) ||
            !currentUsername
        ) {
            if (old) {
                old.remove();
            }

            shortcutUsername = null;

            return;
        }

        if (
            old &&
            shortcutUsername !== currentUsername
        ) {
            old.remove();
            shortcutUsername = null;
        }

        const existing =
            document.querySelector(
                '.x-profile-shortcut-wrapper'
            );

        if (existing) {
            refreshAllShortcutButtons();
            return;
        }

        const context =
            getProfileUiContext();

        if (!context) {
            return;
        }

        const { host } = context;

        const hostStyle =
            getComputedStyle(host);

        if (
            hostStyle.position === 'static'
        ) {
            host.style.position = 'relative';
        }

        if (
            hostStyle.overflow === 'hidden'
        ) {
            host.style.overflow = 'visible';
        }

        const wrapper =
            document.createElement('div');

        wrapper.className =
            'x-profile-shortcut-wrapper';

        wrapper.style.cssText = `
            position: absolute;

            right: 8px;
            bottom: 55px;

            z-index: 20;

            height: 22px;

            display: flex;
            justify-content: flex-end;
            align-items: center;

            gap: 4px;

            pointer-events: auto;
            box-sizing: border-box;
        `;

        // --------------------------------------------------------
        // Likes
        // --------------------------------------------------------

        if (
            isEnabled(
                userSettings.showLikesButton
            )
        ) {
            const likesButton =
                createShortcutButton(
                    '',
                    34,
                    function () {
                        navigate(
                            '/i/history/likes'
                        );
                    }
                );

            likesButton.setAttribute(
                'aria-label',
                userSettings.language === 'J'
                    ? 'いいね'
                    : 'Likes'
            );

            likesButton.innerHTML =
                '<svg viewBox="0 -960 960 960" aria-hidden="true" ' +
                'style="width:14px;height:14px;display:block;fill:currentColor;pointer-events:none">' +
                '<path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 50-81t14-70.5q0-60-40-100t-100-40q-47 0-87 26.5T518-680h-76q-15-41-55-67.5T300-774q-60 0-100 40t-40 100q0 35 14 70.5t50 81q36 45.5 98 107T480-228Zm0-273Z"/>' +
                '</svg>';

            likesButton.style.display =
                'inline-flex';

            likesButton.style.alignItems =
                'center';

            likesButton.style.justifyContent =
                'center';

            likesButton.title =
                userSettings.language === 'J'
                    ? 'いいね'
                    : 'Likes';

            likesButton.style.marginRight =
                '10px';

            wrapper.appendChild(
                likesButton
            );
        }

        // --------------------------------------------------------
        // Photos / Videos
        // --------------------------------------------------------

        if (
            isEnabled(
                userSettings.showMediaButtons
            )
        ) {
            const isJapanese =
                userSettings.language === 'J';

            const photoText =
                isJapanese
                    ? '画像'
                    : 'Photos';

            const videoText =
                isJapanese
                    ? '動画'
                    : 'Videos';

            const photoButton =
                createShortcutButton(
                    photoText,
                    64,
                    function () {
                        navigate(
                            '/' +
                            currentUsername +
                            '/media',
                            '?filter=photo'
                        );
                    }
                );

            const videoButton =
                createShortcutButton(
                    videoText,
                    64,
                    function () {
                        navigate(
                            '/' +
                            currentUsername +
                            '/media',
                            '?filter=video'
                        );
                    }
                );

            wrapper.appendChild(
                photoButton
            );

            wrapper.appendChild(
                videoButton
            );
        }

        host.appendChild(wrapper);

        shortcutUsername =
            currentUsername;

        refreshAllShortcutButtons();
    }

    // ============================================================
    // Find Edit Profile / Follow / Following button
    // ============================================================

       function findProfileActionButton(
        context
    ) {

        const {
            tabList
        } = context;

        const tabRect =
            tabList.getBoundingClientRect();

        const candidates =
            Array.from(
                document.querySelectorAll(
                    [
                        '[data-testid="editProfileButton"]',
                        '[data-testid$="-follow"]',
                        '[data-testid$="-unfollow"]'
                    ].join(',')
                )
            ).filter(
                candidate => {

                    const rect =
                        candidate
                            .getBoundingClientRect();

                    //
                    if (
                        rect.width < 40 ||
                        rect.height < 28
                    ) {
                        return false;
                    }

                    //
                    if (
                        rect.bottom <= 0
                    ) {
                        return false;
                    }

                    //
                    if (
                        rect.left <
                            tabRect.left - 2 ||
                        rect.right >
                            tabRect.right + 2
                    ) {
                        return false;
                    }

                    //
                    if (
                        rect.bottom >=
                            tabRect.top
                    ) {
                        return false;
                    }

                    //
                    const centerX =
                        rect.left +
                        rect.width / 2;

                    if (
                        centerX <
                            tabRect.left +
                            tabRect.width * 0.45
                    ) {
                        return false;
                    }

                    return true;
                }
            );

        if (
            candidates.length === 0
        ) {
            return null;
        }

        candidates.sort(
            (a, b) => {

                const aRect =
                    a.getBoundingClientRect();

                const bRect =
                    b.getBoundingClientRect();

                const aDistance =
                    tabRect.top -
                    aRect.bottom;

                const bDistance =
                    tabRect.top -
                    bRect.bottom;

                return (
                    aDistance -
                    bDistance
                );
            }
        );

        return candidates[0];
    }
    // ============================================================
    // Settings menu text
    // ============================================================

        function getSettingsText() {
        if (userSettings.language === 'J') {
            return {
                title: '✦ スクリプト設定',
                openProfileFromAll:
                    'プロフの基本タブを「すべて」に',
                openMediaFromPhoto:
                    'メディアの基本タブを「写真」に',
                hideOtherMentionsInAll:
                    '「すべて」で他者宛の返信を隠す',
                hideFollowedMentionsInAll:
                    '└ フォロー中の人宛の返信も隠す',
                showHiddenReplyMarker:
                    '└ 返信を隠したポストに目印',
                hideUnfollowedMentionsInHome:
                    'ホームで未フォロー宛の返信を隠す',
                openMediaFromPhotoNote:
                    ' オフ時は、デフォルト設定の\n' +
                    '【写真・動画の混合グリッド】で表示されます',
                media: '写真・動画の個別ボタンを表示',
                mediaNote:
                    '【Ctrl+Shift+メディア】でも切り替えられます',
                likes: 'いいね欄への移動ボタンを表示',
                language: '表示言語',
                color: 'カラー',
		revertMediaCarousel:
                    'ポスト内のメディアをグリッドに',
                repostTimestamp:
                    'リポスト(RT) 時刻表示',
                cancel: 'キャンセル',
                save: '保存',
                settings: '設定'
            };
        }

        if (userSettings.language === 'K') {
            return {
                title: '✦ 스크립트 설정',
                openProfileFromAll:
                    '프로필 화면을 "전체" 탭부터 표시',
                openMediaFromPhoto:
                    '미디어를 "사진" 탭부터 표시',
                hideOtherMentionsInAll:
                    '"전체"에서 타인에게 보낸 답글 숨기기',
                hideFollowedMentionsInAll:
                    '└ 팔로우한 사람에게 보낸 답글도 숨김',
                showHiddenReplyMarker:
                    '└ 답글이 숨겨진 글에 표식 남기기',
                hideUnfollowedMentionsInHome:
                    '홈에서 미팔로우 대상 답글 숨기기',
                openMediaFromPhotoNote:
                    ' OFF 상태일 때는, 기본 설정인\n' +
                    '【사진・동영상 혼합 그리드】로 표시됩니다',
                media: '사진・동영상 개별 버튼을 표시',
                mediaNote:
                    '【Ctrl+Shift+미디어 클릭】으로도 전환할 수 있습니다',
                likes: '좋아요 목록 이동 버튼을 표시',
                language: '표시 언어',
                color: '컬러',
                revertMediaCarousel:
                    '글에 첨부된 미디어를 그리드로 표시',
                repostTimestamp:
                    '리포스트(RT) 시간 표시',
                cancel: '취소',
                save: '저장',
                settings: '설정'
            };
        }

        if (userSettings.language === 'SC') {
            return {
                title: '✦ 脚本设置',
                openProfileFromAll:
                    '个人资料从“全部”标签页开始显示',
                openMediaFromPhoto:
                    '媒体标签页从“照片”开始显示',
                hideOtherMentionsInAll:
                    '在“全部”中隐藏对他人的回复',
                hideFollowedMentionsInAll:
                    '└ 同时隐藏对已关注用户的回复',
                showHiddenReplyMarker:
                    '└ 为隐藏回复的帖子添加标记',
                hideUnfollowedMentionsInHome:
                    '在主页隐藏对未关注用户的回复',
                openMediaFromPhotoNote:
                    ' 关闭时，将恢复为默认的\n' +
                    '【照片・视频混合网格】显示模式',
                media: '显示照片・视频按钮',
                mediaNote:
                    '也可通过【Ctrl+Shift+点击媒体】切换',
                likes: '显示点赞列表跳转按钮',
                language: '显示语言',
                color: '颜色',
                revertMediaCarousel:
                    '将帖子内媒体显示为网格',
                repostTimestamp:
                    '转发(RT)时间显示',
                cancel: '取消',
                save: '保存',
                settings: '设置'
            };
        }

        if (userSettings.language === 'TC') {
            return {
                title: '✦ 指令碼設定',
                openProfileFromAll:
                    '個人資料從「全部」標籤頁開始顯示',
                openMediaFromPhoto:
                    '媒體標籤頁從「照片」開始顯示',
                hideOtherMentionsInAll:
                    '在「全部」中隱藏對他人的回覆',
                hideFollowedMentionsInAll:
                    '└ 同時隱藏對已關注用戶的回覆',
                showHiddenReplyMarker:
                    '└ 為已隱藏回覆的貼文添加標記',
                hideUnfollowedMentionsInHome:
                    '在首頁隱藏對未關注用戶的回覆',
                openMediaFromPhotoNote:
                    ' 關閉時，將恢復為預設的\n' +
                    '【照片・影片混合網格】顯示模式',
                media: '顯示照片・影片按鈕',
                mediaNote:
                    '也可透過【Ctrl+Shift+點擊媒體】切換',
                likes: '顯示按讚列表跳轉按鈕',
                language: '顯示語言',
                color: '顏色',
                revertMediaCarousel:
                    '將貼文內媒體顯示為網格',
                repostTimestamp:
                    '轉發(RT)時間顯示',
                cancel: '取消',
                save: '儲存',
                settings: '設定'
            };
        }

        return {
            title: '✦ Script Settings',
            openProfileFromAll:
                'Set default profile tab to “All”',
            openMediaFromPhoto:
                'Set default media tab to “Photos”',
            hideOtherMentionsInAll:
                'Hide replies to others in “All”',
            hideFollowedMentionsInAll:
                '└ Hide replies to followed users',
            showHiddenReplyMarker:
                '└ Mark posts with hidden replies',
            hideUnfollowedMentionsInHome:
                'Hide replies to non-follows in Home',
            openMediaFromPhotoNote:
                ' When OFF, the default\n' +
                '【Mixed Photos・Videos Grid】 is shown',
            media: 'Show Photos・Videos buttons',
            mediaNote:
                'Can also switch with 【Ctrl+Shift+Media Click】',
            likes: 'Show Likes navigation button',
            language: 'Language',
            color: 'Color',
	  revertMediaCarousel:
                'Show post media in a grid',
            repostTimestamp:
                'Show repost (RT) Timestamp',
            cancel: 'Cancel',
            save: 'Save',
            settings: 'Settings'
        };
    }

    // ============================================================
    // Settings popup
    // ============================================================

    function closeSettingsPopup() {
        const popup =
            document.querySelector(
                '.x-default-settings-popup'
            );

        if (popup) {
            popup.remove();
        }
    }

    function applySettingsPopupTheme() {
        const popup =
            document.querySelector(
                '.x-default-settings-popup'
            );

        if (!popup) {
            return;
        }

        const base =
            getBaseThemeColors();

        popup.style.background =
            base.background;

        popup.style.color =
            base.text;

        popup.style.borderColor =
            base.border;

        for (
            const control of
            popup.querySelectorAll(
                'select, .x-settings-action'
            )
        ) {
            control.style.background =
                base.background;

            control.style.color =
                base.text;

            control.style.borderColor =
                control.classList.contains(
                    'x-settings-language-select'
                )
                    ? isLightTheme()
                        ? '#cfd9de'
                        : '#536471'
                    : base.border;
        }

        const save =
            popup.querySelector(
                '.x-settings-save'
            );

        if (save) {
            save.style.background =
                getAccentColor();

            save.style.borderColor =
                getAccentColor();

            save.style.color =
                getAccentTextColor();
        }

        for (
            const choice of
            popup.querySelectorAll(
                '.x-settings-color-choice'
            )
        ) {
            const checked =
                choice.querySelector(
                    'input'
                )?.checked;

            choice.style.outline =
                checked
                    ? `2px solid ${base.text}`
                    : 'none';

            choice.style.outlineOffset =
                checked
                    ? '2px'
                    : '0';
        }
    }

    function openSettingsPopup(
        settingsButton = null
    ) {
        const existing =
            document.querySelector(
                '.x-default-settings-popup'
            );

        if (existing) {
            closeSettingsPopup();
            return;
        }

        const text =
            getSettingsText();

        const base =
            getBaseThemeColors();

        const popup =
            document.createElement('div');

        popup.className =
            'x-default-settings-popup';

        if (!settingsButton) {
            popup.dataset.globalShortcut =
                'true';
        }

        popup.style.cssText = `
            position: fixed;

            z-index: 2147483646;

            width: 270px;

            padding: 14px;

            border: 1px solid ${base.border};
            border-radius: 12px;

            background: ${base.background};
            color: ${base.text};

            box-shadow:
                0 8px 28px rgba(0, 0, 0, 0.24);

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                Roboto,
                Helvetica,
                Arial,
                sans-serif;

            font-size: 13px;

            box-sizing: border-box;
        `;

        const title =
            document.createElement('div');

        title.style.cssText = `
            margin-bottom: 10px;

            display: flex;
            align-items: baseline;
            gap: 6px;
        `;

        const titleLabel =
            document.createElement('span');

        titleLabel.textContent =
            text.title;

        titleLabel.style.cssText = `
            font-size: 15px;
            font-weight: 700;
            line-height: 20px;
        `;

        const shortcutNote =
            document.createElement('span');

        shortcutNote.textContent =
            '【Ctrl+Shift+Z】';

        shortcutNote.style.cssText = `
            font-size: 10px;
            line-height: 14px;

            color: #71767b;
        `;

        title.append(
            titleLabel,
            shortcutNote
        );

        popup.appendChild(title);

        function createRow(labelText) {
            const row =
                document.createElement('div');

            row.style.cssText = `
                min-height: 36px;

                display: flex;
                align-items: center;
                justify-content: space-between;

                gap: 10px;
            `;

            const label =
                document.createElement('span');

            label.textContent =
                labelText;

            label.style.cssText = `
                font-weight: 500;
                line-height: 18px;
            `;

            row.appendChild(label);

            return row;
        }

        // --------------------------------------------------------

        const openProfileFromAllRow =
            createRow(text.openProfileFromAll);

        openProfileFromAllRow.style.minHeight =
            '30px';

        const openProfileFromAllCheckbox =
            document.createElement('input');

        openProfileFromAllCheckbox.type =
            'checkbox';

        openProfileFromAllCheckbox.checked =
            isEnabled(
                userSettings.openProfileFromAll
            );

        openProfileFromAllCheckbox.style.cssText = `
            width: 16px;
            height: 16px;
            flex: 0 0 16px;

            margin: 0;

            accent-color:
                ${getAccentColor()};

            cursor: pointer;
        `;

        openProfileFromAllRow.appendChild(
            openProfileFromAllCheckbox
        );

        popup.appendChild(
            openProfileFromAllRow
        );

        const hideOtherMentionsRow =
            createRow(text.hideOtherMentionsInAll);

        hideOtherMentionsRow.style.minHeight =
            '30px';

        const hideOtherMentionsCheckbox =
            document.createElement('input');

        hideOtherMentionsCheckbox.type =
            'checkbox';

        hideOtherMentionsCheckbox.checked =
            isEnabled(
                userSettings.hideOtherMentionsInAll
            );

        hideOtherMentionsCheckbox.style.cssText = `
            width: 16px;
            height: 16px;
            flex: 0 0 16px;

            margin: 0;

            accent-color:
                ${getAccentColor()};

            cursor: pointer;
        `;

        hideOtherMentionsRow.appendChild(
            hideOtherMentionsCheckbox
        );

        popup.appendChild(
            hideOtherMentionsRow
        );

        const hideFollowedMentionsRow =
            createRow(text.hideFollowedMentionsInAll);

        hideFollowedMentionsRow.style.minHeight =
            '22px';

        hideFollowedMentionsRow.style.marginTop =
            '-4px';

        const hideFollowedMentionsCheckbox =
            document.createElement('input');

        hideFollowedMentionsCheckbox.type =
            'checkbox';

        hideFollowedMentionsCheckbox.checked =
            isEnabled(
                userSettings.hideFollowedMentionsInAll
            );

        hideFollowedMentionsCheckbox.disabled =
            !hideOtherMentionsCheckbox.checked;

        hideFollowedMentionsCheckbox.style.cssText = `
            width: 12px;
            height: 12px;

            margin: 0 2px 0 0;

            accent-color:
                ${getAccentColor()};

            cursor: pointer;
            flex: 0 0 12px;
            filter: brightness(0.67) saturate(0.80);
        `;

        hideFollowedMentionsRow.style.paddingLeft =
            '14px';

        hideFollowedMentionsRow.firstElementChild.style.fontSize =
            '12px';

        hideFollowedMentionsRow.firstElementChild.style.fontWeight =
            '400';

        hideFollowedMentionsRow.firstElementChild.style.lineHeight =
            '16px';

        hideOtherMentionsCheckbox.addEventListener(
            'change',
            function () {
                hideFollowedMentionsCheckbox.disabled =
                    !hideOtherMentionsCheckbox.checked;

                hideFollowedMentionsRow.style.opacity =
                    hideOtherMentionsCheckbox.checked
                        ? '1'
                        : '0.45';
            }
        );

        hideFollowedMentionsRow.style.opacity =
            hideOtherMentionsCheckbox.checked
                ? '1'
                : '0.45';

        hideFollowedMentionsRow.appendChild(
            hideFollowedMentionsCheckbox
        );

        popup.appendChild(
            hideFollowedMentionsRow
        );

        const showHiddenReplyMarkerRow =
            createRow(text.showHiddenReplyMarker);

        showHiddenReplyMarkerRow.style.minHeight =
            '22px';

        showHiddenReplyMarkerRow.style.marginTop =
            '-2px';

        showHiddenReplyMarkerRow.style.paddingLeft =
            '14px';

        showHiddenReplyMarkerRow.firstElementChild.style.fontSize =
            '12px';

        showHiddenReplyMarkerRow.firstElementChild.style.fontWeight =
            '400';

        showHiddenReplyMarkerRow.firstElementChild.style.lineHeight =
            '16px';

        const showHiddenReplyMarkerCheckbox =
            document.createElement('input');

        showHiddenReplyMarkerCheckbox.type =
            'checkbox';

        showHiddenReplyMarkerCheckbox.checked =
            isEnabled(
                userSettings.showHiddenReplyMarker
            );

        showHiddenReplyMarkerCheckbox.style.cssText = `
            width: 12px;
            height: 12px;

            margin: 0 2px 0 0;

            accent-color:
                ${getAccentColor()};

            cursor: pointer;
            flex: 0 0 12px;
            filter: brightness(0.67) saturate(0.80);
        `;

        function refreshHiddenReplyMarkerDependency() {
            showHiddenReplyMarkerCheckbox.disabled =
                !hideOtherMentionsCheckbox.checked;

            showHiddenReplyMarkerRow.style.opacity =
                hideOtherMentionsCheckbox.checked
                    ? '1'
                    : '0.45';
        }

        hideOtherMentionsCheckbox.addEventListener(
            'change',
            refreshHiddenReplyMarkerDependency
        );

        refreshHiddenReplyMarkerDependency();

        showHiddenReplyMarkerRow.appendChild(
            showHiddenReplyMarkerCheckbox
        );

        popup.appendChild(
            showHiddenReplyMarkerRow
        );

        const hideUnfollowedMentionsRow =
            createRow(text.hideUnfollowedMentionsInHome);

        hideUnfollowedMentionsRow.style.marginBottom =
            '-3px';

        const hideUnfollowedMentionsCheckbox =
            document.createElement('input');

        hideUnfollowedMentionsCheckbox.type =
            'checkbox';

        hideUnfollowedMentionsCheckbox.checked =
            isEnabled(
                userSettings.hideUnfollowedMentionsInHome
            );

        hideUnfollowedMentionsCheckbox.style.cssText = `
            width: 16px;
            height: 16px;
            flex: 0 0 16px;

            margin: 0;

            accent-color:
                ${getAccentColor()};

            cursor: pointer;
        `;

        hideUnfollowedMentionsRow.appendChild(
            hideUnfollowedMentionsCheckbox
        );

        popup.appendChild(
            hideUnfollowedMentionsRow
        );

        // --------------------------------------------------------
        // Open Media from Photos ON/OFF
        // --------------------------------------------------------

        const openMediaFromPhotoRow =
            createRow(text.openMediaFromPhoto);

        const openMediaFromPhotoCheckbox =
            document.createElement('input');

        openMediaFromPhotoCheckbox.type =
            'checkbox';

        openMediaFromPhotoCheckbox.checked =
            isEnabled(
                userSettings.openMediaFromPhoto
            );

        openMediaFromPhotoCheckbox.style.cssText = `
            width: 16px;
            height: 16px;
            flex: 0 0 16px;

            margin: 0;

            accent-color:
                ${getAccentColor()};

            cursor: pointer;
        `;

        openMediaFromPhotoRow.appendChild(
            openMediaFromPhotoCheckbox
        );

        popup.appendChild(
            openMediaFromPhotoRow
        );

        const openMediaFromPhotoNote =
            document.createElement('div');

        openMediaFromPhotoNote.textContent =
            text.openMediaFromPhotoNote;

        openMediaFromPhotoNote.style.cssText = `
            margin-top: -7px;
            margin-bottom: 0px;
            padding-right: 4px;

            font-size: 10px;
            line-height: 1.45;
            white-space: pre-wrap;

            color: #71767b;
        `;

        popup.appendChild(
            openMediaFromPhotoNote
        );

        // --------------------------------------------------------
        // Media buttons ON/OFF
        // --------------------------------------------------------

        const mediaRow =
            createRow(text.media);

        const mediaCheckbox =
            document.createElement('input');

        mediaCheckbox.type =
            'checkbox';

        mediaCheckbox.checked =
            isEnabled(
                userSettings.showMediaButtons
            );

        mediaCheckbox.style.cssText = `
            width: 16px;
            height: 16px;
            flex: 0 0 16px;

            margin: 0;

            accent-color:
                ${getAccentColor()};

            cursor: pointer;
        `;

                mediaRow.appendChild(
            mediaCheckbox
        );

        popup.appendChild(mediaRow);

        const mediaNote =
            document.createElement(
                'div'
            );

        mediaNote.textContent =
            text.mediaNote;

        mediaNote.style.cssText = `
            margin-top: -7px;
            margin-bottom: 0px;
            padding-right: 4px;

            font-size: 10px;
            line-height: 1.45;
            white-space: pre-wrap;

            color: #71767b;
        `;

        popup.appendChild(
            mediaNote
        );

        // --------------------------------------------------------
        // Likes ON/OFF
        // --------------------------------------------------------

        const likesRow =
            createRow(text.likes);

        likesRow.style.marginBottom =
            '-3px';

        const likesCheckbox =
            document.createElement('input');

        likesCheckbox.type =
            'checkbox';

        likesCheckbox.checked =
            isEnabled(
                userSettings.showLikesButton
            );

        likesCheckbox.style.cssText = `
            width: 16px;
            height: 16px;
            flex: 0 0 16px;

            margin: 0;

            accent-color:
                ${getAccentColor()};

            cursor: pointer;
        `;

        likesRow.appendChild(
            likesCheckbox
        );

        popup.appendChild(likesRow);

        // --------------------------------------------------------
        // Language
        // --------------------------------------------------------

        const languageRow =
            createRow(text.language);

        const languageSelect =
            document.createElement('select');

        languageSelect.className =
            'x-settings-language-select';

        languageSelect.style.cssText = `
            width: 112px;
            height: 29px;

            padding: 0 7px;

            border: 1px solid ${
                isLightTheme()
                    ? '#cfd9de'
                    : '#536471'
            };
            border-radius: 6px;

            background: ${base.background};
            color: ${base.text};

            cursor: pointer;
        `;

        for (const [value, label] of [
            ['J', '日本語'],
            ['E', 'English'],
            ['K', '한국어'],
            ['SC', '简体中文'],
            ['TC', '繁體中文']
        ]) {
            const option =
                document.createElement('option');

            option.value = value;
            option.textContent = label;
            languageSelect.appendChild(option);
        }

        languageSelect.value =
            userSettings.language;

        languageRow.appendChild(
            languageSelect
        );

        popup.appendChild(
            languageRow
        );

        // --------------------------------------------------------
        // Color
        // --------------------------------------------------------

        const colorRow =
            createRow(text.color);
            colorRow.style.marginTop = '-3px';

        const colorGroup =
            document.createElement('div');

        colorGroup.style.cssText = `
            display: flex;
            align-items: center;

            gap: 8px;
        `;

        for (
            let number = 1;
            number <= 6;
            number++
        ) {
            const choice =
                document.createElement('label');

            choice.className =
                'x-settings-color-choice';

            choice.title =
                String(number);

            choice.style.cssText = `
                position: relative;

                width: 17px;
                height: 17px;

                display: inline-flex;
                align-items: center;
                justify-content: center;

                border-radius: 50%;

                background:
                    ${accentColors[number]};

                cursor: pointer;

                box-sizing: border-box;
            `;

            const radio =
                document.createElement('input');

            radio.type = 'radio';
            radio.name =
                'x-settings-color';

            radio.value =
                String(number);

            radio.checked =
                number ===
                userSettings.colorTheme;

            radio.style.cssText = `
                position: absolute;
                opacity: 0;
                pointer-events: none;
            `;

            radio.addEventListener(
                'change',
                applySettingsPopupTheme
            );

            choice.appendChild(radio);
            colorGroup.appendChild(choice);
        }

        colorRow.appendChild(
            colorGroup
        );

        popup.appendChild(colorRow);

        // --------------------------------------------------------
        // Repost (Retweet) Timestamp
        // --------------------------------------------------------

        const repostTimestampRow =
            createRow(
                text.repostTimestamp
            );

        const repostTimestampCheckbox =
            document.createElement(
                'input'
            );

        repostTimestampCheckbox.type =
            'checkbox';

        repostTimestampCheckbox.checked =
            isEnabled(
                userSettings.showRepostTimestamp
            );

        repostTimestampCheckbox.style.cssText = `
            width: 16px;
            height: 16px;
            flex: 0 0 16px;

            margin: 0;

            accent-color:
                ${getAccentColor()};

            cursor: pointer;
        `;

        repostTimestampRow.appendChild(
            repostTimestampCheckbox
        );

        // --------------------------------------------------------
        // Revert Media Carousel
        // --------------------------------------------------------

        const revertMediaCarouselRow =
            createRow(
                text.revertMediaCarousel
            );

        revertMediaCarouselRow.style.marginBottom =
            '-3px';

        const revertMediaCarouselCheckbox =
            document.createElement(
                'input'
            );

        revertMediaCarouselCheckbox.type =
            'checkbox';

        revertMediaCarouselCheckbox.checked =
            isEnabled(
                userSettings.revertMediaCarousel
            );

        revertMediaCarouselCheckbox.style.cssText = `
            width: 16px;
            height: 16px;
            flex: 0 0 16px;

            margin: 0;

            accent-color:
                ${getAccentColor()};

            cursor: pointer;
        `;

        revertMediaCarouselRow.appendChild(
            revertMediaCarouselCheckbox
        );

        const firstSettingsSeparator =
            document.createElement('div');

        firstSettingsSeparator.style.cssText =
            `height:0;margin:6px 0;` +
            `border-top:1px solid ${base.border};` +
            `box-sizing:border-box;opacity:.85;`;

        const secondSettingsSeparator =
            document.createElement('div');

        secondSettingsSeparator.style.cssText =
            firstSettingsSeparator.style.cssText;

        popup.append(
            openMediaFromPhotoRow,
            openMediaFromPhotoNote,
            mediaRow,
            mediaNote,
            likesRow,
            firstSettingsSeparator,
            hideOtherMentionsRow,
            hideFollowedMentionsRow,
            showHiddenReplyMarkerRow,
            hideUnfollowedMentionsRow,
            secondSettingsSeparator,
            revertMediaCarouselRow,
            repostTimestampRow,
            languageRow,
            colorRow
        );

        // --------------------------------------------------------
        // Footer
        // --------------------------------------------------------

        const footer =
            document.createElement('div');

        footer.style.cssText = `
            margin-top: 12px;

            position: relative;
            height: 30px;
        `;

        function createActionButton(label) {

            const button =
                  document.createElement(
                      'button'
                  );

            button.className =
                'x-settings-action';

            button.textContent =
                label;

            button.style.cssText = `
                width: 80px;
                min-width: 80px;
                height: 30px;

                padding: 0 8px;
                flex: 0 0 80px;

                border: 1px solid ${base.border};
                border-radius: 7px;

                background: ${base.background};
                color: ${base.text};

                display: inline-flex;
                align-items: center;
                justify-content: center;

                font-size: 12px;
                font-weight: 600;
                line-height: 1;
                text-align: center;

                cursor: pointer;
                box-sizing: border-box;
                `;

            return button;
        }

        const cancelButton =
            createActionButton(
                text.cancel
            );

        cancelButton.textContent = '';

        cancelButton.setAttribute(
            'aria-label',
            text.cancel
        );

        cancelButton.title =
            text.cancel;

        cancelButton.style.width =
            '30px';

        cancelButton.style.minWidth =
            '30px';

        cancelButton.style.flex =
            '0 0 30px';

        cancelButton.style.padding =
            '0';

        cancelButton.style.position =
            'absolute';

        cancelButton.style.left =
            'calc(50% + 48px)';

        cancelButton.style.top =
            '0';

        cancelButton.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true" ' +
            'style="width:14px;height:14px;display:block;fill:currentColor;pointer-events:none">' +
            '<path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.3 9.17 12 2.88 5.7 4.29 4.29 10.59 10.59 16.89 4.29z"/>' +
            '</svg>';

        const saveButton =
            createActionButton(
                text.save
            );

        saveButton.classList.add(
            'x-settings-save'
        );

        saveButton.style.background =
            getAccentColor();

        saveButton.style.borderColor =
            getAccentColor();

        saveButton.style.color =
            getAccentTextColor();

        saveButton.style.position =
            'absolute';

        saveButton.style.left =
            '50%';

        saveButton.style.top =
            '0';

        saveButton.style.transform =
            'translateX(-50%)';

        saveButton.style.transition =
            'filter 0.12s ease';

        saveButton.addEventListener(
            'mouseenter',
            function () {
                saveButton.style.filter =
                    'brightness(1.12)';
            }
        );

        saveButton.addEventListener(
            'mouseleave',
            function () {
                saveButton.style.filter =
                    'none';
            }
        );

        saveButton.addEventListener(
            'mousedown',
            function () {
                saveButton.style.filter =
                    `brightness(${getPressedBrightness()})`;
            }
        );

        saveButton.addEventListener(
            'mouseup',
            function () {
                saveButton.style.filter =
                    'brightness(1.12)';
            }
        );

        cancelButton.addEventListener(
            'click',
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                closeSettingsPopup();
            }
        );

        saveButton.addEventListener(
            'click',
            function (event) {
                event.preventDefault();

                const selectedColor =
                    popup.querySelector(
                        'input[name="x-settings-color"]:checked'
                    );

                const previousRevertMediaCarousel =
                    userSettings.revertMediaCarousel;

                const previousOpenMediaFromPhoto =
                    userSettings.openMediaFromPhoto;

                const previousOpenProfileFromAll =
                    userSettings.openProfileFromAll;

                saveUserSettings({
                    openProfileFromAll:
                        openProfileFromAllCheckbox.checked
                            ? 'O'
                            : 'X',

                    hideUnfollowedMentionsInHome:
                        hideUnfollowedMentionsCheckbox.checked
                            ? 'O'
                            : 'X',

                    hideOtherMentionsInAll:
                        hideOtherMentionsCheckbox.checked
                            ? 'O'
                            : 'X',

                    hideFollowedMentionsInAll:
                        hideFollowedMentionsCheckbox.checked
                            ? 'O'
                            : 'X',

                    showHiddenReplyMarker:
                        showHiddenReplyMarkerCheckbox.checked
                            ? 'O'
                            : 'X',

                    openMediaFromPhoto:
                        openMediaFromPhotoCheckbox.checked
                            ? 'O'
                            : 'X',

                    showMediaButtons:
                        mediaCheckbox.checked
                            ? 'O'
                            : 'X',

                    showLikesButton:
                        likesCheckbox.checked
                            ? 'O'
                            : 'X',

                    showRepostTimestamp:
                        repostTimestampCheckbox.checked
                            ? 'O'
                            : 'X',

                    revertMediaCarousel:
                        revertMediaCarouselCheckbox.checked
                            ? 'O'
                            : 'X',

                    language:
                        languageSelect.value,

                    colorTheme:
                        selectedColor
                            ? Number(
                                selectedColor.value
                            )
                            : userSettings.colorTheme
                });

                closeSettingsPopup();

                rebuildShortcutButtons();
                refreshSettingsButton();
                ensureSettingsButton();
                refreshRepostTimestamps();
                tryPatchFeatureSwitch();

                if (
                    previousOpenProfileFromAll !==
                        userSettings.openProfileFromAll
                ) {
                    const profileRouteMatch =
                        location.pathname.match(
                            /^\/([A-Za-z0-9_]{1,15})(\/all)?\/?$/
                        );

                    if (
                        profileRouteMatch &&
                        !excludedPaths.has(
                            profileRouteMatch[1].toLowerCase()
                        )
                    ) {
                        navigate(
                            '/' + profileRouteMatch[1] +
                            (
                                isEnabled(
                                    userSettings.openProfileFromAll
                                )
                                    ? '/all'
                                    : ''
                            )
                        );
                    }
                }

                if (
                    previousRevertMediaCarousel !==
                        userSettings.revertMediaCarousel
                ) {
                    refreshCurrentRoute();
                }

                if (
                    previousOpenMediaFromPhoto !==
                        userSettings.openMediaFromPhoto &&
                    /^\/[^/]+\/media\/?$/.test(
                        location.pathname
                    )
                ) {
                    navigate(
                        location.pathname,
                        isEnabled(
                            userSettings.openMediaFromPhoto
                        )
                            ? '?filter=photo'
                            : ''
                    );
                }
            }
        );

        footer.append(
            saveButton,
            cancelButton
        );

        popup.appendChild(footer);

        document.body.appendChild(popup);

        // --------------------------------------------------------
        // Display popup
        // --------------------------------------------------------

        const mobilePopupMode =
            /Android|Mobi|iPhone|iPad|iPod/i.test(
                navigator.userAgent
            ) || window.innerWidth <= 440;

        const buttonRect =
            settingsButton
                ? settingsButton
                    .getBoundingClientRect()
                : {
                    right:
                        window.innerWidth - 25,
                    top: 10
                };

        if (mobilePopupMode) {
            popup.style.maxWidth =
                'calc(100vw - 20px)';
        }

        const popupRect =
            popup.getBoundingClientRect();

        let left =
            buttonRect.right -
            popupRect.width;

        left =
            Math.max(
                10,
                Math.min(
                    left,
                    window.innerWidth -
                    popupRect.width -
                    10
                )
            );

        const preferredTop =
            settingsButton
                ? buttonRect.top
                : 10;

        const hasEnoughVerticalSpace =
            preferredTop +
            popupRect.height <=
            window.innerHeight - 10;

        const fixedTop =
            mobilePopupMode
                ? 28
                : 10;

        const top =
            hasEnoughVerticalSpace
                ? preferredTop
                : fixedTop;

        if (!hasEnoughVerticalSpace) {
            popup.style.maxHeight =
                `calc(100dvh - ${fixedTop + 10}px)`;

            popup.style.overflowY =
                'auto';

            popup.style.overscrollBehavior =
                'contain';

        }

        popup.style.left =
            `${Math.round(left)}px`;

        popup.style.top =
            `${Math.round(top)}px`;

        applySettingsPopupTheme();

        popup.addEventListener(
            'click',
            function (event) {
                event.stopPropagation();
            }
        );
    }

    // ============================================================
    // Settings button
    // ============================================================

    function refreshSettingsButton() {
        const button =
            document.querySelector(
                '.x-profile-settings-button'
            );

        if (!button) {
            return;
        }

        const text =
            getSettingsText();

        button.title =
            text.settings;

        button.setAttribute(
            'aria-label',
            text.settings
        );

        refreshButtonStyle(button);
    }

        function ensureSettingsButton() {
        const currentUsername =
            getProfileUsername();

        let existingWrapper =
            document.querySelector(
                '.x-profile-settings-wrapper'
            );

        if (!currentUsername) {
            if (existingWrapper) {
                existingWrapper.remove();
            }

            const popup =
                document.querySelector(
                    '.x-default-settings-popup'
                );

            if (
                !popup ||
                popup.dataset
                    .globalShortcut !== 'true'
            ) {
                closeSettingsPopup();
            }

            return;
        }

        // --------------------------------------------------------

        const userName =
            document.querySelector(
                '[data-testid="UserName"]'
            );

        if (!userName) {
            return;
        }

        const profileOuter =
            userName.parentElement;

        if (!profileOuter) {
            return;
        }

        // --------------------------------------------------------

        const outerStyle =
            getComputedStyle(
                profileOuter
            );

        if (
            outerStyle.position ===
            'static'
        ) {
            profileOuter.style.position =
                'relative';
        }

        if (
            outerStyle.overflow ===
            'hidden'
        ) {
            profileOuter.style.overflow =
                'visible';
        }

        let wrapper =
            existingWrapper;

        let button =
            wrapper?.querySelector(
                '.x-profile-settings-button'
            );

        // --------------------------------------------------------

        if (
            wrapper &&
            wrapper.dataset.username !==
                currentUsername
        ) {
            wrapper.remove();

            wrapper = null;
            button = null;
        }

        // --------------------------------------------------------
        // Recreate the button if X rebuilds the profile DOM
        // --------------------------------------------------------

        if (
            wrapper &&
            wrapper.parentElement !==
                profileOuter
        ) {
            wrapper.remove();

            wrapper = null;
            button = null;
        }

        // --------------------------------------------------------

        if (
            !wrapper ||
            !button
        ) {
            wrapper =
                document.createElement(
                    'div'
                );

            wrapper.className =
                'x-profile-settings-wrapper';

            wrapper.dataset.username =
                currentUsername;

            wrapper.style.cssText = `
                position: absolute;

                top: 51px;
                right: 9px;

                z-index: 21;

                width: 22px;
                height: 22px;

                display: flex;
                align-items: center;
                justify-content: center;

                pointer-events: auto;
            `;

            button =
                document.createElement(
                    'button'
                );

            button.className =
                'x-profile-settings-button';

            button.style.cssText = `
                position: relative;

                width: 22px;
                height: 22px;

                padding: 0;

                border-style: solid;
                border-width: 1px;
                border-radius: 50%;

                display: flex;
                align-items: center;
                justify-content: center;

                font-size: 12px;
                line-height: 1;
                text-align: center;

                cursor: pointer;
                box-sizing: border-box;

                transition:
                    background-color 0.10s ease,
                    border-color 0.10s ease,
                    color 0.10s ease,
                    filter 0.06s ease;
            `;

            const settingsIcon =
                  document.createElementNS(
                      'http://www.w3.org/2000/svg',
                      'svg'
                  );

            settingsIcon.setAttribute(
                'viewBox',
                '0 0 24 24'
            );

            settingsIcon.setAttribute(
                'aria-hidden',
                'true'
            );

            settingsIcon.style.cssText = `
                width: 14px;
                height: 14px;

                display: block;

                fill: currentColor;
                pointer-events: none;
            `;

            const settingsIconPath =
                  document.createElementNS(
                      'http://www.w3.org/2000/svg',
                      'path'
                  );

            settingsIconPath.setAttribute(
                'd',
                'M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.1 7.1 0 0 0-1.62-.94L14.38 2.8a.5.5 0 0 0-.49-.4h-3.84a.5.5 0 0 0-.49.4L9.2 5.32c-.58.24-1.12.56-1.62.94L5.19 5.3a.5.5 0 0 0-.61.22L2.66 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.05.31-.08.64-.08.96 0 .31.03.62.08.92L2.78 14.5a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96c.5.39 1.04.7 1.62.94l.36 2.54a.5.5 0 0 0 .49.4h3.84a.5.5 0 0 0 .49-.4l.36-2.54c.58-.24 1.12-.55 1.62-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.02-1.56zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z'
            );

            settingsIcon.appendChild(
                settingsIconPath
            );

            button.appendChild(
                settingsIcon
            );

            addButtonEffects(
                button
            );

            button.addEventListener(
                'click',
                function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    openSettingsPopup(
                        button
                    );
                }
            );

            wrapper.appendChild(
                button
            );

            profileOuter.appendChild(
                wrapper
            );
        }

        refreshSettingsButton();
    }

    // ============================================================
    // Close popup when clicking outside
    // ============================================================

    document.addEventListener(
        'click',
        function (event) {
            const popup =
                document.querySelector(
                    '.x-default-settings-popup'
                );

            if (!popup) {
                return;
            }

            if (
                event.target.closest(
                    '.x-profile-settings-button'
                )
            ) {
                return;
            }

            if (!popup.contains(event.target)) {
                closeSettingsPopup();
            }
        }
    );

    // ============================================================
    // Global settings shortcut (Ctrl+Shift+Z)
    // ============================================================

    function isTextEntryTarget(target) {
        if (
            !target ||
            typeof target.closest !== 'function'
        ) {
            return false;
        }

        if (
            target.closest(
                'textarea, select, [contenteditable="true"], [role="textbox"]'
            )
        ) {
            return true;
        }

        const input =
            target.closest('input');

        if (!input) {
            return false;
        }

        return [
            'text',
            'search',
            'email',
            'url',
            'tel',
            'password',
            'number'
        ].includes(
            (input.type || 'text')
                .toLowerCase()
        );
    }

    document.addEventListener(
        'keydown',
        function (event) {
            if (
                event.code !== 'KeyZ' ||
                !event.ctrlKey ||
                !event.shiftKey ||
                event.altKey ||
                event.metaKey ||
                event.repeat ||
                isTextEntryTarget(event.target)
            ) {
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();

            openSettingsPopup();
        },
        true
    );

    // ============================================================
    // Repost (Retweet) Timestamp
    // ============================================================

    const pageWindow =
        unsafeWindow;

    const repostTimes =
        new Map();

    const replyTargets =
        new Map();

    const replyParentIds =
        new Map();

    const tweetAuthors =
        new Map();

    const usernamesById =
        new Map();

    const followingByUsername =
        new Map();

    const followingCacheKey =
        'x-home-mention-following-cache-v3';

    const followingCacheMaxAge =
        24 * 60 * 60 * 1000;

    let followingCacheViewer = '';

    const followingCachedUsernames =
        new Set();

    function loadFollowingCache(viewer) {
        if (!viewer || followingCacheViewer === viewer) {
            return;
        }

        if (followingCacheViewer) {
            followingByUsername.clear();
        }

        followingCacheViewer = viewer;

        followingCachedUsernames.clear();

        const cache = GM_getValue(
            followingCacheKey,
            {}
        );

        const entries =
            cache && typeof cache === 'object'
                ? cache[viewer]
                : null;

        if (!entries || typeof entries !== 'object') {
            return;
        }

        const now = Date.now();

        for (const [username, value] of
            Object.entries(entries)) {
            if (
                Array.isArray(value) &&
                typeof value[0] === 'boolean' &&
                Number.isFinite(value[1]) &&
                now - value[1] < followingCacheMaxAge
            ) {
                followingCachedUsernames.add(
                    username
                );

                followingByUsername.set(
                    username,
                    value[0]
                );
            }
        }
    }

    function saveFollowingCache(
        viewer,
        username,
        following
    ) {
        if (!viewer) {
            return;
        }

        const stored = GM_getValue(
            followingCacheKey,
            {}
        );

        const cache =
            stored && typeof stored === 'object'
                ? stored
                : {};

        const entries =
            cache[viewer] &&
            typeof cache[viewer] === 'object'
                ? cache[viewer]
                : {};

        entries[username] = [
            following,
            Date.now()
        ];

        cache[viewer] = entries;

        if (viewer === followingCacheViewer) {
            followingCachedUsernames.add(
                username
            );
        }

        GM_setValue(
            followingCacheKey,
            cache
        );
    }

    function scanRepostObject(obj) {
        if (
            !obj ||
            typeof obj !== 'object'
        ) {
            return;
        }

        try {
            const legacy =
                obj.legacy;

            const tweetId =
                obj.rest_id ||
                legacy?.id_str;

            const tweetAuthor =
                getTimelineTweetUsername(obj);

            if (tweetId && tweetAuthor) {
                tweetAuthors.set(
                    String(tweetId),
                    tweetAuthor
                );
            }

            if (
                obj.rest_id &&
                legacy &&
                legacy.screen_name
            ) {
                usernamesById.set(
                    String(obj.rest_id),
                    String(legacy.screen_name)
                );

                const following =
                    typeof legacy.following === 'boolean'
                        ? legacy.following
                        : typeof obj.relationship_perspectives
                            ?.following === 'boolean'
                            ? obj.relationship_perspectives.following
                            : null;

                if (following !== null) {
                    const normalizedUsername =
                        String(legacy.screen_name)
                            .toLowerCase();

                    if (
                        !followingCachedUsernames.has(
                            normalizedUsername
                        )
                    ) {
                        followingByUsername.set(
                            normalizedUsername,
                            following
                        );
                    }
                }
            }

            if (
                legacy &&
                legacy.in_reply_to_screen_name
            ) {
                const replyId =
                    obj.rest_id ||
                    legacy.id_str;

                if (replyId) {
                    replyTargets.set(
                        String(replyId),
                        String(
                            legacy.in_reply_to_screen_name
                        )
                    );

                    if (legacy.in_reply_to_status_id_str) {
                        replyParentIds.set(
                            String(replyId),
                            String(
                                legacy.in_reply_to_status_id_str
                            )
                        );
                    }
                }
            }

            if (
                legacy &&
                legacy.created_at &&
                legacy.retweeted_status_result
            ) {
                let original =
                    legacy
                        .retweeted_status_result
                        .result;

                if (
                    original &&
                    original.__typename ===
                        'TweetWithVisibilityResults'
                ) {
                    original =
                        original.tweet;
                }

                let id = null;

                if (original) {
                    if (original.rest_id) {
                        id =
                            original.rest_id;
                    }
                    else if (
                        original.legacy &&
                        original.legacy.id_str
                    ) {
                        id =
                            original.legacy.id_str;
                    }
                }

                if (id) {
                    const date =
                        new Date(
                            legacy.created_at
                        );

                    if (
                        !Number.isNaN(
                            date.getTime()
                        )
                    ) {
                        repostTimes.set(
                            String(id),
                            date
                        );
                    }
                }
            }

        } catch (e) {}

        if (Array.isArray(obj)) {
            for (const item of obj) {
                scanRepostObject(
                    item
                );
            }
        }
        else {
            for (
                const value of
                Object.values(obj)
            ) {
                if (
                    value &&
                    typeof value ===
                        'object'
                ) {
                    scanRepostObject(
                        value
                    );
                }
            }
        }
    }

    function formatRepostDate(date) {
        const y =
            String(
                date.getFullYear()
            ).slice(-2);

        const m =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                '0'
            );

        const d =
            String(
                date.getDate()
            ).padStart(
                2,
                '0'
            );

        const h =
            String(
                date.getHours()
            ).padStart(
                2,
                '0'
            );

        const min =
            String(
                date.getMinutes()
            ).padStart(
                2,
                '0'
            );

        return (
            y + '/' +
            m + '/' +
            d + ' · ' +
            h + ':' +
            min
        );
    }

    function removeRepostTimestamps() {
        document
            .querySelectorAll(
                '.x-repost-timestamp'
            )
            .forEach(
                element => {
                    element.remove();
                }
            );
    }

    function renderRepostTimestamps() {

        if (
            !isEnabled(
                userSettings
                    .showRepostTimestamp
            )
        ) {
            return;
        }

        if (
            repostTimes.size === 0
        ) {
            return;
        }

        const links =
            document.querySelectorAll(
                '[href*="/status/"]'
            );

        for (const link of links) {

            const href =
                link.getAttribute(
                    'href'
                );

            if (!href) {
                continue;
            }

            const match =
                href.match(
                    /\/status\/(\d+)/
                );

            if (!match) {
                continue;
            }

            const id =
                match[1];

            if (
                !repostTimes.has(id)
            ) {
                continue;
            }

            const cell =
                link.closest(
                    '[data-testid="cellInnerDiv"]'
                );

            if (!cell) {
                continue;
            }

            if (
                cell.querySelector(
                    '.x-repost-timestamp'
                )
            ) {
                continue;
            }

            const label =
                cell.querySelector(
                    '[data-testid="socialContext"]'
                );

            if (!label) {
                continue;
            }

            const time =
                document.createElement(
                    'span'
                );

            time.className =
                'x-repost-timestamp';

            time.textContent =
                ' · ' +
                formatRepostDate(
                    repostTimes.get(id)
                );

            time.style.color =
                'rgb(113, 118, 123)';

            time.style.fontSize =
                '13px';

            time.style.fontWeight =
                '400';

            time.style.whiteSpace =
                'nowrap';

            label.appendChild(
                time
            );
        }
    }

    function refreshRepostTimestamps() {

        if (
            isEnabled(
                userSettings
                    .showRepostTimestamp
            )
        ) {
            renderRepostTimestamps();
        }
        else {
            removeRepostTimestamps();
        }
    }

    function isTimelineRequest(url) {
        if (
            typeof url !== 'string'
        ) {
            return false;
        }

        return (
            url.includes(
                '/graphql/'
            ) &&
            (
                url.includes(
                    'Timeline'
                ) ||
                url.includes(
                    'timeline'
                )
            )
        );
    }

    function unwrapTimelineTweet(result) {
        let tweet = result;

        while (
            tweet &&
            tweet.__typename ===
                'TweetWithVisibilityResults'
        ) {
            tweet = tweet.tweet;
        }

        return tweet;
    }

    function getTimelineItemTweet(itemContent) {
        return unwrapTimelineTweet(
            itemContent
                ?.tweet_results
                ?.result
        );
    }

    function getTimelineTweetUsername(tweet) {
        return String(
            tweet
                ?.core
                ?.user_results
                ?.result
                ?.legacy
                ?.screen_name ||
            tweet
                ?.core
                ?.user_results
                ?.result
                ?.core
                ?.screen_name ||
            ''
        ).toLowerCase();
    }

    function getTimelineTweetTarget(tweet) {
        const legacy = tweet?.legacy;

        if (!legacy) {
            return '';
        }

        const replyTarget =
            legacy.in_reply_to_screen_name;

        if (replyTarget) {
            return String(replyTarget)
                .toLowerCase();
        }

        const firstMention =
            legacy.entities
                ?.user_mentions?.[0]
                ?.screen_name || '';

        if (
            firstMention &&
            String(legacy.full_text || '')
                .trimStart()
                .toLowerCase()
                .startsWith(
                    '@' +
                    String(firstMention)
                        .toLowerCase()
                )
        ) {
            return String(firstMention)
                .toLowerCase();
        }

        return '';
    }

    const hiddenAllTweetIdsByContext =
        new Map();

    const markedAllRootTweetIdsByContext =
        new Map();

    function getHiddenAllTweetIds(
        profileUsername,
        authenticatedUsername
    ) {
        const key =
            profileUsername + '|' +
            authenticatedUsername;

        if (!hiddenAllTweetIdsByContext.has(key)) {
            hiddenAllTweetIdsByContext.set(
                key,
                new Set()
            );
        }

        return hiddenAllTweetIdsByContext.get(key);
    }

    function getMarkedAllRootTweetIds(
        profileUsername,
        authenticatedUsername
    ) {
        const key =
            profileUsername + '|' +
            authenticatedUsername;

        if (!markedAllRootTweetIdsByContext.has(key)) {
            markedAllRootTweetIdsByContext.set(
                key,
                new Set()
            );
        }

        return markedAllRootTweetIdsByContext.get(key);
    }

    function getTimelineEntryItemContents(entry) {
        const content = entry?.content;

        if (!content) {
            return [];
        }

        return Array.isArray(content.items)
            ? content.items.map(
                item => item?.item?.itemContent
            )
            : content.itemContent
                ? [content.itemContent]
                : [];
    }

    function rememberTimelineEntryTweetIds(
        entry,
        rememberedTweetIds
    ) {
        for (const itemContent of
            getTimelineEntryItemContents(entry)) {
            const tweet =
                getTimelineItemTweet(itemContent);

            const tweetId =
                tweet?.rest_id ||
                tweet?.legacy?.id_str;

            if (tweetId) {
                rememberedTweetIds.add(
                    String(tweetId)
                );
            }
        }
    }

    function shouldRemoveAllTimelineEntry(
        entry,
        profileUsername,
        authenticatedUsername
    ) {
        const itemContents =
            getTimelineEntryItemContents(entry);

        for (
            let index = itemContents.length - 1;
            index >= 0;
            index--
        ) {
            const tweet =
                getTimelineItemTweet(
                    itemContents[index]
                );

            if (
                !tweet ||
                getTimelineTweetUsername(tweet) !==
                    profileUsername
            ) {
                continue;
            }

            const targetUsername =
                getTimelineTweetTarget(tweet);

            if (!targetUsername) {
                return false;
            }

            if (
                !isEnabled(
                    userSettings.hideFollowedMentionsInAll
                )
            ) {
                loadFollowingCache(
                    authenticatedUsername
                );

                if (
                    followingByUsername.get(
                        targetUsername
                    ) === true
                ) {
                    return false;
                }

                if (
                    !followingByUsername.has(
                        targetUsername
                    )
                ) {
                    return false;
                }
            }

            return (
                targetUsername !== profileUsername &&
                targetUsername !== authenticatedUsername
            );
        }

        return false;
    }

    function filterAllTimelineJson(json) {
        const match =
            location.pathname.match(
                /^\/([A-Za-z0-9_]{1,15})\/all\/?$/
            );

        if (
            !match ||
            !isEnabled(
                userSettings.hideOtherMentionsInAll
            )
        ) {
            return false;
        }

        const profileUsername =
            match[1].toLowerCase();

        const authenticatedUsername =
            getAuthenticatedUsername()
                .toLowerCase();

        if (!authenticatedUsername) {
            return false;
        }

        const instructions =
            json
                ?.data
                ?.user
                ?.result
                ?.timeline
                ?.timeline
                ?.instructions;

        if (!Array.isArray(instructions)) {
            return false;
        }

        let changed = false;

        const rememberedTweetIds =
            getHiddenAllTweetIds(
                profileUsername,
                authenticatedUsername
            );

        for (const instruction of instructions) {
            if (!Array.isArray(instruction?.entries)) {
                continue;
            }

            const entries = instruction.entries;

            const filteredEntries =
                entries.filter(entry => {
                    if (
                        Array.isArray(
                            entry?.content?.items
                        )
                    ) {
                        return true;
                    }

                    const remove =
                        shouldRemoveAllTimelineEntry(
                        entry,
                        profileUsername,
                        authenticatedUsername
                        );

                    if (remove) {
                        rememberTimelineEntryTweetIds(
                            entry,
                            rememberedTweetIds
                        );
                    }

                    return !remove;
                });

            if (filteredEntries.length !== entries.length) {
                instruction.entries = filteredEntries;
                changed = true;
            }
        }

        return changed;
    }

    function filterAllTimelineResponse(
        xhr,
        value,
        property
    ) {
        if (
            !String(xhr.__rtUrl || '').includes(
                'UserTweetsAndReplies'
            )
        ) {
            return value;
        }

        if (typeof value === 'string') {
            const cacheKey =
                property === 'responseText'
                    ? '__allFilteredResponseText'
                    : '__allFilteredResponse';

            if (
                Object.prototype.hasOwnProperty.call(
                    xhr,
                    cacheKey
                )
            ) {
                return xhr[cacheKey];
            }

            try {
                const json = JSON.parse(value);

                xhr[cacheKey] =
                    filterAllTimelineJson(json)
                        ? JSON.stringify(json)
                        : value;

                return xhr[cacheKey];
            }
            catch (e) {
                return value;
            }
        }

        if (value && typeof value === 'object') {
            filterAllTimelineJson(value);
        }

        return value;
    }

    const RepostXHR =
        pageWindow.XMLHttpRequest;

    function installAllTimelineResponseFilter(
        property
    ) {
        try {
            const descriptor =
                Object.getOwnPropertyDescriptor(
                    RepostXHR.prototype,
                    property
                );

            if (
                !descriptor?.get ||
                descriptor.configurable === false
            ) {
                return false;
            }

            Object.defineProperty(
                RepostXHR.prototype,
                property,
                {
                    configurable:
                        descriptor.configurable,
                    enumerable:
                        descriptor.enumerable,
                    get: function () {
                        return filterAllTimelineResponse(
                            this,
                            descriptor.get.call(this),
                            property
                        );
                    },
                    set: descriptor.set
                }
            );

            return true;
        }
        catch (e) {
            return false;
        }
    }

    if (RepostXHR) {

        installAllTimelineResponseFilter(
            'response'
        );

        installAllTimelineResponseFilter(
            'responseText'
        );

        const originalRepostOpen =
            RepostXHR.prototype.open;

        RepostXHR.prototype.open =
            function (
                method,
                url,
                ...rest
            ) {
                this.__rtUrl =
                    url;

                return originalRepostOpen.call(
                    this,
                    method,
                    url,
                    ...rest
                );
            };

        const originalRepostSend =
            RepostXHR.prototype.send;

        RepostXHR.prototype.send =
            function (...args) {

                if (
                    typeof this.__rtUrl ===
                        'string' &&
                    isTimelineRequest(
                        this.__rtUrl
                    )
                ) {
                    this.addEventListener(
                        'load',
                        () => {
                            try {
                                let json = null;

                                if (
                                    this.responseType ===
                                        'json' &&
                                    this.response
                                ) {
                                    json =
                                        this.response;
                                }
                                else if (
                                    typeof this.response ===
                                        'string' &&
                                    this.response
                                ) {
                                    json =
                                        JSON.parse(
                                            this.response
                                        );
                                }
                                else if (
                                    typeof this.responseText ===
                                        'string' &&
                                    this.responseText
                                ) {
                                    json =
                                        JSON.parse(
                                            this.responseText
                                        );
                                }

                                if (json) {
                                    scanRepostObject(
                                        json
                                    );
                                }

                            } catch (e) {}
                        }
                    );
                }

                return originalRepostSend.apply(
                    this,
                    args
                );
            };
    }

    const RepostFetch =
        pageWindow.fetch;

    if (typeof RepostFetch === 'function') {
        pageWindow.fetch =
            async function (...args) {
                const response =
                    await RepostFetch.apply(
                        this,
                        args
                    );

                const requestUrl =
                    typeof args[0] === 'string'
                        ? args[0]
                        : args[0]?.url || '';

                if (
                    !String(requestUrl).includes(
                        'UserTweetsAndReplies'
                    )
                ) {
                    return response;
                }

                return new Proxy(
                    response,
                    {
                        get: function (
                            target,
                            property
                        ) {
                            if (property === 'json') {
                                return async function () {
                                    const json =
                                        await target.json();

                                    filterAllTimelineJson(json);

                                    return json;
                                };
                            }

                            if (property === 'text') {
                                return async function () {
                                    const text =
                                        await target.text();

                                    try {
                                        const json =
                                            JSON.parse(text);

                                        return filterAllTimelineJson(
                                            json
                                        )
                                            ? JSON.stringify(json)
                                            : text;
                                    }
                                    catch (e) {
                                        return text;
                                    }
                                };
                            }

                            const value =
                                Reflect.get(
                                    target,
                                    property,
                                    target
                                );

                            return typeof value === 'function'
                                ? value.bind(target)
                                : value;
                        }
                    }
                );
            };
    }

    setInterval(
        refreshRepostTimestamps,
        1000
    );

    // ============================================================
    // React onClick handler
    // ============================================================

    function findReactClickHandler(element) {
        let node = element;

        for (
            let level = 0;
            level < 6 &&
            node &&
            node !== document.body;
            level++
        ) {
            const keys =
                Object.keys(node);

            for (const key of keys) {
                if (
                    key.indexOf(
                        '__reactProps'
                    ) !== 0
                ) {
                    continue;
                }

                try {
                    const props =
                        node[key];

                    if (
                        props &&
                        typeof props.onClick ===
                            'function'
                    ) {
                        return {
                            handler:
                                props.onClick,

                            element:
                                node
                        };
                    }

                } catch (e) {}
            }

            node =
                node.parentElement;
        }

        return null;
    }

    function invokeReactCtrlShift(link) {
        const found =
            findReactClickHandler(link);

        if (!found) {
            return false;
        }

        const fakeEvent = {
            type: 'click',

            target: link,
            currentTarget:
                found.element,

            ctrlKey: true,
            shiftKey: true,
            metaKey: false,
            altKey: false,

            button: 0,
            buttons: 1,

            defaultPrevented: false,

            preventDefault() {
                this.defaultPrevented = true;
            },

            stopPropagation() {},
            stopImmediatePropagation() {},
            persist() {},

            nativeEvent: {
                ctrlKey: true,
                shiftKey: true,
                metaKey: false,
                altKey: false,
                button: 0
            }
        };

        try {
            found.handler(fakeEvent);
            return true;

        } catch (e) {
            return false;
        }
    }

    // ============================================================
    // Link click handling
    // ============================================================

    document.addEventListener(
        'click',
        function (event) {
            const directSearchUser =
                event.target.closest?.(
                    '[data-testid="TypeaheadUser"]'
                );

            const recentSearchItem =
                event.target.closest?.(
                    '[data-testid="typeaheadRecentSearchesItem"]'
                );

            const recentSearchUser =
                recentSearchItem
                    ? event.target.closest?.(
                        '[data-testid="UserCell"]'
                    )
                    : null;

            const userCell =
                directSearchUser ||
                recentSearchUser;

            if (userCell) {
                const clickedButton =
                    event.target.closest?.(
                        'button'
                    );

                if (
                    !clickedButton ||
                    clickedButton === userCell
                ) {
                    const username =
                        getUsernameFromUserCell(
                            userCell
                        );

                    if (username) {
                        event.preventDefault();
                        event.stopImmediatePropagation();

                        navigate(
                            '/' +
                            username +
                            '/all'
                        );

                        return;
                    }
                }
            }

            // ====================================================
            // Native Photos / Videos popup menu
            // ====================================================

            const mediaMenuItem =
                event.target.closest?.(
                    '[role="menuitem"]'
                );

            if (
                mediaMenuItem &&
                isEnabled(
                    userSettings.openMediaFromPhoto
                ) &&
                /^\/[^/]+\/media\/?$/.test(
                    location.pathname
                )
            ) {
                const currentFilter =
                    new URL(location.href)
                        .searchParams
                        .get('filter');

                const isCurrentItem = Boolean(
                    mediaMenuItem.querySelector('svg') ||
                    mediaMenuItem.getAttribute(
                        'aria-checked'
                    ) === 'true' ||
                    mediaMenuItem.getAttribute(
                        'aria-selected'
                    ) === 'true'
                );

                let selectedFilter = null;

                if (
                    currentFilter === 'photo' ||
                    currentFilter === 'video'
                ) {
                    selectedFilter =
                        isCurrentItem
                            ? currentFilter
                            : currentFilter === 'photo'
                                ? 'video'
                                : 'photo';
                }

                if (selectedFilter) {
                    const mediaPath =
                        location.pathname.replace(/\/$/, '');

            	  // ====================================================
                    setTimeout(
                        function () {
                            navigate(
                                mediaPath,
                                '?filter=' + selectedFilter
                            );
                        },
                        0
                    );

                    return;
                }
            }

            const link =
                event.target.closest?.(
                    'a[href]'
                );

            if (!link) {
                return;
            }

            const url =
                new URL(
                    link.href,
                    location.origin
                );

            if (
                url.origin !== location.origin
            ) {
                return;
            }

            const path =
                url.pathname.replace(
                    /\/$/,
                    ''
                );

            const ctrlShift =
                event.ctrlKey &&
                event.shiftKey;

            // ====================================================
            // Media
            // ====================================================

            if (
                /^\/[^/]+\/media$/.test(path)
            ) {
                const currentMediaPath =
                    location.pathname.replace(
                        /\/$/,
                        ''
                    );

                const currentFilter =
                    new URL(location.href)
                        .searchParams
                        .get('filter');

   	   // ============================================================

                if (
                    !ctrlShift &&
                    isEnabled(
                        userSettings.openMediaFromPhoto
                    ) &&
                    /^\/[^/]+\/media$/.test(
                        currentMediaPath
                    ) &&
                    (
                        currentFilter === 'photo' ||
                        currentFilter === 'video'
                    )
                ) {
                    return;
                }

                event.preventDefault();
                event.stopImmediatePropagation();

                tryPatchFeatureSwitch();

                if (ctrlShift) {
                    if (
                        currentFilter === 'photo'
                    ) {
                        navigate(
                            path,
                            '?filter=video'
                        );

                        return;
                    }

                    if (
                        currentFilter === 'video'
                    ) {
                        navigate(
                            path,
                            '?filter=photo'
                        );

                        return;
                    }

                    navigate(
                        path,
                        '?filter=photo'
                    );

                    return;
                }

                // Normal click → selected default Media view
                if (
                    isEnabled(
                        userSettings.openMediaFromPhoto
                    )
                ) {
                    navigate(
                        path,
                        '?filter=photo'
                    );
                } else {
                    navigate(path);
                }

                return;
            }

            // ====================================================
            // Profile / Posts
            // ====================================================

            const profileMatch =
                path.match(
                    /^\/([^/]+)$/
                );

            if (!profileMatch) {
                return;
            }

            const username =
                profileMatch[1];

            if (
                excludedPaths.has(
                    username.toLowerCase()
                )
            ) {
                return;
            }

            if (
                !isEnabled(
                    userSettings.openProfileFromAll
                )
            ) {
                return;
            }

            const profilePath =
                '/' + username;

            const allPath =
                profilePath + '/all';

            const tabList =
                link.closest(
                    '[role="tablist"]'
                );

            // ----------------------------------------------------
            // Posts tab at the top of the profile
            // ----------------------------------------------------

            if (tabList) {
                const currentPath =
                    location.pathname.replace(
                        /\/$/,
                        ''
                    );

                if (ctrlShift) {
                    //
                    if (
                        currentPath ===
                            profilePath ||
                        currentPath ===
                            allPath
                    ) {
                        return;
                    }

                    //
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    navigate(profilePath);

                    return;
                }

                //
                if (
                    currentPath ===
                        profilePath ||
                    currentPath ===
                        allPath
                ) {
                    return;
                }

                //
                event.preventDefault();
                event.stopImmediatePropagation();

                navigate(allPath);

                return;
            }

            // ----------------------------------------------------
            // Regular profile links
            // ----------------------------------------------------

            if (ctrlShift) {
                event.preventDefault();
                event.stopImmediatePropagation();

                navigate(profilePath);

                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();

            navigate(allPath);
        },
        true
    );

    // ============================================================

    const hiddenOtherMentionClass =
        'x-hidden-other-mention';

    const hideOtherMentionsActiveClass =
        'x-hide-other-mentions-active';

    const hiddenAllReplyLinkClass =
        'x-hidden-all-reply-link';

    const allConversationEndClass =
        'x-all-conversation-end';

    const allConversationStartClass =
        'x-all-conversation-start';

    const hiddenReplyMarkerClass =
        'x-hidden-reply-marker';

    const hiddenOtherMentionStyle =
        document.createElement('style');

    hiddenOtherMentionStyle.textContent =
        `.${hideOtherMentionsActiveClass} ` +
        `.${hiddenOtherMentionClass},` +
        `.${hideOtherMentionsActiveClass} ` +
        `.${hiddenAllReplyLinkClass}{` +
        'display:none!important;}' +
        `.${allConversationEndClass}{` +
        'border-bottom:1px solid rgba(127,127,127,.35)!important;' +
        'box-sizing:border-box;}' +
        `.${allConversationStartClass}{` +
        'border-top:1px solid rgba(127,127,127,.35)!important;' +
        'box-sizing:border-box;}';

    (document.head || document.documentElement)
        .appendChild(hiddenOtherMentionStyle);

    function refreshRememberedAllCell(
        cell,
        rememberedTweetIds
    ) {
        const shouldHide =
            Array.from(
                cell.querySelectorAll(
                    'a[href*="/status/"]'
                )
            ).some(link => {
                const tweetId =
                    link
                        .getAttribute('href')
                        ?.match(/\/status\/(\d+)/)?.[1];

                return tweetId &&
                    rememberedTweetIds.has(tweetId);
            });

        cell.classList.toggle(
            hiddenOtherMentionClass,
            Boolean(shouldHide)
        );

        const marker =
            cell.querySelector(
                '.' + hiddenReplyMarkerClass
            );

        const currentTweetId =
            cell.querySelector(
                'article[data-testid="tweet"] ' +
                'time[datetime]'
            )?.closest(
                'a[href*="/status/"]'
            )?.getAttribute('href')
                ?.match(/\/status\/(\d+)/)?.[1];

        if (
            marker &&
            currentTweetId &&
            marker.dataset.tweetId !==
                currentTweetId
        ) {
            marker.remove();
        }
    }

    const hiddenAllCellObserver =
        new MutationObserver(function (records) {
            const match =
                location.pathname.match(
                    /^\/([A-Za-z0-9_]{1,15})\/all\/?$/
                );

            if (
                !match ||
                !isEnabled(
                    userSettings.hideOtherMentionsInAll
                )
            ) {
                return;
            }

            const authenticatedUsername =
                getAuthenticatedUsername()
                    .toLowerCase();

            if (!authenticatedUsername) {
                return;
            }

            const rememberedTweetIds =
                getHiddenAllTweetIds(
                    match[1].toLowerCase(),
                    authenticatedUsername
                );

            const cells = new Set();

            for (const record of records) {
                const targetCell =
                    record.target
                        ?.closest?.(
                            '[data-testid="cellInnerDiv"]'
                        );

                if (targetCell) {
                    cells.add(targetCell);
                }

                for (const node of record.addedNodes) {
                    if (node.nodeType !== 1) {
                        continue;
                    }

                    const addedCell =
                        node.matches(
                            '[data-testid="cellInnerDiv"]'
                        )
                            ? node
                            : node.closest(
                                '[data-testid="cellInnerDiv"]'
                            );

                    if (addedCell) {
                        cells.add(addedCell);
                    }

                    for (const cell of
                        node.querySelectorAll(
                            '[data-testid="cellInnerDiv"]'
                        )) {
                        cells.add(cell);
                    }
                }
            }

            for (const cell of cells) {
                refreshRememberedAllCell(
                    cell,
                    rememberedTweetIds
                );
            }
        });

    hiddenAllCellObserver.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['href']
        }
    );

    function getAuthenticatedUsername() {
        let userId = '';

        const cookieMatch =
            document.cookie.match(
                /(?:^|;\s*)twid=([^;]+)/
            );

        if (cookieMatch) {
            try {
                userId =
                    decodeURIComponent(cookieMatch[1])
                        .match(/(?:^|\D)(\d{5,})(?:\D|$)/)?.[1] || '';
            }
            catch (e) {}
        }

        const profileLink =
            document.querySelector(
                'a[data-testid="AppTabBar_Profile_Link"][href]'
            );

        const profileMatch =
            profileLink
                ?.getAttribute('href')
                ?.match(
                    /^\/([A-Za-z0-9_]{1,15})\/?$/
                );

        if (profileMatch) {
            if (userId) {
                try {
                    localStorage.setItem(
                        'x-default-all-login-username-' + userId,
                        profileMatch[1]
                    );
                }
                catch (e) {}
            }

            return profileMatch[1];
        }

        const accountAvatar =
            document.querySelector(
                '[data-testid="SideNav_AccountSwitcher_Button"] ' +
                '[data-testid^="UserAvatar-Container-"]'
            );

        const accountUsername =
            accountAvatar
                ?.getAttribute('data-testid')
                ?.replace(
                    'UserAvatar-Container-',
                    ''
                ) || '';

        if (
            /^[A-Za-z0-9_]{1,15}$/.test(
                accountUsername
            )
        ) {
            if (userId) {
                try {
                    localStorage.setItem(
                        'x-default-all-login-username-' + userId,
                        accountUsername
                    );
                }
                catch (e) {}
            }

            return accountUsername;
        }

        if (!userId) {
            return '';
        }

        const responseUsername =
            usernamesById.get(userId) || '';

        if (responseUsername) {
            try {
                localStorage.setItem(
                    'x-default-all-login-username-' + userId,
                    responseUsername
                );
            }
            catch (e) {}

            return responseUsername;
        }

        try {
            return (
                localStorage.getItem(
                    'x-default-all-login-username-' + userId
                ) ||
                localStorage.getItem(
                    'x-analytics-login-username-' + userId
                ) ||
                ''
            );
        }
        catch (e) {}

        return '';
    }

    let lastAllTimelineScrollAt = 0;

    let lastAllTimelineInputAt = 0;

    let correctingAllTimelineScroll = false;

    window.addEventListener(
        'scroll',
        function () {
            if (!correctingAllTimelineScroll) {
                lastAllTimelineScrollAt = Date.now();
            }
        },
        true
    );

    for (const type of [
        'wheel',
        'touchmove',
        'pointerdown'
    ]) {
        window.addEventListener(
            type,
            function () {
                lastAllTimelineInputAt = Date.now();
            },
            {
                capture: true,
                passive: true
            }
        );
    }

    window.addEventListener(
        'keydown',
        function (event) {
            if (
                [
                    'ArrowUp',
                    'ArrowDown',
                    'PageUp',
                    'PageDown',
                    'Home',
                    'End',
                    ' '
                ].includes(event.key)
            ) {
                lastAllTimelineInputAt = Date.now();
            }
        },
        true
    );

    function restoreAllTimelineAnchor(
        anchor,
        anchorTop,
        inputAt
    ) {
        const restore = function () {
            if (
                !anchor?.isConnected ||
                lastAllTimelineInputAt !== inputAt ||
                !/^\/[A-Za-z0-9_]{1,15}\/all\/?$/.test(
                    location.pathname
                )
            ) {
                return;
            }

            const currentTop =
                anchor.getBoundingClientRect().top;

            const difference =
                currentTop - anchorTop;

            if (
                !Number.isFinite(difference) ||
                Math.abs(difference) < 1
            ) {
                return;
            }

            correctingAllTimelineScroll = true;

            window.scrollBy(0, difference);

            requestAnimationFrame(function () {
                correctingAllTimelineScroll = false;
            });
        };

        requestAnimationFrame(function () {
            requestAnimationFrame(restore);
        });

        setTimeout(restore, 100);
        setTimeout(restore, 250);
    }

    function refreshOtherMentionsInAll() {
        const hiddenCells =
            document.querySelectorAll(
                '.' + hiddenOtherMentionClass
            );

        const hiddenReplyLinkCells =
            document.querySelectorAll(
                '.' + hiddenAllReplyLinkClass
            );

        const conversationBoundaryCells =
            document.querySelectorAll(
                '.' + allConversationEndClass + ',' +
                '.' + allConversationStartClass
            );

        const hiddenReplyMarkers =
            document.querySelectorAll(
                '.' + hiddenReplyMarkerClass
            );

        const match =
            location.pathname.match(
                /^\/([A-Za-z0-9_]{1,15})\/all\/?$/
            );

        const active =
            Boolean(match) &&
            isEnabled(
                userSettings.hideOtherMentionsInAll
            );

        document.documentElement.classList.toggle(
            hideOtherMentionsActiveClass,
            active
        );

        if (!active) {
            for (const cell of hiddenCells) {
                cell.classList.remove(
                    hiddenOtherMentionClass
                );
            }

            for (const cell of hiddenReplyLinkCells) {
                cell.classList.remove(
                    hiddenAllReplyLinkClass
                );
            }

            for (const cell of conversationBoundaryCells) {
                cell.classList.remove(
                    allConversationEndClass,
                    allConversationStartClass
                );
            }

            for (const marker of hiddenReplyMarkers) {
                marker.remove();
            }

            return;
        }

        const profileUsername =
            match[1].toLowerCase();

        const authenticatedUsername =
            getAuthenticatedUsername()
                .toLowerCase();

        if (!authenticatedUsername) {
            for (const cell of hiddenCells) {
                cell.classList.remove(
                    hiddenOtherMentionClass
                );
            }

            for (const marker of hiddenReplyMarkers) {
                marker.remove();
            }

            return;
        }

        loadFollowingCache(
            authenticatedUsername
        );

        if (
            Date.now() - lastAllTimelineScrollAt < 180
        ) {
            return;
        }

        const articleData = [];

        const cellsByTweetId =
            new Map();

        for (
            const article of
            document.querySelectorAll(
                'article[data-testid="tweet"]'
            )
        ) {
            const statusLink =
                article.querySelector(
                    'time[datetime]'
                )?.closest(
                    'a[href*="/status/"]'
                );

            const tweetId =
                statusLink
                    ?.getAttribute('href')
                    ?.match(/\/status\/(\d+)/)?.[1];

            const cell =
                article.closest(
                    '[data-testid="cellInnerDiv"]'
                );

            if (tweetId && cell) {
                cellsByTweetId.set(
                    tweetId,
                    cell
                );
            }

            const authorUsername =
                article.querySelector(
                    '[data-testid="User-Name"] a[href]'
                )?.getAttribute('href')
                    ?.match(
                        /^\/([A-Za-z0-9_]{1,15})\/?$/
                    )?.[1]
                    ?.toLowerCase() || '';

            if (tweetId && authorUsername) {
                tweetAuthors.set(
                    tweetId,
                    authorUsername
                );
            }

            articleData.push({
                article,
                tweetId
            });
        }

        const hiddenTweetIds =
            new Set();

        const rememberedTweetIds =
            getHiddenAllTweetIds(
                profileUsername,
                authenticatedUsername
            );

        const rememberedRootTweetIds =
            getMarkedAllRootTweetIds(
                profileUsername,
                authenticatedUsername
            );

        const retainedRootTweetIds =
            new Set(rememberedRootTweetIds);

        for (const tweetId of cellsByTweetId.keys()) {
            if (rememberedTweetIds.has(tweetId)) {
                hiddenTweetIds.add(tweetId);
            }
        }

        for (
            const { article, tweetId } of
            articleData
        ) {
            const authorLink =
                article.querySelector(
                    '[data-testid="User-Name"] a[href]'
                );

            const tweetText =
                article.querySelector(
                    '[data-testid="tweetText"]'
                );

            if (!authorLink || !tweetText) {
                continue;
            }

            const authorMatch =
                authorLink.getAttribute('href')?.match(
                    /^\/([A-Za-z0-9_]{1,15})\/?$/
                );

            if (
                !authorMatch ||
                authorMatch[1].toLowerCase() !==
                    profileUsername
            ) {
                continue;
            }

            const firstTextLink =
                tweetText.querySelector('a[href]');

            const firstTextLinkText =
                firstTextLink?.textContent.trim() || '';

            const directMentionLink =
                firstTextLink &&
                firstTextLinkText.startsWith('@') &&
                tweetText.textContent
                    .trim()
                    .startsWith(firstTextLinkText)
                    ? firstTextLink
                    : null;

            const replyContext =
                tweetText.parentElement
                    ?.previousElementSibling;

            const replyTargetLink =
                replyContext?.querySelector(
                    'a[href^="/"]'
                ) || null;

            const targetLink =
                directMentionLink ||
                replyTargetLink;

            const targetMatch =
                targetLink?.getAttribute('href')?.match(
                    /^\/([A-Za-z0-9_]{1,15})\/?$/
                );

            const mentionText =
                targetLink?.textContent.trim() || '';

            const replyTarget =
                tweetId
                    ? replyTargets.get(tweetId)
                    : null;

            let targetUsername =
                replyTarget ||
                (
                    targetMatch &&
                    mentionText.startsWith('@')
                        ? targetMatch[1]
                        : null
                );

            let normalizedTargetUsername =
                String(targetUsername || '')
                    .toLowerCase();

            if (
                tweetId &&
                (
                    normalizedTargetUsername ===
                        profileUsername ||
                    (
                        authenticatedUsername &&
                        normalizedTargetUsername ===
                            authenticatedUsername
                    )
                )
            ) {
                let ancestorId = tweetId;

                for (
                    let depth = 0;
                    ancestorId && depth < 20;
                    depth++
                ) {
                    ancestorId =
                        replyParentIds.get(ancestorId);

                    if (!ancestorId) {
                        break;
                    }

                    const ancestorTarget = String(
                        replyTargets.get(ancestorId) || ''
                    ).toLowerCase();

                    if (
                        ancestorTarget &&
                        ancestorTarget !== profileUsername &&
                        ancestorTarget !== authenticatedUsername
                    ) {
                        targetUsername = ancestorTarget;
                        normalizedTargetUsername =
                            ancestorTarget;
                        break;
                    }
                }
            }

            if (
                !targetUsername ||
                normalizedTargetUsername ===
                    profileUsername ||
                (
                    authenticatedUsername &&
                    normalizedTargetUsername ===
                        authenticatedUsername
                )
            ) {
                continue;
            }

            if (
                !isEnabled(
                    userSettings.hideFollowedMentionsInAll
                )
            ) {
                if (
                    followingByUsername.get(
                        normalizedTargetUsername
                    ) === true
                ) {
                    continue;
                }

                if (
                    !followingByUsername.has(
                        normalizedTargetUsername
                    )
                ) {
                    requestFollowLookup(
                        normalizedTargetUsername,
                        findFollowLookupLink(
                            normalizedTargetUsername,
                            targetLink
                        )
                    );

                    continue;
                }
            }

            let currentId = tweetId;

            for (
                let depth = 0;
                currentId && depth < 20;
                depth++
            ) {
                if (hiddenTweetIds.has(currentId)) {
                    break;
                }

                hiddenTweetIds.add(currentId);

                const parentId =
                    replyParentIds.get(currentId);

                if (!parentId) {
                    break;
                }

                const parentAuthor =
                    tweetAuthors.get(parentId) || '';

                const parentTarget =
                    String(
                        replyTargets.get(parentId) || ''
                    ).toLowerCase();

                if (
                    parentAuthor === profileUsername &&
                    (
                        !parentTarget ||
                        parentTarget === profileUsername ||
                        parentTarget === authenticatedUsername
                    )
                ) {
                    retainedRootTweetIds.add(parentId);
                    rememberedRootTweetIds.add(parentId);
                    break;
                }

                currentId = parentId;
            }
        }

        for (const hiddenTweetId of rememberedTweetIds) {
            let currentId = hiddenTweetId;

            for (
                let depth = 0;
                currentId && depth < 20;
                depth++
            ) {
                const parentId =
                    replyParentIds.get(currentId);

                if (!parentId) {
                    break;
                }

                const parentAuthor =
                    tweetAuthors.get(parentId) || '';

                const parentTarget =
                    String(
                        replyTargets.get(parentId) || ''
                    ).toLowerCase();

                if (
                    parentAuthor === profileUsername &&
                    (
                        !parentTarget ||
                        parentTarget === profileUsername ||
                        parentTarget === authenticatedUsername
                    )
                ) {
                    retainedRootTweetIds.add(parentId);
                    rememberedRootTweetIds.add(parentId);
                    break;
                }

                currentId = parentId;
            }
        }

        for (const tweetId of hiddenTweetIds) {
            rememberedTweetIds.add(tweetId);
        }

        const desiredHiddenCells =
            new Set();

        for (const tweetId of hiddenTweetIds) {
            const cell =
                cellsByTweetId.get(tweetId);

            if (cell) {
                desiredHiddenCells.add(cell);
            }
        }

        const desiredHiddenReplyLinkCells =
            new Set();

        const desiredConversationEndCells =
            new Set();

        const desiredConversationStartCells =
            new Set();

        for (const tweetId of retainedRootTweetIds) {
            const cell =
                cellsByTweetId.get(tweetId);

            if (cell) {
                desiredConversationEndCells.add(cell);
            }
        }

        const orderedCells =
            Array.from(
                document.querySelectorAll(
                    '[data-testid="cellInnerDiv"]'
                )
            );

        const tweetIdsByCell =
            new Map();

        for (const [tweetId, cell] of cellsByTweetId) {
            tweetIdsByCell.set(cell, tweetId);
        }

        for (const [cell, tweetId] of tweetIdsByCell) {
            const authorUsername =
                tweetAuthors.get(tweetId) || '';

            if (
                !authorUsername ||
                authorUsername === profileUsername ||
                authorUsername === authenticatedUsername
            ) {
                continue;
            }

            const article = cell.querySelector(
                'article[data-testid="tweet"]'
            );

            if (
                !article?.querySelector(
                    '.r-1bnu78o.r-f8sm7e.r-m5arl1' +
                    '.r-16y2uox.r-14gqq1x'
                )
            ) {
                continue;
            }

            if (
                !isEnabled(
                    userSettings.hideFollowedMentionsInAll
                )
            ) {
                if (
                    followingByUsername.get(authorUsername) ===
                        true
                ) {
                    continue;
                }

                if (!followingByUsername.has(authorUsername)) {
                    requestFollowLookup(
                        authorUsername,
                        findFollowLookupLink(
                            authorUsername,
                            article.querySelector(
                                `[href="/${authorUsername}"]`
                            )
                        )
                    );
                    continue;
                }
            }

            hiddenTweetIds.add(tweetId);
            rememberedTweetIds.add(tweetId);
            desiredHiddenCells.add(cell);
        }

        for (
            let index = 0;
            index < orderedCells.length;
            index++
        ) {
            const cell = orderedCells[index];

            const tweetId = tweetIdsByCell.get(cell);

            if (
                !tweetId ||
                tweetAuthors.get(tweetId) !==
                    profileUsername
            ) {
                continue;
            }

            const article = cell.querySelector(
                'article[data-testid="tweet"]'
            );

            if (
                !article?.querySelector(
                    '.r-1bnu78o.r-f8sm7e.r-m5arl1' +
                    '.r-16y2uox.r-14gqq1x'
                )
            ) {
                continue;
            }

            for (
                let nextIndex = index + 1;
                nextIndex < orderedCells.length;
                nextIndex++
            ) {
                const nextCell = orderedCells[nextIndex];

                if (!tweetIdsByCell.has(nextCell)) {
                    continue;
                }

                if (desiredHiddenCells.has(nextCell)) {
                    desiredConversationEndCells.add(cell);
                    rememberedRootTweetIds.add(tweetId);
                }

                break;
            }
        }

        for (
            let index = 0;
            index < orderedCells.length;
            index++
        ) {
            const cell = orderedCells[index];

            if (
                cell.querySelector(
                    'article[data-testid="tweet"]'
                )
            ) {
                continue;
            }

            const rootId =
                cell.querySelector(
                    'a[href^="/i/status/"]'
                )?.getAttribute('href')
                    ?.match(/\/i\/status\/(\d+)/)?.[1];

            if (!rootId) {
                continue;
            }

            let nextTweetCell = null;

            for (
                let nextIndex = index + 1;
                nextIndex < orderedCells.length;
                nextIndex++
            ) {
                if (
                    tweetIdsByCell.has(
                        orderedCells[nextIndex]
                    )
                ) {
                    nextTweetCell =
                        orderedCells[nextIndex];
                    break;
                }
            }

            if (
                !nextTweetCell ||
                !desiredHiddenCells.has(nextTweetCell)
            ) {
                continue;
            }

            desiredHiddenReplyLinkCells.add(cell);

            const rootCell =
                cellsByTweetId.get(rootId);

            const rootAuthor =
                tweetAuthors.get(rootId) || '';

            if (
                rootCell &&
                rootAuthor !== profileUsername
            ) {
                desiredHiddenCells.add(rootCell);
                rememberedTweetIds.add(rootId);

                for (
                    let nextIndex = index + 1;
                    nextIndex < orderedCells.length;
                    nextIndex++
                ) {
                    const nextCell =
                        orderedCells[nextIndex];

                    if (
                        tweetIdsByCell.has(nextCell) &&
                        !desiredHiddenCells.has(nextCell)
                    ) {
                        desiredConversationStartCells.add(
                            nextCell
                        );
                        break;
                    }
                }
            }
            else if (rootCell) {
                desiredConversationEndCells.add(
                    rootCell
                );
                rememberedRootTweetIds.add(rootId);
            }
        }

        for (const cell of hiddenReplyLinkCells) {
            if (!desiredHiddenReplyLinkCells.has(cell)) {
                cell.classList.remove(
                    hiddenAllReplyLinkClass
                );
            }
        }

        for (const cell of desiredHiddenReplyLinkCells) {
            cell.classList.add(
                hiddenAllReplyLinkClass
            );
        }

        for (const cell of conversationBoundaryCells) {
            if (!desiredConversationEndCells.has(cell)) {
                cell.classList.remove(
                    allConversationEndClass
                );
            }

            if (!desiredConversationStartCells.has(cell)) {
                cell.classList.remove(
                    allConversationStartClass
                );
            }
        }

        for (const cell of desiredConversationEndCells) {
            cell.classList.add(
                allConversationEndClass
            );
        }

        for (const cell of desiredConversationStartCells) {
            cell.classList.add(
                allConversationStartClass
            );
        }

        const showHiddenReplyMarker =
            isEnabled(
                userSettings.showHiddenReplyMarker
            );

        for (const marker of hiddenReplyMarkers) {
            const cell = marker.closest(
                '[data-testid="cellInnerDiv"]'
            );

            if (
                !showHiddenReplyMarker ||
                !desiredConversationEndCells.has(cell)
            ) {
                marker.remove();
            }
        }

        if (showHiddenReplyMarker) {
            for (const cell of desiredConversationEndCells) {
                const article = cell.querySelector(
                    'article[data-testid="tweet"]'
                );

                const avatar = article?.querySelector(
                    '[data-testid^="UserAvatar-Container-"]'
                );

                const statusLink = article?.querySelector(
                    'time[datetime]'
                )?.closest('a[href*="/status/"]');

                const tweetId = statusLink
                    ?.getAttribute('href')
                    ?.match(/\/status\/(\d+)/)?.[1];

                if (!avatar || !tweetId) {
                    continue;
                }

                let marker = cell.querySelector(
                    '.' + hiddenReplyMarkerClass
                );

                if (!marker) {
                    marker = document.createElement('div');
                    marker.className = hiddenReplyMarkerClass;
                    marker.innerHTML =
                        '<svg viewBox="0 -960 960 960" ' +
                        'aria-hidden="true" style="width:18px;' +
                        'height:18px;display:block;fill:currentColor;' +
                        'flex:0 0 18px">' +
                        '<path d="M480-360 280-560h400L480-360Z"/>' +
                        '</svg>';
                    cell.appendChild(marker);
                }

                const cellRect =
                    cell.getBoundingClientRect();

                const avatarRect =
                    avatar.getBoundingClientRect();

                const quoteWrapper = article.querySelector(
                    '.x-tweet-direct-buttons' +
                    '[data-mobile-slot="quotes"]' +
                    '[data-below-avatar="true"]'
                );

                const quoteRect = quoteWrapper
                    ?.getBoundingClientRect();

                const markerTop = quoteRect
                    ? quoteRect.bottom - cellRect.top + 3
                    : avatarRect.bottom - cellRect.top + 1;

                marker.dataset.tweetId = tweetId;
                marker.style.cssText = `
                    position: absolute;
                    left: ${
                        avatarRect.left -
                        cellRect.left +
                        avatarRect.width / 2 - 8
                    }px;
                    top: ${markerTop}px;
                    z-index: 3;
                    width: 16px;
                    height: 16px;
                    padding: 0;
                    border: 0;
                    border-radius: 50%;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: visible;
                    background: ${
                        isLightTheme()
                            ? '#ffffff'
                            : '#000000'
                    };
                    color: ${getAccentColor()};
                    pointer-events: none;
                `;
            }
        }

        const cellsToShow =
            Array.from(hiddenCells).filter(
                cell => !desiredHiddenCells.has(cell)
            );

        const cellsToHide =
            Array.from(desiredHiddenCells).filter(
                cell => !cell.classList.contains(
                    hiddenOtherMentionClass
                )
            );

        if (!cellsToShow.length && !cellsToHide.length) {
            return;
        }

        const anchor =
            Array.from(
                new Set(cellsByTweetId.values())
            ).map(cell => ({
                cell,
                rect: cell.getBoundingClientRect()
            })).filter(item =>
                !desiredHiddenCells.has(item.cell) &&
                item.rect.height > 0 &&
                item.rect.bottom > 0 &&
                item.rect.top < window.innerHeight
            ).sort((left, right) =>
                left.rect.top - right.rect.top
            )[0] || null;

        const inputAt =
            lastAllTimelineInputAt;

        for (const cell of cellsToShow) {
            cell.classList.remove(
                hiddenOtherMentionClass
            );
        }

        for (const cell of cellsToHide) {
            cell.classList.add(
                hiddenOtherMentionClass
            );
        }

        if (anchor) {
            restoreAllTimelineAnchor(
                anchor.cell,
                anchor.rect.top,
                inputAt
            );
        }
    }

    // ============================================================

    const hiddenHomeMentionClass =
        'x-hidden-home-mention';

    const hideHomeMentionsActiveClass =
        'x-hide-home-mentions-active';

    const automaticHoverLookupClass =
        'x-automatic-hover-lookup';

    const automaticHoverLinkClass =
        'x-automatic-hover-link';

    const rememberedHiddenHomeTweetIds =
        new Set();

    let pendingFollowLookup = null;

    let hoverMaskReleaseTimer = null;

    const followLookupAttempts =
        new Map();

    document.addEventListener(
        'click',
        function (event) {
            const button =
                event.target.closest?.(
                    '[data-testid$="-follow"], ' +
                    '[data-testid$="-unfollow"]'
                );

            if (!button) {
                return;
            }

            const avatar =
                button.closest(
                    '[data-testid="hoverCardParent"]'
                )?.querySelector(
                    '[data-testid^="UserAvatar-Container-"]' +
                    ':not([data-testid="UserAvatar-Container-unknown"])'
                );

            const avatarUsername =
                avatar
                    ?.getAttribute('data-testid')
                    ?.replace(
                        'UserAvatar-Container-',
                        ''
                    ) || '';

            const testId =
                button.getAttribute('data-testid') || '';

            const userKey =
                testId.replace(
                    /-(?:un)?follow$/,
                    ''
                );

            const pathUsername =
                location.pathname.match(
                    /^\/([A-Za-z0-9_]{1,15})(?:\/|$)/
                )?.[1] || '';

            const profileUsername =
                pathUsername &&
                !excludedPaths.has(
                    pathUsername.toLowerCase()
                )
                    ? pathUsername
                    : '';

            const username =
                avatarUsername ||
                usernamesById.get(userKey) ||
                profileUsername ||
                (
                    /^[A-Za-z0-9_]{1,15}$/.test(userKey)
                        ? userKey
                        : ''
                );

            if (
                !/^[A-Za-z0-9_]{1,15}$/.test(username)
            ) {
                return;
            }

            const normalizedUsername =
                username.toLowerCase();

            const following =
                testId.endsWith('-follow');

            followingByUsername.set(
                normalizedUsername,
                following
            );

            rememberedHiddenHomeTweetIds.clear();

            hiddenAllTweetIdsByContext.clear();
            markedAllRootTweetIdsByContext.clear();

            saveFollowingCache(
                getAuthenticatedUsername()
                    .toLowerCase(),
                normalizedUsername,
                following
            );

            followLookupAttempts.delete(
                normalizedUsername
            );
        },
        true
    );

    hiddenOtherMentionStyle.textContent +=
        `.${hideHomeMentionsActiveClass} ` +
        `.${hiddenHomeMentionClass}{display:none!important;}` +
        `.${automaticHoverLookupClass} ` +
        '[data-testid="hoverCardParent"]{' +
        'visibility:hidden!important;' +
        'pointer-events:none!important;}' +
        `.${automaticHoverLinkClass},` +
        `.${automaticHoverLinkClass} *{` +
        'text-decoration:none!important;}';

    function refreshRememberedHomeCell(cell) {
        const active =
            /^\/home\/?$/.test(location.pathname) &&
            isEnabled(
                userSettings.hideUnfollowedMentionsInHome
            );

        if (!active) {
            cell.classList.remove(
                hiddenHomeMentionClass
            );

            return;
        }

        const tweetId =
            cell.querySelector(
                'article[data-testid="tweet"] ' +
                'a[href*="/status/"] time[datetime]'
            )?.closest('a')
                ?.getAttribute('href')
                ?.match(/\/status\/(\d+)/)?.[1];

        cell.classList.toggle(
            hiddenHomeMentionClass,
            Boolean(
                tweetId &&
                rememberedHiddenHomeTweetIds.has(tweetId)
            )
        );
    }

    const hiddenHomeCellObserver =
        new MutationObserver(function (records) {
            const cells = new Set();

            for (const record of records) {
                const targetCell =
                    record.target?.closest?.(
                        '[data-testid="cellInnerDiv"]'
                    );

                if (targetCell) {
                    cells.add(targetCell);
                }

                for (const node of record.addedNodes) {
                    if (!(node instanceof Element)) {
                        continue;
                    }

                    const addedCell =
                        node.matches(
                            '[data-testid="cellInnerDiv"]'
                        )
                            ? node
                            : node.closest(
                                '[data-testid="cellInnerDiv"]'
                            );

                    if (addedCell) {
                        cells.add(addedCell);
                    }

                    for (const cell of
                        node.querySelectorAll(
                            '[data-testid="cellInnerDiv"]'
                        )) {
                        cells.add(cell);
                    }
                }
            }

            for (const cell of cells) {
                refreshRememberedHomeCell(cell);
            }
        });

    hiddenHomeCellObserver.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true
        }
    );

    function scheduleHoverMaskRelease() {
        if (hoverMaskReleaseTimer) {
            clearTimeout(
                hoverMaskReleaseTimer
            );
        }

        const startedAt =
            Date.now();

        const release = function () {
            if (pendingFollowLookup) {
                hoverMaskReleaseTimer = null;
                return;
            }

            if (
                document.querySelector(
                    '[data-testid="hoverCardParent"]'
                ) &&
                Date.now() - startedAt < 2000
            ) {
                hoverMaskReleaseTimer =
                    setTimeout(release, 100);

                return;
            }

            document.documentElement.classList.remove(
                automaticHoverLookupClass
            );

            hoverMaskReleaseTimer = null;
        };

        hoverMaskReleaseTimer =
            setTimeout(release, 100);
    }

    function finishFollowLookup() {
        const lookup =
            pendingFollowLookup;

        pendingFollowLookup = null;

        if (lookup?.link) {
            lookup.link.classList.remove(
                automaticHoverLinkClass
            );

            for (const type of [
                'pointerout',
                'mouseout',
                'mouseleave'
            ]) {
                try {
                    lookup.link.dispatchEvent(
                        new MouseEvent(type, {
                            bubbles: type !== 'mouseleave',
                            cancelable: true
                        })
                    );
                }
                catch (e) {}
            }
        }

        scheduleHoverMaskRelease();
    }

    function collectHoverCardRelationship() {
        for (
            const card of
            document.querySelectorAll(
                '[data-testid="hoverCardParent"]'
            )
        ) {
            const button =
                card.querySelector(
                    '[data-testid$="-follow"], ' +
                    '[data-testid$="-unfollow"]'
                );

            if (!button) {
                continue;
            }

            const avatar =
                Array.from(
                    card.querySelectorAll(
                        '[data-testid^="UserAvatar-Container-"]'
                    )
                ).find(element => {
                    const value =
                        element.getAttribute('data-testid') || '';

                    return value !==
                        'UserAvatar-Container-unknown';
                });

            const username =
                avatar
                    ?.getAttribute('data-testid')
                    ?.replace(
                        'UserAvatar-Container-',
                        ''
                    ) || '';

            if (
                !/^[A-Za-z0-9_]{1,15}$/.test(
                    username
                )
            ) {
                continue;
            }

            const testId =
                button.getAttribute('data-testid') || '';

            const normalizedUsername =
                username.toLowerCase();

            const following =
                testId.endsWith('-unfollow');

            if (
                !followingCachedUsernames.has(
                    normalizedUsername
                )
            ) {
                followingByUsername.set(
                    normalizedUsername,
                    following
                );

                saveFollowingCache(
                    getAuthenticatedUsername()
                        .toLowerCase(),
                    normalizedUsername,
                    following
                );

                hiddenAllTweetIdsByContext.clear();
                markedAllRootTweetIdsByContext.clear();
            }

            if (
                pendingFollowLookup &&
                pendingFollowLookup.username ===
                    username.toLowerCase()
            ) {
                finishFollowLookup();
            }
        }
    }

    function requestFollowLookup(username, link) {
        if (
            pendingFollowLookup ||
            !link ||
            !link.isConnected ||
            document.querySelector(
                '[data-testid="hoverCardParent"]'
            )
        ) {
            return;
        }

        const attempts =
            followLookupAttempts.get(username) || 0;

        if (attempts >= 2) {
            return;
        }

        followLookupAttempts.set(
            username,
            attempts + 1
        );

        if (hoverMaskReleaseTimer) {
            clearTimeout(
                hoverMaskReleaseTimer
            );

            hoverMaskReleaseTimer = null;
        }

        pendingFollowLookup = {
            username,
            link,
            startedAt: Date.now()
        };

        document.documentElement.classList.add(
            automaticHoverLookupClass
        );

        link.classList.add(
            automaticHoverLinkClass
        );

        for (const type of [
            'pointerover',
            'mouseover',
            'mouseenter'
        ]) {
            try {
                link.dispatchEvent(
                    new MouseEvent(type, {
                        bubbles: type !== 'mouseenter',
                        cancelable: true
                    })
                );
            }
            catch (e) {
                finishFollowLookup();
                break;
            }
        }
    }

    function refreshFollowLookup() {
        collectHoverCardRelationship();

        const allLookupActive =
            /^\/[A-Za-z0-9_]{1,15}\/all\/?$/.test(
                location.pathname
            ) &&
            isEnabled(
                userSettings.hideOtherMentionsInAll
            ) &&
            !isEnabled(
                userSettings.hideFollowedMentionsInAll
            );

        if (
            pendingFollowLookup &&
            (
                (
                    !/^\/home\/?$/.test(
                        location.pathname
                    ) &&
                    !allLookupActive
                ) ||
                Date.now() -
                    pendingFollowLookup.startedAt >
                    1800
            )
        ) {
            finishFollowLookup();
        }
    }

    function findFollowLookupLink(
        username,
        preferredLink
    ) {
        const expected =
            '/' + username.toLowerCase();

        if (
            preferredLink
                ?.getAttribute('href')
                ?.toLowerCase() === expected
        ) {
            return preferredLink;
        }

        return Array.from(
            document.querySelectorAll('a[href]')
        ).find(link =>
            link.getAttribute('href')
                ?.toLowerCase() === expected
        ) || null;
    }

    function refreshUnfollowedMentionsInHome() {
        const hiddenCells =
            document.querySelectorAll(
                '.' + hiddenHomeMentionClass
            );

        const active =
            /^\/home\/?$/.test(
                location.pathname
            ) &&
            isEnabled(
                userSettings.hideUnfollowedMentionsInHome
            );

        document.documentElement.classList.toggle(
            hideHomeMentionsActiveClass,
            active
        );

        if (!active) {
            rememberedHiddenHomeTweetIds.clear();

            for (const cell of hiddenCells) {
                cell.classList.remove(
                    hiddenHomeMentionClass
                );
            }

            return;
        }

        const authenticatedUsername =
            getAuthenticatedUsername()
                .toLowerCase();

        if (!authenticatedUsername) {
            for (const cell of hiddenCells) {
                cell.classList.remove(
                    hiddenHomeMentionClass
                );
            }

            return;
        }

        loadFollowingCache(
            authenticatedUsername
        );

        const articleData = [];

        const cellsByTweetId =
            new Map();

        for (
            const article of
            document.querySelectorAll(
                'article[data-testid="tweet"]'
            )
        ) {
            const statusLink =
                article.querySelector(
                    'time[datetime]'
                )?.closest(
                    'a[href*="/status/"]'
                );

            const statusMatch =
                statusLink
                    ?.getAttribute('href')
                    ?.match(
                        /^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/
                    );

            const tweetId =
                statusMatch?.[2];

            const authorUsername =
                statusMatch?.[1]
                    ?.toLowerCase() || '';

            const cell =
                article.closest(
                    '[data-testid="cellInnerDiv"]'
                );

            if (tweetId && cell) {
                cellsByTweetId.set(
                    tweetId,
                    cell
                );
            }

            articleData.push({
                article,
                tweetId,
                authorUsername
            });
        }

        const viewportHeight =
            window.innerHeight;

        articleData.sort((left, right) => {
            const score = function (article) {
                const rect =
                    article.getBoundingClientRect();

                if (
                    rect.bottom >= 0 &&
                    rect.top <= viewportHeight
                ) {
                    return [0, rect.top];
                }

                if (rect.top > viewportHeight) {
                    return [
                        1,
                        rect.top - viewportHeight
                    ];
                }

                return [2, -rect.bottom];
            };

            const leftScore =
                score(left.article);

            const rightScore =
                score(right.article);

            return leftScore[0] - rightScore[0] ||
                leftScore[1] - rightScore[1];
        });

        const hiddenTweetIds =
            new Set();

        for (
            const {
                article,
                tweetId,
                authorUsername
            } of
            articleData
        ) {
            if (
                authorUsername ===
                    authenticatedUsername
            ) {
                continue;
            }

            const tweetText =
                article.querySelector(
                    '[data-testid="tweetText"]'
                );

            if (!tweetText) {
                continue;
            }

            const firstTextLink =
                tweetText.querySelector('a[href]');

            const firstTextLinkText =
                firstTextLink?.textContent.trim() || '';

            const directMentionLink =
                firstTextLink &&
                firstTextLinkText.startsWith('@') &&
                tweetText.textContent
                    .trim()
                    .startsWith(firstTextLinkText)
                    ? firstTextLink
                    : null;

            const replyContext =
                tweetText.parentElement
                    ?.previousElementSibling;

            const replyTargetLink =
                replyContext?.querySelector(
                    'a[href^="/"]'
                ) || null;

            const targetLink =
                directMentionLink ||
                replyTargetLink;

            const targetMatch =
                targetLink?.getAttribute('href')?.match(
                    /^\/([A-Za-z0-9_]{1,15})\/?$/
                );

            const mentionText =
                targetLink?.textContent.trim() || '';

            const replyTarget =
                tweetId
                    ? replyTargets.get(tweetId)
                    : null;

            const targetUsername =
                replyTarget ||
                (
                    targetMatch &&
                    mentionText.startsWith('@')
                        ? targetMatch[1]
                        : null
                );

            if (!targetUsername) {
                continue;
            }

            const normalizedTarget =
                targetUsername.toLowerCase();

            if (
                normalizedTarget ===
                    authenticatedUsername ||
                followingByUsername.get(
                    normalizedTarget
                )
            ) {
                continue;
            }

            if (
                !followingByUsername.has(
                    normalizedTarget
                )
            ) {
                requestFollowLookup(
                    normalizedTarget,
                    findFollowLookupLink(
                        normalizedTarget,
                        targetLink
                    )
                );

                continue;
            }

            let currentId = tweetId;

            for (
                let depth = 0;
                currentId && depth < 20;
                depth++
            ) {
                if (hiddenTweetIds.has(currentId)) {
                    break;
                }

                hiddenTweetIds.add(currentId);

                currentId =
                    replyParentIds.get(currentId);
            }
        }

        const desiredHiddenCells =
            new Set();

        for (const tweetId of hiddenTweetIds) {
            rememberedHiddenHomeTweetIds.add(tweetId);

            const cell =
                cellsByTweetId.get(tweetId);

            if (cell) {
                desiredHiddenCells.add(cell);
            }
        }

        for (const cell of hiddenCells) {
            if (!desiredHiddenCells.has(cell)) {
                cell.classList.remove(
                    hiddenHomeMentionClass
                );
            }
        }

        for (const cell of desiredHiddenCells) {
            cell.classList.add(
                hiddenHomeMentionClass
            );
        }
    }

    // ============================================================
    // SPA support + automatic theme detection
    // ============================================================

    let lastUrl = location.href;

    setInterval(
        function () {
            if (
                location.href !== lastUrl
            ) {
                lastUrl = location.href;
            }

            if (!History_push) {
                tryFindHistory();
            }

            tryPatchFeatureSwitch();

            const currentLightTheme =
                isLightTheme();

            if (
                lastLightTheme === null ||
                currentLightTheme !==
                    lastLightTheme
            ) {
                lastLightTheme =
                    currentLightTheme;

                refreshAllShortcutButtons();
                refreshSettingsButton();
                applySettingsPopupTheme();
            }

            ensureShortcutButtons();
            ensureSettingsButton();
            refreshFollowLookup();
            refreshOtherMentionsInAll();
            refreshUnfollowedMentionsInHome();
        },
        500
    );

})();
