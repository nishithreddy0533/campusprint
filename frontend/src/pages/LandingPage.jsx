import { useNavigate } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    color: 'from-indigo-500 to-violet-500',
    bg: 'bg-indigo-50',
    title: 'Instant Upload',
    desc: 'Upload PDF, Word, or images in seconds. No USB drives, no queues.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    color: 'from-violet-500 to-pink-500',
    bg: 'bg-violet-50',
    title: 'B&W or Color',
    desc: 'Choose print type, copies, binding — full control from your browser.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    title: 'Live Tracking',
    desc: 'Real-time status updates. Know exactly when your order is ready.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    title: 'Smart Pricing',
    desc: 'ML-powered price prediction gives you estimates before you even submit.',
  },
];

const stats = [
  { value: '500+', label: 'Orders Processed' },
  { value: '< 2s', label: 'Price Prediction' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4 Types', label: 'Binding Options' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  useScrollReveal();

  return (
    <div className="flex flex-col items-center">

      {/* ── Hero ── */}
      <section className="w-full max-w-5xl mx-auto text-center pt-8 pb-16 px-4 relative">

        {/* Floating decorative blobs behind hero */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ zIndex: 0 }}
        >
          <div
            className="absolute float-slow"
            style={{
              width: 320, height: 320,
              background: 'radial-gradient(circle, rgba(199,210,254,0.5) 0%, transparent 70%)',
              borderRadius: '50%',
              top: -60, right: -80,
              filter: 'blur(40px)',
            }}
          />
          <div
            className="absolute float-medium"
            style={{
              width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(221,214,254,0.5) 0%, transparent 70%)',
              borderRadius: '50%',
              bottom: 20, left: -60,
              filter: 'blur(30px)',
            }}
          />
        </div>

        {/* Badge */}
        <div className="relative z-10 mb-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-indigo-100 text-indigo-600 text-xs font-semibold tracking-wide shadow-sm animate-scale-in">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Campus Printing, Reimagined
        </div>

        {/* Headline */}
        <h1 className="relative z-10 text-5xl sm:text-6xl font-extrabold text-gray-900 mb-5 leading-[1.08] tracking-tight animate-fade-in-up delay-100">
          Print Smarter,{' '}
          <span className="gradient-text">Skip the Queue</span>
        </h1>

        {/* Sub */}
        <p className="relative z-10 text-gray-500 text-lg max-w-lg mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200">
          Upload your document, configure your options, pay online, and track in real time — before you leave your desk.
        </p>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center mb-14 animate-fade-in-up delay-300">
          <button onClick={() => navigate('/order/new')} className="btn-primary py-3.5 px-8 text-base">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Order
          </button>
          <button onClick={() => navigate('/my-orders')} className="btn-secondary py-3.5 px-8 text-base">
            Track My Orders →
          </button>
        </div>

        {/* Floating mini-cards */}
        <div className="relative z-10 flex justify-center gap-4 flex-wrap animate-fade-in-up delay-400">
          <FloatingCard
            icon="✓"
            iconBg="bg-emerald-100 text-emerald-600"
            label="Order Ready"
            sub="Your printout is waiting"
            delay="float-slow"
          />
          <FloatingCard
            icon="₹"
            iconBg="bg-indigo-100 text-indigo-600"
            label="ML Price: ₹48"
            sub="94% confidence"
            delay="float-medium"
          />
          <FloatingCard
            icon="⚡"
            iconBg="bg-amber-100 text-amber-600"
            label="Processing"
            sub="Est. ready in 10 min"
            delay="float-fast"
          />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="w-full max-w-4xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`card card-float text-center reveal delay-${(i + 1) * 100}`}
            >
              <div className="text-2xl font-extrabold gradient-text">{s.value}</div>
              <div className="text-xs text-gray-400 font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="w-full max-w-5xl mx-auto px-4 mb-20">
        <div className="text-center mb-10 reveal">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Everything you need to print smarter</h2>
          <p className="text-gray-400 max-w-md mx-auto">A complete printing workflow designed for the modern campus experience.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`card card-float group cursor-default reveal delay-${(i + 1) * 100}`}
            >
              <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300`}
                style={{ color: '' }}
              >
                <span className={`bg-gradient-to-br ${f.color} bg-clip-text`} style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {f.icon}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="w-full max-w-4xl mx-auto px-4 mb-16 reveal">
        <div
          className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            boxShadow: '0 20px 60px rgba(99,102,241,0.35)',
          }}
        >
          {/* Decorative circles */}
          <div aria-hidden="true" className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
          <div aria-hidden="true" className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/10" />

          <h2 className="relative text-3xl font-extrabold text-white mb-3">Ready to print smarter?</h2>
          <p className="relative text-indigo-100 text-base mb-8 max-w-md mx-auto">
            Join hundreds of students already saving time with CampusPrint.
          </p>
          <button
            onClick={() => navigate('/order/new')}
            className="relative inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-2xl text-base hover:-translate-y-1 transition-transform duration-200"
            style={{ boxShadow: '0 8px 24px rgba(255,255,255,0.3)' }}
          >
            Start Your Order →
          </button>
        </div>
      </section>

    </div>
  );
}

function FloatingCard({ icon, iconBg, label, sub, delay }) {
  return (
    <div className={`flex items-center gap-3 bg-white/80 backdrop-blur-md border border-white/90 rounded-2xl px-4 py-3 shadow-lg ${delay}`}
      style={{ boxShadow: '0 4px 24px rgba(99,102,241,0.1)' }}
    >
      <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center text-sm font-bold`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-xs font-bold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
}
