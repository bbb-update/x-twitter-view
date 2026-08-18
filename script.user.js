// ==UserScript==
// @name         X - Default All + Legacy Media
// @namespace    x-profile-media-control.pub
// @version      2.0
// @author       bbb
// @description  Default profile to All, restore legacy mixed Media, add Media/Likes shortcut buttons, SPA navigation
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @updateURL    https://raw.githubusercontent.com/bbb-update/x-twitter-view/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/bbb-update/x-twitter-view/main/script.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    // ★ USER SETTINGS ★
    //
    // 1. Media 버튼 표시 여부
    //
    // O = 표시
    // X = 숨김
    //
    // 버튼이 비표시 상태여도 【 Ctrl + Shift 】를 누른 상태로 Media 버튼을 클릭하면
    // 사진 → 동영상→ 사진 순서로 전환 가능
    // 아무것도 누르지 않은 상태로 Media 버튼을 클릭하면 기본 그리드 형식으로 표시
    //
    const SHOW_MEDIA_BUTTONS = 'O';
    //
    // ============================================================

    // ============================================================
    // 2. Likes 버튼 표시 여부
    //
    // O = 표시
    // X = 숨김
    //
    const SHOW_LIKES_BUTTON = 'O';
    //
    // ============================================================

    // ============================================================
    // 3. Media 버튼 언어
    //
    // E = Photo / Video
    // J = 画像 / 動画
    //
    const MEDIA_BUTTON_LANGUAGE = 'E';
    //
    // ============================================================

    // ============================================================
    // 4. 버튼 포인트 컬러
    //
    // 1 = Blue   #1d9bf0
    // 2 = Yellow #ffd400
    // 3 = Pink   #f91880
    // 4 = Purple #7856ff
    // 5 = Orange #ff7a00
    // 6 = Green  #00ba7c
    //
    const BUTTON_COLOR_THEME = 6;
    //
    // ============================================================

    // ============================================================
    // 기본 설정
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

    const accentColor =
        accentColors[BUTTON_COLOR_THEME] ||
        accentColors[1];

    let History_push = null;

    /*
     * 현재 화면에 생성된 shortcut 버튼이
     * 어느 프로필용인지 기억
     */
    let shortcutUsername = null;

    /*
     * 마지막으로 확인된 Light / Dark 테마
     */
    let lastLightTheme = null;

    // ============================================================
    // X 최상위 React props 찾기
    // ============================================================

    function getTopLevelProps() {

        const root =
            document.querySelector(
                '#react-root'
            );

        if (
            !root ||
            !root.firstElementChild
        ) {
            return null;
        }

        const element =
            root.firstElementChild;

        let reactPropsKey = null;

        for (
            const key of
            Object.keys(element)
        ) {
            if (
                key.indexOf(
                    '__reactProps'
                ) === 0
            ) {
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
    // X 내부 history.push 확보
    // ============================================================

    function tryFindHistory() {

        if (History_push) {
            return true;
        }

        const props =
            getTopLevelProps();

        if (
            !props ||
            !props.history ||
            typeof props.history.push !==
                'function'
        ) {
            return false;
        }

        History_push =
            props.history.push;

        return true;
    }

    // ============================================================
    // SPA 이동
    // ============================================================

    function navigate(
        pathname,
        search = ''
    ) {

        if (History_push) {

            const query = {};

            if (search) {

                const params =
                    new URLSearchParams(
                        search.replace(
                            /^\?/,
                            ''
                        )
                    );

                for (
                    const [key, value]
                    of params
                ) {
                    query[key] = value;
                }
            }

            try {

                History_push({
                    pathname:
                        pathname,

                    hash:
                        '',

                    query:
                        query,

                    search:
                        search
                });

                return;

            } catch (e) {
                /*
                 * 실패하면 location.href로 fallback
                 */
            }
        }

        location.href =
            pathname + search;
    }

    // ============================================================
    // 프로필 페이지 판정
    // ============================================================

    function getProfileUsername() {

        const parts =
            location.pathname
                .split('/')
                .filter(Boolean);

        if (parts.length === 0) {
            return null;
        }

        const username =
            parts[0];

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

        const profileTabs =
            new Set([
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

    function isProfilePage() {
        return (
            getProfileUsername() !== null
        );
    }

    // ============================================================
    // 필터 없는 순수 /media 판정
    //
    // /media              → 구형 Media
    // /media?filter=photo → 신형 Photos
    // /media?filter=video → 신형 Videos
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

        return !params.has(
            'filter'
        );
    }

    // ============================================================
    // 순수 /media에서만
    // 프로필 redesign feature flag 비활성화
    // ============================================================

    function tryPatchFeatureSwitch() {

        const props =
            getTopLevelProps();

        if (
            !props ||
            !props.contextProviderProps ||
            !props.contextProviderProps
                .featureSwitches
        ) {
            return false;
        }

        const featureSwitches =
            props.contextProviderProps
                .featureSwitches;

        if (
            featureSwitches
                .__legacyMediaControlPatched
        ) {
            return true;
        }

        const originalIsTrue =
            featureSwitches.isTrue;

        if (
            typeof originalIsTrue !==
            'function'
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
            .__legacyMediaControlPatched =
            true;

        return true;
    }

    // ============================================================
    // X 내부 객체 초기화
    // ============================================================

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
                    clearInterval(
                        initTimer
                    );
                }

            },
            200
        );

    // ============================================================
    // Media 탭 찾기
    // ============================================================

    function findMediaTab() {

        const links =
            document.querySelectorAll(
                'a[href]'
            );

        for (const link of links) {

            const href =
                link.getAttribute(
                    'href'
                );

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
    // 테마 판정
    //
    // 밝은 배경이면 Light
    // 어두운 배경이면 Dark
    // ============================================================

    function isLightTheme() {

        const bodyStyle =
            getComputedStyle(
                document.body
            );

        const color =
            bodyStyle.backgroundColor;

        const match =
            color.match(
                /rgba?\((\d+),\s*(\d+),\s*(\d+)/
            );

        if (!match) {
            return false;
        }

        const r =
            Number(match[1]);

        const g =
            Number(match[2]);

        const b =
            Number(match[3]);

        const brightness =
            (
                r * 299 +
                g * 587 +
                b * 114
            ) / 1000;

        return brightness > 160;
    }

    // ============================================================
    // 버튼 색상
    // ============================================================

    function getBaseThemeColors() {

        const light =
            isLightTheme();

        return {
            background:
                light
                    ? '#ffffff'
                    : '#0e1217',

            border:
                light
                    ? '#cfd9de'
                    : '#536471',

            text:
                light
                    ? '#0f1419'
                    : '#e7e9ea'
        };
    }

    function getAccentTextColor() {

        return isLightTheme()
            ? '#0f1419'
            : '#e7e9ea';
    }

    function getPressedBrightness() {

        const brightnessByTheme = {
            1: 1.25, // Blue
            2: 1.10, // Yellow
            3: 1.80, // Pink
            4: 1.42, // Purple
            5: 1.38, // Orange
            6: 1.24  // Green
        };

        return (
            brightnessByTheme[
                BUTTON_COLOR_THEME
            ] || 1.25
        );
    }

    // ============================================================
    // 버튼 현재 상태에 맞춰 색상 갱신
    // ============================================================

    function refreshButtonStyle(
        button
    ) {

        const base =
            getBaseThemeColors();

        const hovered =
            button.dataset.hovered ===
            'true';

        const pressed =
            button.dataset.pressed ===
            'true';

        /*
         * Hover / 클릭 중
         * → 포인트 컬러 유지
         */
        if (
            hovered ||
            pressed
        ) {

            button.style.background =
                accentColor;

            button.style.borderColor =
                accentColor;

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

        /*
         * 클릭해서 누르고 있는 동안만
         * 전체 버튼을 살짝 밝게
         */
       button.style.filter =
            pressed
                ? `brightness(${getPressedBrightness()})`
                : 'none';
    }

    // ============================================================
    // 현재 shortcut 버튼 전체 테마 갱신
    // ============================================================

    function refreshAllShortcutButtons() {

        const wrapper =
            document.querySelector(
                '.x-profile-shortcut-wrapper'
            );

        if (!wrapper) {
            return;
        }

        const buttons =
            wrapper.querySelectorAll(
                'button'
            );

        for (const button of buttons) {

            refreshButtonStyle(
                button
            );
        }
    }

    // ============================================================
    // 공통 버튼 생성
    // ============================================================

    function createShortcutButton(
        text,
        width,
        onClick
    ) {

        const button =
            document.createElement(
                'button'
            );

        button.textContent =
            text;

        button.dataset.hovered =
            'false';

        button.dataset.pressed =
            'false';

        button.style.cssText = `
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

        button.style.width =
            width + 'px';

        refreshButtonStyle(
            button
        );

        // --------------------------------------------------------
        // Hover 시작
        // --------------------------------------------------------

        button.addEventListener(
            'mouseenter',
            function () {

                button.dataset.hovered =
                    'true';

                refreshButtonStyle(
                    button
                );
            }
        );

        // --------------------------------------------------------
        // Hover 종료
        // --------------------------------------------------------

        button.addEventListener(
            'mouseleave',
            function () {

                button.dataset.hovered =
                    'false';

                button.dataset.pressed =
                    'false';

                refreshButtonStyle(
                    button
                );
            }
        );

        // --------------------------------------------------------
        // 클릭 누르는 순간
        // → 포인트 컬러를 살짝 밝게
        // --------------------------------------------------------

        button.addEventListener(
            'mousedown',
            function () {

                button.dataset.pressed =
                    'true';

                refreshButtonStyle(
                    button
                );
            }
        );

        // --------------------------------------------------------
        // 마우스 버튼을 떼면
        // → Hover 포인트 컬러로 복귀
        // --------------------------------------------------------

        button.addEventListener(
            'mouseup',
            function () {

                button.dataset.pressed =
                    'false';

                refreshButtonStyle(
                    button
                );
            }
        );

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

    // ============================================================
    // 상단 shortcut 버튼 영역
    // ============================================================

    function ensureShortcutButtons() {

        const old =
            document.querySelector(
                '.x-profile-shortcut-wrapper'
            );

        const currentUsername =
            getProfileUsername();

        /*
         * 둘 다 OFF거나
         * 프로필 페이지가 아니면 제거
         */
        if (
            (
                String(SHOW_MEDIA_BUTTONS).toUpperCase() !== 'O' &&
                String(SHOW_LIKES_BUTTON).toUpperCase() !== 'O'
            ) ||
            !currentUsername
        ) {

            if (old) {
                old.remove();
            }

            shortcutUsername =
                null;

            return;
        }

        /*
         * 다른 사람 프로필로 이동한 경우에는
         * 버튼 링크 대상도 바뀌므로 새로 생성
         */
        if (
            old &&
            shortcutUsername !==
                currentUsername
        ) {

            old.remove();

            shortcutUsername =
                null;
        }

        const existing =
            document.querySelector(
                '.x-profile-shortcut-wrapper'
            );

        if (existing) {

            refreshAllShortcutButtons();

            return;
        }

        const mediaTab =
            findMediaTab();

        if (!mediaTab) {
            return;
        }

        const tabList =
            mediaTab.closest(
                '[role="tablist"]'
            );

        if (
            !tabList ||
            !tabList.parentElement
        ) {
            return;
        }

        let host =
            tabList.parentElement;

        let candidate =
            host;

        for (
            let i = 0;
            i < 4 &&
            candidate &&
            candidate !==
                document.body;
            i++
        ) {

            const rect =
                candidate
                    .getBoundingClientRect();

            if (
                rect.width > 500 &&
                rect.height > 80
            ) {
                host = candidate;
            }

            candidate =
                candidate.parentElement;
        }

        const hostStyle =
            getComputedStyle(
                host
            );

        if (
            hostStyle.position ===
            'static'
        ) {
            host.style.position =
                'relative';
        }

        if (
            hostStyle.overflow ===
            'hidden'
        ) {
            host.style.overflow =
                'visible';
        }

        const wrapper =
            document.createElement(
                'div'
            );

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
            String(SHOW_LIKES_BUTTON).toUpperCase() === 'O'
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
                String(MEDIA_BUTTON_LANGUAGE).toUpperCase() === 'J'
                    ? 'いいね'
                    : 'Likes';

            likesButton.style.marginRight =
                '10px';

            wrapper.appendChild(
                likesButton
            );
        }

        // --------------------------------------------------------
        // Photo / Video
        // --------------------------------------------------------

        if (
            String(SHOW_MEDIA_BUTTONS).toUpperCase() === 'O'
        ) {

            const username =
                currentUsername;

            if (username) {

                const isJapanese =
                    String(
                        MEDIA_BUTTON_LANGUAGE
                    ).toUpperCase() ===
                    'J';

                const photoText =
                    isJapanese
                        ? '画像'
                        : 'Photo';

                const videoText =
                    isJapanese
                        ? '動画'
                        : 'Video';

                const photoButton =
                    createShortcutButton(
                        photoText,
                        64,
                        function () {
                            navigate(
                                '/' +
                                username +
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
                                username +
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
        }

        host.appendChild(
            wrapper
        );

        shortcutUsername =
            currentUsername;

        /*
         * 생성 직후 현재 테마 적용
         */
        refreshAllShortcutButtons();
    }

    // ============================================================
    // React onClick 핸들러 찾기
    // ============================================================

    function findReactClickHandler(
        element
    ) {

        let node =
            element;

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

    // ============================================================
    // React onClick을 Ctrl+Shift 상태로 직접 호출
    // ============================================================

    function invokeReactCtrlShift(
        link
    ) {

        const found =
            findReactClickHandler(
                link
            );

        if (!found) {
            return false;
        }

        const fakeEvent = {

            type:
                'click',

            target:
                link,

            currentTarget:
                found.element,

            ctrlKey:
                true,

            shiftKey:
                true,

            metaKey:
                false,

            altKey:
                false,

            button:
                0,

            buttons:
                1,

            defaultPrevented:
                false,

            preventDefault() {
                this.defaultPrevented =
                    true;
            },

            stopPropagation() {},

            stopImmediatePropagation() {},

            persist() {},

            nativeEvent: {
                ctrlKey:
                    true,

                shiftKey:
                    true,

                metaKey:
                    false,

                altKey:
                    false,

                button:
                    0
            }
        };

        try {

            found.handler(
                fakeEvent
            );

            return true;

        } catch (e) {

            return false;
        }
    }

    // ============================================================
    // 링크 클릭
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
                url.origin !==
                location.origin
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
                /^\/[^/]+\/media$/.test(
                    path
                )
            ) {

                event.preventDefault();
                event.stopImmediatePropagation();

                /*
                 * Ctrl+Shift Toggle
                 */
                if (ctrlShift) {

                    const currentFilter =
                        new URL(
                            location.href
                        )
                            .searchParams
                            .get(
                                'filter'
                            );

                    if (
                        currentFilter ===
                        'photo'
                    ) {

                        navigate(
                            path,
                            '?filter=video'
                        );

                        return;
                    }

                    if (
                        currentFilter ===
                        'video'
                    ) {

                        navigate(
                            path,
                            '?filter=photo'
                        );

                        return;
                    }

                    /*
                     * 혼합 / 다른 탭에서
                     * Ctrl+Shift + Media
                     * → Photo
                     */
                    navigate(
                        path,
                        '?filter=photo'
                    );

                    return;
                }

                /*
                 * 일반 클릭
                 * → 구형 혼합 Media
                 */
                navigate(
                    path
                );

                return;
            }

            // ====================================================
            // Profile / Posts
            // ====================================================

            const profileMatch =
                path.match(
                    /^\/([^/]+)$/
                );

            if (profileMatch) {

                const username =
                    profileMatch[1];

                if (
                    excludedPaths.has(
                        username
                            .toLowerCase()
                    )
                ) {
                    return;
                }

                const profilePath =
                    '/' + username;

                const allPath =
                    profilePath +
                    '/all';

                /*
                 * 프로필 상단 Posts 탭
                 */
                const tabList =
                    link.closest(
                        '[role="tablist"]'
                    );

                if (tabList) {

                    const currentPath =
                        location.pathname
                            .replace(
                                /\/$/,
                                ''
                            );

                    /*
                     * 실제 Ctrl+Shift
                     */
                    if (ctrlShift) {

                        /*
                         * Posts / All에서는
                         * X 원래 펼침메뉴
                         */
                        if (
                            currentPath ===
                                profilePath ||
                            currentPath ===
                                allPath
                        ) {
                            return;
                        }

                        /*
                         * 다른 탭에서는
                         * 원래 Posts로 이동
                         */
                        event.preventDefault();
                        event.stopImmediatePropagation();

                        navigate(
                            profilePath
                        );

                        return;
                    }

                    /*
                     * Posts / All에서는
                     * X 원래 펼침메뉴
                     */
                    if (
                        currentPath ===
                            profilePath ||
                        currentPath ===
                            allPath
                    ) {
                        return;
                    }

                    /*
                     * 답글 / 리트윗 / 미디어 /
                     * 하이라이트 등 다른 탭에서는
                     * 게시물 클릭 → All
                     */
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    navigate(
                        allPath
                    );

                    return;
                }

                // =================================================
                // 일반 프로필 링크
                // =================================================

                /*
                 * Ctrl+Shift
                 * → 원래 Posts
                 */
                if (ctrlShift) {

                    event.preventDefault();
                    event.stopImmediatePropagation();

                    navigate(
                        profilePath
                    );

                    return;
                }

                /*
                 * 일반 프로필 클릭
                 * → All
                 */
                event.preventDefault();
                event.stopImmediatePropagation();

                navigate(
                    allPath
                );

                return;
            }

        },
        true
    );

    // ============================================================
    // SPA 대응 + 테마 자동 감지
    // ============================================================

    let lastUrl =
        location.href;

    setInterval(
        function () {

            if (
                location.href !==
                lastUrl
            ) {

                lastUrl =
                    location.href;

                /*
                 * 같은 프로필 안의 SPA 이동에서는
                 * 기존 버튼 DOM을 유지한다.
                 *
                 * 다른 프로필로 이동한 경우에는
                 * ensureShortcutButtons()에서 자동 재생성.
                 */
            }

            if (!History_push) {
                tryFindHistory();
            }

            /*
             * Light / Dark 테마가 바뀌었는지 확인
             */
            const currentLightTheme =
                isLightTheme();

            if (
                lastLightTheme === null ||
                currentLightTheme !==
                    lastLightTheme
            ) {

                lastLightTheme =
                    currentLightTheme;

                /*
                 * Hover 중인 버튼은 Accent 유지,
                 * 평상시 버튼만 새로운 Light/Dark 색으로 변경.
                 */
                refreshAllShortcutButtons();
            }

            ensureShortcutButtons();

        },
        500
    );

})();
