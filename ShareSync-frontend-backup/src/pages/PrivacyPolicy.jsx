import React from "react";
import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";

// Public privacy notice — update this document when practices change.
const LEGAL_OPERATOR = "Fernando Emanuel Rivas Belmontes (operating OpenShare as an individual)";
const PRIVACY_CONTACT = "realMannyRivas@proton.me";

const Section = ({ heading, children }) => (
  <section className="mt-8">
    <h2 className="text-xl font-semibold text-slate-900 mb-3">{heading}</h2>
    <div className="text-slate-700 leading-7 space-y-3">{children}</div>
  </section>
);

export default function PrivacyPolicy() {
  useDocumentTitle("Privacy Policy", {
    description: "How OpenShare collects, uses, shares, retains, and deletes information.",
    canonical: "https://openshare.ca/privacy",
    robots: "index,follow",
  });

  return (
    <main className="min-h-screen bg-white text-slate-900 px-5 py-12">
      <article className="max-w-3xl mx-auto">
        <Link to="/login" className="text-violet-700 font-medium hover:underline">← OpenShare</Link>
        <h1 className="text-4xl font-bold mt-6">OpenShare Privacy Policy</h1>
        <p className="mt-3 text-slate-500">Last updated: November 23, 2026</p>

        <Section heading="1. Who this policy covers">
          <p>This policy describes information processing in OpenShare, including its website and mobile applications. OpenShare is operated by {LEGAL_OPERATOR}. We welcome privacy inquiries at {PRIVACY_CONTACT}.</p>
        </Section>

        <Section heading="2. Information we process">
          <p><strong>Account and profile data.</strong> Information you provide to register or maintain an account, such as your email address, name, username, profile details, preferences, and authentication-related data.</p>
          <p><strong>Workspace content.</strong> Projects, tasks, comments, announcements, invitations, messages, files, and other content that you create, upload, or share through OpenShare.</p>
          <p><strong>Technical and usage information.</strong> Information necessary to operate and protect the service, such as device and browser information, IP addresses, server logs, error information, and security events. If product analytics is enabled, usage events and session activity may also be collected.</p>
          <p><strong>Payments and communications.</strong> Subscription and transaction records when you purchase a plan, and correspondence when you contact us or receive account-related email.</p>
        </Section>

        <Section heading="3. How we use information">
          <p>We process data to create and secure accounts, authenticate users, provide project collaboration features, deliver messages and notifications, support subscriptions, respond to requests, prevent abuse and malware, maintain the service, and meet applicable legal obligations.</p>
          <p>When enabled in production, analytics and diagnostic tools may be used to understand feature usage, troubleshoot errors, and improve OpenShare.</p>
        </Section>

        <Section heading="4. Sharing and visibility">
          <p>Information in public projects, public profiles, or other content you choose to make public can be visible to other people. Information shared with collaborators may be accessible to authorized project members according to the applicable settings and permissions.</p>
          <p>We use service providers to operate OpenShare, including Render for application hosting, MongoDB Atlas for database hosting, and email-delivery providers such as Resend where configured. Stripe or Apple may process subscription and transaction information if a user purchases paid services through those providers. The codebase also supports optional PostHog analytics, but no PostHog key was configured in the Render production frontend environment when reviewed on November 23, 2026. Providers process information according to their roles and applicable agreements. We may disclose information where required by law or necessary to protect users and the service.</p>
        </Section>

        <Section heading="5. Cookies, analytics, and session recording">
          <p>OpenShare uses necessary browser and app storage for sign-in and service functionality. Our frontend includes optional analytics functionality capable of capturing events and session recordings. On November 23, 2026, the Render production frontend environment had no PostHog project key configured; this observation does not confirm the settings of every previously distributed app build. We will review privacy disclosures and any required consent or controls before enabling additional analytics or recording.</p>
        </Section>

        <Section heading="6. Security and international processing">
          <p>We use technical and organizational measures intended to protect information, including authenticated access and access controls. No online service can guarantee absolute security. Information may be stored or processed in countries where OpenShare and its service providers operate, subject to applicable requirements.</p>
        </Section>

        <Section heading="7. Data retention and account deletion">
          <p>Account holders can initiate account deletion in OpenShare Settings after confirming their identity. The deletion workflow attempts to remove the account record, OpenShare-managed profile images, owned projects and related files, personal notifications, usage/activity and gamification state, and other account-owned records.</p>
          <p>Some messages, comments, and contributions to shared conversations or projects may remain so that surviving collaborators retain their discussion and project history. The deletion workflow is designed to remove or anonymize certain links to the deleted account in these records, but user-authored content can itself contain identifying information. We do not represent that every instance of such information is erased.</p>
          <p>Billing providers may retain transaction records where required or permitted for taxes, accounting, disputes, fraud prevention, and legal compliance. Users with Apple-billed subscriptions must cancel their App Store subscription separately; deleting an OpenShare account does not itself stop Apple's renewals.</p>
          <p><strong>Operational logs.</strong> OpenShare's backend logs can contain account identifiers, connection information, timestamps, and application events. The Render Hobby workspace used for hosting currently provides a seven-day log retention window. Logs exported to another service, if any, may be subject to different retention arrangements.</p>
          <p><strong>Database backups.</strong> On November 23, 2026, automated MongoDB Atlas backups were inactive for OpenShare's production Free-tier cluster. Other infrastructure or third-party operational records may be retained separately, and backup arrangements may change.</p>
          <p><strong>Other records.</strong> Retention for payment-provider records, communications, legal obligations, and other service records depends on their purposes and applicable requirements. Where no specific duration applies, we keep information only as long as reasonably necessary for the relevant purpose, then delete or de-identify it when appropriate.</p>
          <p>See <Link to="/delete-account" className="text-violet-700 hover:underline">How to delete your OpenShare account</Link> for the account-deletion procedure.</p>
        </Section>

        <Section heading="8. Your privacy choices">
          <p>You can review or update available account and privacy settings, request a copy of your personal data, and request account deletion. Available rights depend on applicable law and the context of the request. Contact {PRIVACY_CONTACT} for other privacy questions or requests.</p>
        </Section>

        <Section heading="9. Changes and contact">
          <p>We may update this policy as the service evolves. We will revise the date above when changes take effect. Privacy inquiries: <a href={`mailto:${PRIVACY_CONTACT}`} className="text-violet-700 hover:underline">{PRIVACY_CONTACT}</a>.</p>
        </Section>
      </article>
    </main>
  );
}
