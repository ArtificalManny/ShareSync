// enterprise-sales-inquiry-frontend-v1
import React, { useContext, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Loader2,
  Send,
  X,
} from 'lucide-react';
import { UserContext } from '../../context/UserContext';
import { submitEnterpriseInquiry } from '../../api/sales';

const TEAM_SIZES = [
  { value: '1-10', label: '1–10 people' },
  { value: '11-25', label: '11–25 people' },
  { value: '26-100', label: '26–100 people' },
  { value: '101-500', label: '101–500 people' },
  { value: '501+', label: '501+ people' },
];

const USE_CASES = [
  {
    value: 'team-collaboration',
    label: 'Team collaboration',
  },
  {
    value: 'portfolio-visibility',
    label: 'Portfolio and executive visibility',
  },
  {
    value: 'security-compliance',
    label: 'Security and compliance',
  },
  {
    value: 'sso-administration',
    label: 'SSO and administration',
  },
  {
    value: 'custom-integrations',
    label: 'Custom integrations',
  },
  {
    value: 'other',
    label: 'Something else',
  },
];

function resolveErrorMessage(error) {
  const value =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'We could not submit your inquiry. Please try again.';

  if (Array.isArray(value)) {
    return value[0] || 'Please check the form and try again.';
  }

  return String(value);
}

export default function ContactSalesModal({
  currentPlan = 'free',
  onClose,
}) {
  const { user } = useContext(UserContext);

  const initialName =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    user?.displayName ||
    user?.name ||
    user?.username ||
    '';

  const initialOrganization =
    user?.company ||
    user?.organization ||
    '';

  const [form, setForm] = useState(() => ({
    name: initialName,
    email: user?.email || '',
    organization: initialOrganization,
    teamSize: '',
    useCase: '',
    message: '',
  }));

  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget && !submitting) {
      onClose?.();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const result = await submitEnterpriseInquiry({
        name: form.name,
        email: form.email,
        organization: form.organization,
        teamSize: form.teamSize,
        useCase: form.useCase,
        message: form.message,
        currentPlan,
      });

      setSubmission(result || {
        message:
          'Thanks — we received your inquiry and will respond within one business day.',
      });
    } catch (error) {
      console.error(
        'Failed to submit Enterprise inquiry:',
        error,
      );

      setErrorMessage(resolveErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10020] overflow-y-auto overscroll-contain"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />

      <div className="relative z-10 flex min-h-full items-start justify-center p-4 pb-10 pt-16 sm:items-center sm:py-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-sales-title"
          className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl shadow-slate-950/30"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close Contact Sales"
            className="absolute right-4 top-4 z-10 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          {submission ? (
            <div className="px-6 py-14 text-center sm:px-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2
                id="contact-sales-title"
                className="mt-6 text-2xl font-black text-slate-950"
              >
                Inquiry received
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-6 text-slate-600">
                {submission.message ||
                  'Thanks — we received your inquiry and will respond within one business day.'}
              </p>

              <div className="mx-auto mt-6 max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
                Your inquiry is saved. We’ll reply to {form.email}.
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 px-6 py-7 sm:px-8">
                <div className="flex items-start gap-4 pr-10">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                    <Building2 className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">
                      OpenShare Enterprise
                    </div>

                    <h2
                      id="contact-sales-title"
                      className="mt-1 text-2xl font-black text-slate-950"
                    >
                      Tell us what your organization needs
                    </h2>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                      Share a few details and we will respond
                      within one business day.
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5 px-6 py-7 sm:px-8"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Your name
                    </span>

                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={120}
                      autoComplete="name"
                      value={form.name}
                      onChange={(event) =>
                        updateField('name', event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      placeholder="Your full name"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Work email
                    </span>

                    <input
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField('email', event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      placeholder="you@company.com"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Company or organization
                  </span>

                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={160}
                    autoComplete="organization"
                    value={form.organization}
                    onChange={(event) =>
                      updateField(
                        'organization',
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    placeholder="Organization name"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Team size
                    </span>

                    <select
                      required
                      value={form.teamSize}
                      onChange={(event) =>
                        updateField(
                          'teamSize',
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="">
                        Select team size
                      </option>

                      {TEAM_SIZES.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Primary need
                    </span>

                    <select
                      required
                      value={form.useCase}
                      onChange={(event) =>
                        updateField(
                          'useCase',
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="">
                        Select a primary need
                      </option>

                      {USE_CASES.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Anything else we should know?
                  </span>

                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={form.message}
                    onChange={(event) =>
                      updateField('message', event.target.value)
                    }
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    placeholder="Tell us about your workflow, security requirements, integrations, or rollout timeline."
                  />

                  <span className="mt-1 block text-right text-xs font-medium text-slate-400">
                    {form.message.length}/2000
                  </span>
                </label>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                  >
                    {errorMessage}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium leading-5 text-slate-500">
                    Prefer email?{' '}
                    <a
                      href="mailto:enterprise@openshare.ca?subject=OpenShare%20Enterprise%20Inquiry"
                      className="font-bold text-violet-600 hover:text-violet-700 hover:underline"
                    >
                      Email us directly
                    </a>
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending inquiry…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Contact OpenShare
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
