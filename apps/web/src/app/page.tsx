import Link from "next/link"

const features = [
  {
    title: "Team Messaging",
    description:
      "Secure, moderated messaging between coaches, parents, and players with COPPA compliance built in.",
    icon: "💬",
  },
  {
    title: "Live Stats",
    description:
      "Track batting averages, goals, assists, and more. Export CSV reports for any player, team, or season.",
    icon: "📊",
  },
  {
    title: "Smart Schedules",
    description:
      "Build game schedules, generate tournament brackets, and send automatic reminders to families.",
    icon: "📅",
  },
  {
    title: "Content Moderation",
    description:
      "AI-powered message screening with Perspective API. Flag, review, and escalate in one dashboard.",
    icon: "🛡️",
  },
] as const

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="bg-primary text-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight">Fieldhouse</span>
          <Link
            href="/login"
            className="text-sm font-medium hover:underline"
          >
            Admin Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-primary text-white py-24">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            Fieldhouse
          </h1>
          <p className="text-xl text-light mb-10">
            Youth Sports, All In One Place
          </p>
          <Link
            href="/login"
            className="inline-block bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-3 rounded-lg text-lg transition-colors"
          >
            Get Your League License
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-primary text-center mb-12">
            Everything Your League Needs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-surface rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  {f.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-primary text-light py-8 text-center text-sm">
        &copy; {new Date().getFullYear()} Fieldhouse. All rights reserved.
      </footer>
    </div>
  )
}
