import React from "react";
import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";

// The account-deletion contact must remain monitored.
const PRIVACY_CONTACT = "realMannyRivas@proton.me";

export default function DeleteAccountPage() {
  useDocumentTitle("Delete Your OpenShare Account", {
    description: "Instructions for requesting deletion of your OpenShare account and associated data.",
    canonical: "https://openshare.ca/delete-account",
    robots: "index,follow",
  });

  return (
    <main className="min-h-screen bg-white px-5 py-12 text-slate-900">
      <article className="max-w-3xl mx-auto">
        <Link to="/login" className="text-violet-700 font-medium hover:underline">← OpenShare</Link>
        <h1 className="text-4xl font-bold mt-6">Delete your OpenShare account</h1>
        <p className="mt-7 text-slate-700 leading-7">
          You can initiate deletion of your OpenShare account and associated account data from the web,
          even if you originally registered using the Android app.
        </p>
        <ol className="list-decimal ml-6 mt-5 space-y-3 text-slate-700 leading-7">
          <li><Link to="/login" className="text-violet-700 hover:underline">Sign in to OpenShare</Link> using your account.</li>
          <li>Open <Link to="/settings" className="text-violet-700 hover:underline">Settings</Link> and locate the account-deletion controls.</li>
          <li>Follow the confirmation prompts. Password-based accounts require their current password; Google-linked accounts require Google identity confirmation.</li>
        </ol>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link to="/login" className="px-5 py-3 rounded-lg bg-violet-700 text-white font-semibold">Sign in to request deletion</Link>
          <Link to="/settings" className="px-5 py-3 rounded-lg border border-slate-300 font-semibold">Go to Settings</Link>
        </div>
        <h2 className="font-semibold text-xl mt-10">What happens to data?</h2>
        <p className="mt-3 text-slate-700 leading-7">
          After successful identity confirmation, OpenShare's deletion workflow attempts to remove your
          account, OpenShare-managed avatar, owned projects, and other account-owned data. Some authored
          messages, comments, and contributions in shared workspaces may remain so collaborators can retain
          their conversation or project history. The system is designed to anonymize certain account
          references, but user-authored content may still contain identifying information.
        </p>
        <p className="mt-3 text-slate-700 leading-7">
          Some billing, tax, security, and compliance records may be retained where justified by law
          or legitimate requirements. Our current Render workspace retains application logs for seven days,
          and automated MongoDB Atlas backups were inactive on November 23, 2026.
          See our <Link to="/privacy" className="text-violet-700 hover:underline">Privacy Policy</Link> for details.
        </p>
        <h2 className="font-semibold text-xl mt-10">Subscriptions billed by Apple</h2>
        <p className="mt-3 text-slate-700 leading-7">
          Deleting your OpenShare account does not cancel an App Store subscription. If you have one,
          <a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noreferrer" className="text-violet-700 hover:underline"> manage your Apple subscriptions</a>
          separately to prevent future renewals.
        </p>
        <h2 className="font-semibold text-xl mt-10">Cannot access your account?</h2>
        <p className="mt-3 text-slate-700 leading-7">
          Email <a href={`mailto:${PRIVACY_CONTACT}?subject=OpenShare%20Account%20Deletion%20Request`} className="text-violet-700 hover:underline">{PRIVACY_CONTACT}</a> to initiate an account-deletion request if you cannot sign in, or if you need to request removal of identifiable content that remains in shared conversations. We may need to verify your identity before proceeding.
        </p>
      </article>
    </main>
  );
}
