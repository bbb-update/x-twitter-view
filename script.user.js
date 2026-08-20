// ==UserScript==
// @name         X - Default All + Legacy Media
// @namespace    x-profile-media-control.pub
// @version      2.3
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

    // ============================================================
    // 1. 写真・動画 ボタンの表示 / Show Photos・Videos Buttons
    //
    // O = 表示 / Show
    // X = 非表示 / Hide
    //
    // ボタンを非表示にしていても【Ctrl + Shift】を押しながら
    // Media をクリックすると、写真 → 動画 → 写真の順に切り替えられます。
    // 通常クリックでは、デフォルトのグリッド表示になります。
    //
    // Even when the buttons are hidden, Ctrl + Shift + clicking Media
    // switches between Photos → Videos → Photos.
    // A normal click opens the default grid view.
    //
    const DEFAULT_SHOW_MEDIA_BUTTONS = 'O';
    //
    // ============================================================

    // ============================================================
    // 2. Likes 移動ボタンの表示 / Show Likes Navigation Button
    //
    // O = 表示 / Show
    // X = 非表示 / Hide
    //
    const DEFAULT_SHOW_LIKES_BUTTON = 'O';
    //
    // ============================================================

    // ============================================================
    // 3. 表示言語 / Language
    //
    // E = Photos / Videos / Likes
    // J = 画像 / 動画 / いいね
    //
    const DEFAULT_MEDIA_BUTTON_LANGUAGE = 'J';
    //
    // ============================================================

    // ============================================================
    // 4. ボタンのポイントカラー / Button accent color
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
    // 5. リポスト（リツイート）時刻表示 / Repost (Retweet) Timestamp
    //
    // O = 表示 / Show
    // X = 非表示 / Hide
    //
    const DEFAULT_SHOW_REPOST_TIMESTAMP = 'X';
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
        'compose',
        'jobs',
        'communities'
    ]);

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
        return String(value).toUpperCase() === 'J'
            ? 'J'
            : 'E';
    }

    function normalizeColorTheme(value) {
        const number = Number(value);

        return number >= 1 && number <= 6
            ? number
            : DEFAULT_BUTTON_COLOR_THEME;
    }

    let userSettings = {
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
            )
        };

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
    }

    let History_push = null;
    let shortcutUsername = null;
    let lastLightTheme = null;

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

        if (
            featureSwitches
                .__legacyMediaControlPatched
        ) {
            return true;
        }

        const originalIsTrue =
            featureSwitches.isTrue;

        if (
            typeof originalIsTrue !== 'function'
        ) {
            return false;
        }

        featureSwitches.isTrue =
            function (flag) {
                if (
                    flag ===
                        'responsive_web_profile_redesign_enabled' &&
                    isPlainMediaPage()
                ) {
                    return false;
                }

                return originalIsTrue.call(
                    this,
                    flag
                );
            };

        featureSwitches
            .__legacyMediaControlPatched = true;

        return true;
    }

    const initTimer =
        setInterval(
            function () {
                const flagReady =
                    tryPatchFeatureSwitch();

                const historyReady =
                    tryFindHistory();

                if (
                    flagReady &&
                    historyReady
                ) {
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
                ? '#cfd9de'
                : '#536471',

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
                    '♡',
                    34,
                    function () {
                        navigate(
                            '/i/history/likes'
                        );
                    }
                );

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
                media: '写真・動画 表示ボタン',
                mediaNote:
                    '【Ctrl+Shift+メディア】でも切り替えられます',
                likes: 'いいね欄 移動ボタン',
                language: '表示言語',
                color: 'カラー',
                repostTimestamp:
                    'リポスト(RT) 時刻表示',
                cancel: 'キャンセル',
                save: '保存',
                settings: '設定'
            };
        }

        return {
            title: '✦ Script Settings',
            media: 'Photos・Videos buttons',
            mediaNote:
                'Can also switch with 【Ctrl+Shift+Media Click】',
            likes: 'Likes Navigation button',
            language: 'Language',
            color: 'Color',
            repostTimestamp:
                'Repost (RT) Timestamp',
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
                '.x-profile-settings-popup'
            );

        if (popup) {
            popup.remove();
        }
    }

    function applySettingsPopupTheme() {
        const popup =
            document.querySelector(
                '.x-profile-settings-popup'
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
                base.border;
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
        settingsButton
    ) {
        const existing =
            document.querySelector(
                '.x-profile-settings-popup'
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
            'x-profile-settings-popup';

        popup.style.cssText = `
            position: fixed;

            z-index: 2147483646;

            width: 260px;

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

        title.textContent =
            text.title;

        title.style.cssText = `
            margin-bottom: 12px;

            font-size: 15px;
            font-weight: 700;
        `;

        popup.appendChild(title);

        function createRow(labelText) {
            const row =
                document.createElement('div');

            row.style.cssText = `
                min-height: 36px;

                display: flex;
                align-items: center;
                justify-content: space-between;

                gap: 12px;
            `;

            const label =
                document.createElement('span');

            label.textContent =
                labelText;

            label.style.fontWeight =
                '500';

            row.appendChild(label);

            return row;
        }

        // --------------------------------------------------------
        // Media ON/OFF
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
            width: 17px;
            height: 17px;

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

        const likesCheckbox =
            document.createElement('input');

        likesCheckbox.type =
            'checkbox';

        likesCheckbox.checked =
            isEnabled(
                userSettings.showLikesButton
            );

        likesCheckbox.style.cssText = `
            width: 17px;
            height: 17px;

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

        languageSelect.style.cssText = `
            width: 112px;
            height: 29px;

            padding: 0 7px;

            border: 1px solid ${base.border};
            border-radius: 6px;

            background: ${base.background};
            color: ${base.text};

            cursor: pointer;
        `;

        const japaneseOption =
            document.createElement('option');

        japaneseOption.value = 'J';
        japaneseOption.textContent =
            '日本語';

        const englishOption =
            document.createElement('option');

        englishOption.value = 'E';
        englishOption.textContent =
            'English';

        languageSelect.append(
            japaneseOption,
            englishOption
        );

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
            width: 17px;
            height: 17px;

            accent-color:
                ${getAccentColor()};

            cursor: pointer;
        `;

        repostTimestampRow.appendChild(
            repostTimestampCheckbox
        );

        popup.appendChild(
            repostTimestampRow
        );

        // --------------------------------------------------------
        // Footer
        // --------------------------------------------------------

        const footer =
            document.createElement('div');

        footer.style.cssText = `
            margin-top: 14px;

            display: flex;
            justify-content: flex-end;

            gap: 8px;
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
                min-width: 72px;
                height: 30px;

                padding: 0 12px;

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
                event.stopPropagation();

                const selectedColor =
                    popup.querySelector(
                        'input[name="x-settings-color"]:checked'
                    );

                saveUserSettings({
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
            }
        );

        footer.append(
            cancelButton,
            saveButton
        );

        popup.appendChild(footer);

        document.body.appendChild(
            popup
        );

        // --------------------------------------------------------
        // Display popup
        // --------------------------------------------------------

        const buttonRect =
            settingsButton
                .getBoundingClientRect();

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

        let top =
            buttonRect.bottom + 8;

        if (
            top +
            popupRect.height >
            window.innerHeight - 10
        ) {
            top =
                buttonRect.top -
                popupRect.height -
                8;
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

            closeSettingsPopup();

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
                    '.x-profile-settings-popup'
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
    // Repost (Retweet) Timestamp
    // ============================================================

    const pageWindow =
        unsafeWindow;

    const repostTimes =
        new Map();

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

    const RepostXHR =
        pageWindow.XMLHttpRequest;

    if (RepostXHR) {

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
                event.preventDefault();
                event.stopImmediatePropagation();

                if (ctrlShift) {
                    const currentFilter =
                        new URL(
                            location.href
                        )
                            .searchParams
                            .get('filter');

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

                // Click → Legacy Media
                navigate(path);

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
        },
        500
    );

})();
