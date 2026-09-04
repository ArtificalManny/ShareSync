import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ExternalLink,
  Megaphone,
} from 'lucide-react';

import {
  getActiveSponsorship,
  trackSponsorshipClick,
  trackSponsorshipImpression,
} from '../../api/discovery';

function getSafeDestination(value) {
  const raw = String(value || '').trim();

  if (!raw) return null;

  try {
    const url = new URL(
      raw,
      window.location.origin
    );

    if (
      !['http:', 'https:'].includes(
        url.protocol
      )
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function getSafeFirstPartyLogo(value) {
  const raw = String(value || '').trim();

  if (!raw) return null;

  try {
    const url = new URL(
      raw,
      window.location.origin
    );

    // Sponsor-hosted images are intentionally rejected.
    // This prevents an external image from becoming an
    // undeclared tracking pixel.
    if (url.origin !== window.location.origin) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function sponsorInitials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

// openshare-sponsorship-private-preview-v1
//
// Private visual preview is permitted only in development
// environments or a native/local OpenShare WebView.
//
// A visitor to openshare.ca cannot enable this simply by
// appending ?sponsorPreview=1.
function canUsePrivateSponsorshipPreview() {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = String(
    window.location?.hostname || ''
  ).toLowerCase();

  const protocol = String(
    window.location?.protocol || ''
  ).toLowerCase();

  return (
    import.meta.env.DEV ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    protocol === 'capacitor:'
  );
}

function privatePreviewRequested() {
  if (!canUsePrivateSponsorshipPreview()) {
    return false;
  }

  try {
    const params = new URLSearchParams(
      window.location.search
    );

    if (params.get('sponsorPreview') === '1') {
      localStorage.setItem(
        'openshare.sponsorshipPreview',
        '1'
      );
    }

    if (params.get('sponsorPreview') === '0') {
      localStorage.removeItem(
        'openshare.sponsorshipPreview'
      );
    }

    return (
      localStorage.getItem(
        'openshare.sponsorshipPreview'
      ) === '1'
    );
  } catch {
    return false;
  }
}

const PRIVATE_PREVIEW_CAMPAIGN = Object.freeze({
  id: 'partner-spotlight-preview-001',
  campaignId: 'partner-spotlight-preview-001',
  placement: 'discover_sidebar',
  type: 'resource',
  sponsorName: 'OpenShare',
  sponsorLogo: '',
  eyebrow: 'Partner Spotlight',
  title: 'Build your startup launch plan',
  description:
    'A practical resource for founders and small teams preparing their next launch.',
  ctaLabel: 'Explore resource',
  destinationUrl: 'https://openshare.ca',
  previewOnly: true,
});

export default function SponsoredSpotlight({
  placement = 'discover_sidebar',
}) {
  const [campaign, setCampaign] =
    useState(null);

  const cardRef = useRef(null);

  const impressionSentRef =
    useRef(false);

  useEffect(() => {
    let cancelled = false;

    // Local/private preview bypasses production inventory.
    // The MongoDB record remains draft.
    if (privatePreviewRequested()) {
      setCampaign({
        ...PRIVATE_PREVIEW_CAMPAIGN,
        placement,
      });

      return () => {
        cancelled = true;
      };
    }

    const controller =
      new AbortController();

    getActiveSponsorship({
      placement,
      signal: controller.signal,
    })
      .then((nextCampaign) => {
        if (!cancelled) {
          setCampaign(
            nextCampaign || null
          );
        }
      })
      .catch(() => {
        // Sponsorships are optional. Discover must remain
        // fully usable if this request fails.
        if (!cancelled) {
          setCampaign(null);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [placement]);

  useEffect(() => {
    impressionSentRef.current = false;
  }, [
    campaign?.campaignId,
    campaign?.id,
  ]);

  useEffect(() => {
    if (
      !campaign ||
      !cardRef.current ||
      impressionSentRef.current
    ) {
      return undefined;
    }

    const campaignId =
      campaign.campaignId ||
      campaign.id;

    const sendImpression = () => {
      if (
        impressionSentRef.current ||
        !campaignId
      ) {
        return;
      }

      impressionSentRef.current = true;

      // Never contaminate production analytics with
      // a local preview impression.
      if (campaign.previewOnly) {
        return;
      }

      trackSponsorshipImpression(
        campaignId,
        placement
      ).catch(() => {});
    };

    if (
      typeof IntersectionObserver ===
      'undefined'
    ) {
      sendImpression();
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (
            entry?.isIntersecting &&
            entry.intersectionRatio >= 0.5
          ) {
            sendImpression();
            observer.disconnect();
          }
        },
        {
          threshold: [0.5],
        }
      );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [campaign, placement]);

  const destination = useMemo(
    () =>
      getSafeDestination(
        campaign?.destinationUrl
      ),
    [campaign?.destinationUrl]
  );

  const logo = useMemo(
    () =>
      getSafeFirstPartyLogo(
        campaign?.sponsorLogo
      ),
    [campaign?.sponsorLogo]
  );

  if (!campaign || !destination) {
    return null;
  }

  const campaignId =
    campaign.campaignId ||
    campaign.id;

  const handleClick = () => {
    // Never contaminate production analytics with
    // a local preview click.
    if (campaign.previewOnly) {
      return;
    }

    trackSponsorshipClick(
      campaignId,
      placement
    ).catch(() => {});
  };

  return (
    <article
      ref={cardRef}
      className="
        overflow-hidden
        rounded-[1.75rem]
        border border-amber-200/80
        bg-white/85
        shadow-sm
        dark:border-amber-400/15
        dark:bg-[#111116]/85
      "
      aria-label={`Sponsored content from ${campaign.sponsorName}`}
    >
      <div
        className="
          border-b border-amber-100
          p-5
          dark:border-amber-400/10
        "
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-2xl
                border border-amber-200
                bg-amber-50
                text-amber-700
                dark:border-amber-400/20
                dark:bg-amber-400/10
                dark:text-amber-200
              "
            >
              <Megaphone className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p
                className="
                  text-[11px] font-black
                  uppercase tracking-[0.16em]
                  text-slate-800
                  dark:text-white
                "
              >
                {campaign.eyebrow ||
                  'Partner Spotlight'}
              </p>

              <p
                className="
                  mt-1 text-xs
                  text-slate-500
                  dark:text-zinc-400
                "
              >
                A contextual OpenShare partner resource.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {campaign.previewOnly && (
              <span
                className="
                  rounded-full
                  border border-cyan-200
                  bg-cyan-50
                  px-2.5 py-1
                  text-[10px] font-black
                  uppercase tracking-[0.14em]
                  text-cyan-700
                  dark:border-cyan-400/20
                  dark:bg-cyan-400/10
                  dark:text-cyan-200
                "
              >
                Preview
              </span>
            )}

            <span
              className="
                rounded-full
                border border-slate-200
                bg-slate-50
                px-2.5 py-1
                text-[10px] font-black
                uppercase tracking-[0.14em]
                text-slate-500
                dark:border-white/[0.08]
                dark:bg-white/[0.04]
                dark:text-zinc-400
              "
            >
              Sponsored
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="
              flex h-11 w-11 shrink-0
              items-center justify-center
              overflow-hidden rounded-2xl
              border border-slate-200
              bg-slate-50
              text-sm font-black
              text-slate-700
              dark:border-white/[0.08]
              dark:bg-white/[0.05]
              dark:text-zinc-200
            "
          >
            {logo ? (
              <img
                src={logo}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              sponsorInitials(
                campaign.sponsorName
              ) || 'P'
            )}
          </div>

          <div className="min-w-0">
            <p
              className="
                text-xs font-semibold
                text-slate-500
                dark:text-zinc-400
              "
            >
              Presented by
            </p>

            <p
              className="
                truncate text-sm font-bold
                text-slate-900
                dark:text-white
              "
            >
              {campaign.sponsorName}
            </p>
          </div>
        </div>

        <h3
          className="
            text-lg font-bold leading-snug
            text-slate-950
            dark:text-white
          "
        >
          {campaign.title}
        </h3>

        <p
          className="
            mt-2 text-sm leading-6
            text-slate-600
            dark:text-zinc-300
          "
        >
          {campaign.description}
        </p>

        <a
          href={destination}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="
            mt-5 inline-flex
            items-center gap-2
            rounded-xl
            border border-slate-200
            bg-slate-50
            px-4 py-2.5
            text-sm font-bold
            text-slate-700
            transition-colors
            hover:bg-slate-100
            dark:border-white/[0.08]
            dark:bg-white/[0.05]
            dark:text-zinc-200
            dark:hover:bg-white/[0.08]
          "
        >
          {campaign.ctaLabel ||
            'Explore resource'}

          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}
