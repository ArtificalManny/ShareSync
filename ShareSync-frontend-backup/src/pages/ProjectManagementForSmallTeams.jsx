import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Gauge,
  ListChecks,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  UserRoundCheck,
  Workflow,
} from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";

const painPoints = [
  {
    icon: MessageCircle,
    title: "Too many status meetings",
    description:
      "When project information lives in people's heads, teams spend meetings reconstructing what happened instead of moving the work forward.",
  },
  {
    icon: ListChecks,
    title: "Shared task lists lose context",
    description:
      "A checklist can show what exists, but it often cannot explain ownership, dependencies, momentum, decisions, and why the work matters.",
  },
  {
    icon: UserRoundCheck,
    title: "Ownership becomes ambiguous",
    description:
      "Small teams move quickly, which makes it easy for responsibility to become implied instead of explicit. Important work can quietly wait for somebody.",
  },
  {
    icon: Workflow,
    title: "Big-company software adds overhead",
    description:
      "A small team should not need an administrator just to maintain its project system. The tool should clarify the work, not become another job.",
  },
];

const principles = [
  {
    number: "01",
    title: "Make ownership obvious",
    description:
      "Give important work a visible owner so the team does not have to guess who is moving it forward.",
  },
  {
    number: "02",
    title: "Keep context beside the project",
    description:
      "Connect Moves, discussion, project activity, and shared information so decisions are not scattered across disconnected tools.",
  },
  {
    number: "03",
    title: "Surface what needs attention",
    description:
      "Use momentum and activity signals to make quiet or stalled work easier to notice before a deadline exposes the problem.",
  },
  {
    number: "04",
    title: "Use less process, not more",
    description:
      "A good small-team system should make coordination lighter by reducing repeated check-ins and administrative work.",
  },
];

const faqs = [
  {
    question: "What should small teams look for in project management software?",
    answer:
      "Small teams usually benefit most from clear ownership, simple project organization, shared context, progress visibility, and collaboration that does not require heavy administration. The system should be easy enough to stay current while still giving the team a reliable view of the work.",
  },
  {
    question: "Can a small team use OpenShare for free?",
    answer:
      "Yes. OpenShare includes a free plan intended to keep the core product accessible to individuals and small groups. Optional paid plans expand capacity and team features when an organization needs more.",
  },
  {
    question: "How can project management software reduce status meetings?",
    answer:
      "When ownership, progress, activity, and project context are visible in the workspace, teammates can answer many routine status questions without scheduling another meeting. Meetings can then focus on decisions, tradeoffs, and problems that actually need discussion.",
  },
  {
    question: "When does a small team need more than a shared task list?",
    answer:
      "A shared task list starts becoming limiting when the team needs to understand dependencies, ownership, project context, discussion, progress signals, or why work is stalled. At that point, the team is managing a project rather than just maintaining a checklist.",
  },
  {
    question: "Is OpenShare only for businesses?",
    answer:
      "No. OpenShare can be used by small businesses, student teams, volunteer groups, creators, founders, and other groups that need to coordinate real projects and shared responsibilities.",
  },
  {
    question: "How does OpenShare help a small team stay accountable?",
    answer:
      "OpenShare connects work with ownership, project activity, progress, and shared visibility. That makes it easier for a team to see what is moving, what is waiting, and where somebody may need help without relying on constant manual follow-up.",
  },
  {
    question: "Does OpenShare prevent burnout?",
    answer:
      "OpenShare does not diagnose burnout or guarantee that burnout will be prevented. It is designed to make priorities, workload signals, activity, and momentum easier to see so teams can respond earlier when work begins to pile up or stall.",
  },
];

const comparisonRows = [
  [
    "Setup",
    "Complex configuration",
    "Start with the project and the work that matters",
  ],
  [
    "Ownership",
    "Often buried in task fields",
    "Keep responsibility visible to the team",
  ],
  [
    "Status",
    "Recurring manual updates",
    "Use project activity and progress signals",
  ],
  [
    "Collaboration",
    "Conversation scattered across tools",
    "Keep discussion close to the project",
  ],
  [
    "Management overhead",
    "Process grows with the tool",
    "Designed to keep coordination lightweight",
  ],
];

export default function ProjectManagementForSmallTeams() {
  useDocumentTitle(
    "Project Management Software for Small Teams",
    {
      description:
        "Give small teams one place to plan work, assign ownership, track momentum, collaborate, and stay accountable without adding more meetings or management overhead.",
      canonical:
        "https://openshare.ca/project-management-for-small-teams",
      robots: "index,follow",
    },
  );

  useEffect(() => {
    const id =
      "openshare-small-teams-structured-data";

    document.getElementById(id)?.remove();

    const script =
      document.createElement("script");

    script.id = id;
    script.type = "application/ld+json";

    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          name: "OpenShare",
          url:
            "https://openshare.ca/project-management-for-small-teams",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "Project management software for small teams that need clear ownership, collaboration, accountability, and visible project momentum.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "CAD",
            description:
              "OpenShare includes a free plan.",
          },
        },
        {
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        },
      ],
    });

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-3 font-black tracking-tight"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
              O
            </span>
            <span className="text-lg">
              OpenShare
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/project-management"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white md:inline-flex"
            >
              Project management
            </Link>
            <Link
              to="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-violet-100"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[680px] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.26),_transparent_58%)]"
          />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-32 lg:pt-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200">
                <Users className="h-4 w-4" />
                Built for teams that need clarity, not complexity
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                Project Management
                <span className="block">
                  for Small Teams
                </span>
                <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  Without the Overhead
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Give everyone one place to see what matters,
                who owns it, what is moving, and where the
                team needs attention—without adding another
                layer of management.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 font-bold shadow-xl shadow-violet-500/20 transition hover:-translate-y-0.5"
                >
                  Start using OpenShare free
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <a
                  href="#small-team-workflow"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 font-bold text-slate-200 transition hover:bg-white/10"
                >
                  See the small-team workflow
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Free plan
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Clear ownership
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Fewer status questions
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-violet-950/50 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                    Small-team pulse
                  </div>
                  <div className="mt-1 text-xl font-bold">
                    Website launch
                  </div>
                </div>

                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  On track
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Gauge className="h-4 w-4 text-violet-400" />
                    Momentum
                  </div>
                  <div className="mt-3 text-4xl font-black">
                    84
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Users className="h-4 w-4 text-cyan-400" />
                    Owners
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Landing page</span>
                      <span className="text-violet-300">
                        Maya
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Launch email</span>
                      <span className="text-cyan-300">
                        Alex
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-bold">
                    What needs attention
                  </span>
                  <span className="text-xs text-slate-500">
                    Visible to everyone
                  </span>
                </div>

                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    Final QA is waiting on one dependency
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    Launch copy completed
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-violet-300" />
                    Team discussion updated today
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-300">
                Why small teams outgrow simple task lists
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                The team gets bigger before the process does.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-400">
                A shared checklist can work when everyone
                already knows everything. As responsibilities
                spread out, the team needs a clearer way to
                understand ownership, progress, context, and
                what should happen next.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {painPoints.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 transition hover:border-violet-400/30"
                >
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-300">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-xl font-bold">
                    {title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-400">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="small-team-workflow"
          className="mx-auto max-w-7xl px-5 py-24 sm:px-8"
        >
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-300">
                A lighter operating rhythm
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Coordinate the team without managing the tool.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-400">
                OpenShare is designed around a simple idea:
                project software should reduce coordination
                work. It should make responsibilities and
                project health easier to understand at a glance.
              </p>
            </div>

            <div className="space-y-4">
              {principles.map((item) => (
                <article
                  key={item.number}
                  className="grid gap-5 rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:grid-cols-[auto_1fr]"
                >
                  <div className="text-3xl font-black text-violet-400">
                    {item.number}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">
                      {item.title}
                    </h3>
                    <p className="mt-3 leading-7 text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
            <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                  Fewer status meetings
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                  Let the workspace answer routine status questions.
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-400">
                  A small team should not need another meeting
                  just to learn who owns a task or whether work
                  moved yesterday. Shared project activity and
                  visible ownership can make routine status
                  available asynchronously.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Who owns the next Move?",
                    "What changed since yesterday?",
                    "Which work has gone quiet?",
                    "What needs a decision or unblock?",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                      <span className="text-slate-300">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/10 via-slate-900 to-cyan-500/10 p-7">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                  <Activity className="h-4 w-4" />
                  Team activity
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    ["Maya", "moved homepage design to review", "9:18"],
                    ["Alex", "completed launch email draft", "10:04"],
                    ["Jordan", "flagged one QA dependency", "11:32"],
                    ["Maya", "updated the launch discussion", "12:10"],
                  ].map(([name, action, time]) => (
                    <div
                      key={`${name}-${time}`}
                      className="rounded-2xl border border-white/10 bg-slate-950/65 p-4"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <span className="font-bold text-white">
                            {name}
                          </span>
                          <span className="text-slate-400">
                            {" "}{action}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs text-slate-600">
                          {time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-300">
              Small-team project management
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Enough structure to stay aligned.
              Not enough to slow you down.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-400">
              The goal is not to turn a five-person team into
              a miniature enterprise. It is to give the team
              enough shared structure that important work does
              not depend on memory, private notes, or constant
              verbal follow-up.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-[0.9fr_1fr_1.35fr] bg-slate-900 px-5 py-4 text-sm font-bold text-slate-300">
              <div>Need</div>
              <div>Heavyweight approach</div>
              <div className="text-violet-300">
                OpenShare approach
              </div>
            </div>

            {comparisonRows.map(([need, heavy, openshare]) => (
              <div
                key={need}
                className="grid grid-cols-[0.9fr_1fr_1.35fr] gap-3 border-t border-white/10 px-5 py-5 text-sm"
              >
                <div className="font-bold">
                  {need}
                </div>
                <div className="text-slate-500">
                  {heavy}
                </div>
                <div className="text-slate-300">
                  {openshare}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-300">
                  Part of the bigger picture
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Looking for the full project-management overview?
                </h2>

                <p className="mt-4 max-w-2xl leading-7 text-slate-400">
                  Explore how OpenShare approaches projects,
                  Moves, accountability, momentum, progress,
                  collaboration, and workload awareness across
                  teams of different sizes.
                </p>
              </div>

              <Link
                to="/project-management"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 font-bold transition hover:bg-white/10"
              >
                Explore project management
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-24 sm:px-8">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              Small-team FAQ
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Questions small teams ask before choosing a project tool.
            </h2>
          </div>

          <div className="mt-12 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5"
              >
                <summary className="cursor-pointer list-none font-bold">
                  <div className="flex items-center justify-between gap-5">
                    <span>{faq.question}</span>
                    <span className="text-xl text-violet-300 transition group-open:rotate-45">
                      +
                    </span>
                  </div>
                </summary>

                <p className="mt-4 max-w-3xl leading-7 text-slate-400">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-violet-600/25 via-fuchsia-500/10 to-cyan-500/10 p-8 text-center sm:p-14">
            <Sparkles className="mx-auto h-8 w-8 text-violet-300" />

            <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
              Give your small team one clear place to move the work.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Keep ownership visible, project context together,
              and momentum easier to understand—without adding
              another management layer.
            </p>

            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-black text-slate-950 transition hover:bg-violet-100"
            >
              Start with OpenShare free
              <ArrowRight className="h-5 w-5" />
            </Link>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              OpenShare includes a free plan.
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>
            © 2026 OpenShare
          </span>

          <div className="flex flex-wrap gap-5">
            <Link
              to="/"
              className="transition hover:text-white"
            >
              Home
            </Link>
            <Link
              to="/project-management"
              className="transition hover:text-white"
            >
              Project management
            </Link>
            <Link
              to="/privacy-manifesto"
              className="transition hover:text-white"
            >
              Privacy
            </Link>
            <Link
              to="/register"
              className="transition hover:text-white"
            >
              Start free
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
