import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Folder,
  GraduationCap,
  ListChecks,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";

const features = [
  {
    icon: Folder,
    title: "Keep the whole project in one place",
    description:
      "Give work a clear home for plans, decisions, files, discussion, progress, and the people responsible for moving it forward.",
  },
  {
    icon: ListChecks,
    title: "Turn plans into clear Moves",
    description:
      "Break projects into concrete next actions so people know what matters now instead of digging through an endless backlog.",
  },
  {
    icon: Users,
    title: "Build accountability into the workflow",
    description:
      "Shared ownership, visible progress, and project activity make accountability part of the system instead of another status meeting.",
  },
  {
    icon: Activity,
    title: "See momentum while work is happening",
    description:
      "OpenShare is designed to surface movement, quiet periods, and progress signals before a project simply disappears into the background.",
  },
  {
    icon: BarChart3,
    title: "Understand progress, not just task counts",
    description:
      "Use project signals and activity context to understand whether work is actually advancing—not merely whether a list contains more checkboxes.",
  },
  {
    icon: MessageCircle,
    title: "Keep collaboration beside the work",
    description:
      "Project conversation, updates, and collaboration stay connected to the project so context does not have to live across disconnected tools.",
  },
];

const audiences = [
  {
    icon: User,
    title: "Individuals",
    description:
      "Organize ambitious personal projects without turning your workspace into administrative overhead.",
  },
  {
    icon: GraduationCap,
    title: "Students",
    description:
      "Coordinate assignments, group projects, research, deadlines, and shared responsibilities from one project space.",
  },
  {
    icon: Users,
    title: "Small teams",
    description:
      "Give everyone visibility into priorities, ownership, progress, and what needs attention next.",
  },
  {
    icon: Building2,
    title: "Growing organizations",
    description:
      "Create a stronger operating rhythm as projects and collaboration become more complex.",
  },
];

const faqs = [
  {
    question: "What is project management software?",
    answer:
      "Project management software helps people plan work, organize responsibilities, coordinate teams, track progress, and keep the information needed to finish a project in one place. The best system is not the one with the most fields—it is the one a team can actually use to keep work moving.",
  },
  {
    question: "Is OpenShare free project management software?",
    answer:
      "OpenShare includes a free plan designed to make the core product accessible to individuals and small groups. Optional paid plans expand capacity and team features for organizations that need more.",
  },
  {
    question: "Can I use OpenShare for a small team?",
    answer:
      "Yes. OpenShare is designed for collaborative projects where a small team needs clear responsibilities, shared project context, progress visibility, and an easy way to see what should move next.",
  },
  {
    question: "How does OpenShare help with accountability?",
    answer:
      "OpenShare connects work with ownership, progress, activity, and shared project visibility. That makes it easier to see what is moving, what is waiting, and where attention is needed without turning every update into a meeting.",
  },
  {
    question: "How is OpenShare different from a basic task manager?",
    answer:
      "A basic task manager is mainly a list of things to do. OpenShare is built around the larger project: the work, the people, the discussion, momentum, progress signals, and the context that explains why each Move matters.",
  },
  {
    question: "Can students use OpenShare for project management?",
    answer:
      "Yes. Students can use projects to coordinate coursework, group assignments, research, personal goals, and other work that benefits from shared responsibilities and visible progress.",
  },
  {
    question: "How does OpenShare approach burnout?",
    answer:
      "OpenShare is designed to make workload, activity, priorities, and momentum easier to see so people can respond when work begins to stall or pile up. It does not diagnose burnout or guarantee that burnout will be prevented.",
  },
];

const comparisonRows = [
  ["Work organization", "A list of tasks", "Projects, Moves, context, and ownership"],
  ["Accountability", "Manual follow-up", "Shared progress and responsibility"],
  ["Progress", "Completed vs. incomplete", "Momentum and project activity"],
  ["Collaboration", "Often separated from tasks", "Conversation beside the project"],
  ["Workload awareness", "Usually limited", "Designed to make project signals visible"],
];

export default function ProjectManagement() {
  useDocumentTitle(
    "Project Management Software Without the Burnout",
    {
      description:
        "Plan projects, assign work, build accountability, track momentum, and keep teams moving without burning them out. Try OpenShare free.",
      canonical:
        "https://openshare.ca/project-management",
      robots: "index,follow",
    },
  );

  useEffect(() => {
    const id =
      "openshare-project-management-structured-data";

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
          url: "https://openshare.ca/project-management",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "Project management software for planning work, building accountability, tracking momentum, and collaborating around projects.",
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
            className="absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.25),_transparent_55%)]"
          />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-32 lg:pt-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200">
                <Sparkles className="h-4 w-4" />
                Project management built around momentum
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                Project Management
                <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  Without the Burnout
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Plan the work. Know what matters next.
                Keep everyone accountable. See momentum
                before projects start slipping.
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
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 font-bold text-slate-200 transition hover:bg-white/10"
                >
                  See how it works
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Free plan
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Individuals and teams
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Web workspace
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-violet-950/50 backdrop-blur-xl sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
                      Project pulse
                    </div>
                    <div className="mt-1 text-xl font-bold">
                      Product launch
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    Moving
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Activity className="h-4 w-4 text-violet-400" />
                      Momentum
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-4xl font-black">
                        78
                      </span>
                      <span className="pb-1 text-sm text-emerald-300">
                        active
                      </span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      Critical Moves
                    </div>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Finish onboarding</span>
                        <span className="text-violet-300">
                          Alex
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>QA release</span>
                        <span className="text-cyan-300">
                          Maya
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-bold">
                      Team activity
                    </span>
                    <span className="text-xs text-slate-500">
                      Live project context
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      "Launch copy moved to review",
                      "Pricing page Move completed",
                      "QA discussion updated",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 text-sm text-slate-300"
                      >
                        <span className="h-2 w-2 rounded-full bg-violet-400" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-y border-white/10 bg-white/[0.025]"
        >
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-300">
                What project management should do
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Help people finish the project—not manage
                the project manager.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-400">
                A project management system should reduce
                uncertainty. Everyone should be able to see
                what the project is, what matters next, who
                owns the work, and whether progress is
                actually happening.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
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

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-300">
                Accountability without micromanagement
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Make the state of the work visible.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-400">
                Accountability works better when people do
                not need to constantly ask, “Where are we
                on this?” OpenShare is designed so ownership,
                project activity, and progress can answer
                that question as part of normal work.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Clear next actions instead of vague project status",
                  "Shared ownership instead of private to-do lists",
                  "Project activity instead of constant check-in meetings",
                  "Visible momentum instead of waiting for a deadline to reveal trouble",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span className="text-slate-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/10 via-slate-900 to-cyan-500/10 p-7">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                Project signal
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      Momentum
                    </span>
                    <span className="text-emerald-300">
                      Healthy
                    </span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-4/5 rounded-full bg-gradient-to-r from-violet-500 to-emerald-400" />
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5">
                  <div className="font-bold text-amber-200">
                    One area needs attention
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    A critical Move has stayed quiet while
                    dependent work is approaching.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                  <div className="font-bold">
                    Next action
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Reconfirm ownership and unblock the
                    dependency before more work stacks up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                Burnout-aware by design
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                More work is not the same thing as more progress.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-400">
                Traditional project tracking can make it easy
                to keep adding tasks while losing sight of
                capacity and momentum. OpenShare is designed
                to make those signals more visible so teams
                can respond earlier when work begins to stall,
                accumulate, or lose focus.
              </p>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm leading-6 text-slate-400">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
                OpenShare does not diagnose burnout and cannot
                guarantee that burnout will be prevented. The
                product is designed to improve visibility into
                the work signals teams use to make better
                decisions.
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-300">
              Built for real projects
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
              Project management for one person or a growing team.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-3xl border border-white/10 bg-slate-900/70 p-6"
              >
                <Icon className="h-7 w-7 text-violet-300" />
                <h3 className="mt-5 text-xl font-bold">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-slate-400">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-300">
                Beyond a task list
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Project management needs context.
              </h2>
            </div>

            <div className="mt-12 overflow-hidden rounded-3xl border border-white/10">
              <div className="grid grid-cols-[1.1fr_1fr_1.25fr] bg-slate-900 px-5 py-4 text-sm font-bold text-slate-300">
                <div>Capability</div>
                <div>Basic task list</div>
                <div className="text-violet-300">
                  OpenShare approach
                </div>
              </div>

              {comparisonRows.map(([capability, basic, openshare]) => (
                <div
                  key={capability}
                  className="grid grid-cols-[1.1fr_1fr_1.25fr] gap-3 border-t border-white/10 px-5 py-5 text-sm"
                >
                  <div className="font-bold">
                    {capability}
                  </div>
                  <div className="text-slate-500">
                    {basic}
                  </div>
                  <div className="text-slate-300">
                    {openshare}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-24 sm:px-8">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              Project management FAQ
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Questions people ask before choosing a project tool.
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
              Give your next project a clearer operating system.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Organize the work, make ownership visible,
              and build momentum without adding more
              administrative overhead.
            </p>

            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-black text-slate-950 transition hover:bg-violet-100"
            >
              Start with OpenShare free
              <ArrowRight className="h-5 w-5" />
            </Link>
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
