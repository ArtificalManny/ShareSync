// src/components/layout/MobileHeader.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import NotificationsBell from '../notifications/NotificationsBell';
import OpenShareLogo from '../ui/OpenShareLogo';

function getPageTitle(pathname) {
  if (pathname === '/home') return 'Home';
  if (pathname === '/my-work') return 'My Work';
  if (pathname === '/projects') return 'Projects';
  if (pathname.startsWith('/projects/')) return 'Project';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/profile' || pathname === '/me') return 'Profile';
  if (pathname === '/discover') return 'Discover';
  if (pathname === '/messages') return 'Messages';
  if (pathname === '/search') return 'Search';
  if (pathname === '/analytics') return 'Analytics';
  if (pathname === '/community') return 'Community';
  return 'OpenShare';
}

export default function MobileHeader({
  onSearchPress,
  className = '',
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = getPageTitle(location.pathname);

  // mobile-unified-search-v1
  // Mobile Search is a native entry point into the exact same /search
  // route used by the desktop Navbar. SearchPage remains the single
  // source of truth for querying, filters, result grouping and routing.
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');

  const openMobileSearch = () => {
    const currentQuery =
      location.pathname === '/search'
        ? new URLSearchParams(location.search).get('q') || ''
        : '';

    setMobileSearchQuery(currentQuery);
    setMobileSearchOpen(true);
  };

  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
  };

  const submitMobileSearch = (event) => {
    event.preventDefault();

    const query = mobileSearchQuery.trim();

    if (!query) {
      return;
    }

    navigate(`/search?q=${encodeURIComponent(query)}`);
    setMobileSearchOpen(false);
  };

  // mobile-notifications-escape-header-clip-v1
  // The NotificationsDropdown is viewport-positioned on mobile.
  // Do not clip it inside the frosted header shell.
  return (
    <header
      className={`
        openshare-mobile-header
        sticky top-0 z-[70] overflow-visible md:hidden
        border-b text-slate-900 dark:text-white
        ${className}
      `}
    >

      <div
        className="relative"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* mobile-unified-search-header-mode-v2
            Search mode replaces the normal header row instead of layering
            over it. This keeps the iOS header to exactly one 62px row and
            prevents the close control from wrapping below the input. */}
        {mobileSearchOpen ? (
          <form
            role="search"
            onSubmit={submitMobileSearch}
            className="
              openshare-mobile-search-form
              flex h-[62px] w-full items-center gap-2 px-4
              bg-slate-50/95
              dark:bg-[#0f1014]/95
            "
          >
            <div
              className="
                openshare-mobile-search-field
                flex h-[42px] min-w-0 flex-1 items-center gap-2
                rounded-[14px]
                border border-slate-200/90
                bg-white px-3
                shadow-sm
                dark:border-white/10
                dark:bg-white/[0.06]
              "
            >
              <Search
                className="
                  h-[20px] w-[20px] shrink-0
                  text-slate-400 dark:text-zinc-400
                "
                strokeWidth={2.2}
                aria-hidden="true"
              />

              <input
                type="search"
                value={mobileSearchQuery}
                onChange={(event) =>
                  setMobileSearchQuery(event.target.value)
                }
                placeholder="Search everything..."
                aria-label="Search OpenShare"
                autoFocus
                autoComplete="off"
                enterKeyHint="search"
                className="
                  openshare-mobile-search-input
                  h-[40px] min-w-0 flex-1
                  border-0 bg-transparent p-0
                  text-[16px] font-medium
                  text-slate-900
                  placeholder:text-slate-400
                  outline-none ring-0
                  dark:text-white
                  dark:placeholder:text-zinc-500
                "
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
              />
            </div>

            <button
              type="button"
              onClick={closeMobileSearch}
              className="
                openshare-mobile-header-control
                flex h-[42px] w-[42px] shrink-0
                items-center justify-center
                active:scale-[0.96]
              "
              aria-label="Close search"
            >
              <X
                className="h-[21px] w-[21px]"
                strokeWidth={2.2}
              />
            </button>
          </form>
        ) : (
          <div className="flex h-[62px] items-center justify-between px-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <OpenShareLogo
                className="h-7 w-7 shrink-0 drop-shadow-[0_0_10px_rgba(124,58,237,0.22)]"
                title="OpenShare"
                animated
              />

              <h1
                className="
                  truncate text-[20px] font-bold leading-none
                  text-slate-900 dark:text-white
                "
                style={{ fontFamily: 'var(--font-ui)' }}
              >
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openMobileSearch}
                className="
                  openshare-mobile-header-control
                  flex h-[42px] w-[42px]
                  items-center justify-center
                  active:scale-[0.96]
                "
                aria-label="Search"
              >
                <Search
                  className="h-[21px] w-[21px]"
                  strokeWidth={2.2}
                />
              </button>

              <div
                className="
                  openshare-mobile-header-bell
                  relative flex h-[42px] w-[42px]
                  items-center justify-center
                "
              >
                <NotificationsBell
                  dropdownWidthClassName="!w-[calc(100vw-24px)] !max-w-[420px]"
                  anchorClassName="!fixed !left-1/2 !right-auto !top-[calc(env(safe-area-inset-top,0px)+66px)] !z-[9999] !-translate-x-1/2 !mt-0"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* mobile-search-single-row-v4
           Keep the native mobile Search header to exactly one row.
           Some broader form layout rule is winning inside WKWebView,
           so explicitly own the two-column geometry here. */
        @media (max-width: 767px) {
          .openshare-mobile-search-form {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 42px !important;
            grid-template-rows: 62px !important;
            align-items: center !important;
            column-gap: 8px !important;

            width: 100% !important;
            height: 62px !important;
            min-height: 62px !important;
            max-height: 62px !important;

            padding: 0 16px !important;
            margin: 0 !important;
          }

          .openshare-mobile-search-field {
            grid-column: 1 !important;
            grid-row: 1 !important;

            width: 100% !important;
            min-width: 0 !important;
            height: 42px !important;

            margin: 0 !important;
          }

          .openshare-mobile-search-form
            > .openshare-mobile-header-control {
            grid-column: 2 !important;
            grid-row: 1 !important;

            position: static !important;
            inset: auto !important;
            float: none !important;

            width: 42px !important;
            min-width: 42px !important;
            height: 42px !important;
            min-height: 42px !important;

            margin: 0 !important;
            padding: 0 !important;

            justify-self: end !important;
            align-self: center !important;
          }
        }

        /* mobile-search-ios-focus-lock-v3
           WKWebView can still zoom a focused search input when a broader
           form rule wins the cascade. Guarantee a true 16px computed size
           and prevent transforms on this one native-app search control. */
        @media (max-width: 767px) {
          .openshare-mobile-search-input {
            font-size: 16px !important;
            line-height: 20px !important;
            transform: none !important;
            zoom: 1 !important;
            -webkit-text-size-adjust: 100% !important;
          }
        }

        /* openshare-mobile-header-refinement-v1 */
        @media (max-width: 767px) {
          .openshare-mobile-header {
            background: rgba(248, 250, 252, 0.72) !important;
            border-bottom-color: rgba(148, 163, 184, 0.16) !important;
            -webkit-backdrop-filter: saturate(180%) blur(18px) !important;
            backdrop-filter: saturate(180%) blur(18px) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.52),
              0 6px 22px rgba(15, 23, 42, 0.045) !important;
          }

          .openshare-mobile-header-control,
          .openshare-mobile-header-bell > div > button {
            width: 42px !important;
            height: 42px !important;
            min-width: 42px !important;
            min-height: 42px !important;
            padding: 0 !important;

            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;

            border-radius: var(--radius-control, 14px) !important;
            border: 1px solid rgba(148, 163, 184, 0.18) !important;
            background: rgba(255, 255, 255, 0.48) !important;
            color: #475569 !important;

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.78),
              0 2px 8px rgba(15, 23, 42, 0.045) !important;

            transition:
              background-color 150ms ease,
              border-color 150ms ease,
              color 150ms ease,
              transform 120ms ease !important;
          }

          .openshare-mobile-header-control:hover,
          .openshare-mobile-header-bell > div > button:hover {
            background: rgba(255, 255, 255, 0.72) !important;
            border-color: rgba(100, 116, 139, 0.24) !important;
            color: #334155 !important;
            transform: none !important;
          }

          .openshare-mobile-header-control:active,
          .openshare-mobile-header-bell > div > button:active {
            transform: scale(0.96) !important;
          }

          .openshare-mobile-header-bell > div > button > svg {
            width: 21px !important;
            height: 21px !important;
            stroke-width: 2.2 !important;
          }

          html.dark .openshare-mobile-header,
          html[data-theme="dark"] .openshare-mobile-header,
          .dark .openshare-mobile-header {
            background: rgba(9, 11, 18, 0.72) !important;
            border-bottom-color: rgba(255, 255, 255, 0.08) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.035),
              0 6px 24px rgba(0, 0, 0, 0.14) !important;
          }

          html.dark .openshare-mobile-header-control,
          html.dark .openshare-mobile-header-bell > div > button,
          html[data-theme="dark"] .openshare-mobile-header-control,
          html[data-theme="dark"] .openshare-mobile-header-bell > div > button,
          .dark .openshare-mobile-header-control,
          .dark .openshare-mobile-header-bell > div > button {
            background: rgba(255, 255, 255, 0.055) !important;
            border-color: rgba(255, 255, 255, 0.09) !important;
            color: #e2e8f0 !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.055),
              0 2px 8px rgba(0, 0, 0, 0.12) !important;
          }
        }
      `}</style>
    </header>
  );
}
