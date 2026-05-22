import { useState } from 'react'
import { useTheme } from '../providers/ThemeProvider'
import Reveal from '../components/ui/Reveal'

const BG = 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&w=1920&q=80'

const FAQS = [
  { q: 'What is CombatHub Premium?', a: 'Premium is a subscription that unlocks business tools for vendors, coaches, and gym owners — plus extra perks like advanced analytics, priority access, and an ad-free experience for athletes and all users.' },
  { q: 'How does the free trial work?', a: 'Sign up, choose your role, and add a payment method on the payment setup page. You get 30 days of all premium features completely free. No charges during the trial.' },
  { q: 'What happens after the trial ends?', a: 'When the 30-day trial expires, you are automatically granted a 7-day grace period. During this time you keep full access to premium features. After the grace period ends, premium features are locked and you revert to the free tier.' },
  { q: 'Will I be charged after the trial?', a: 'Not automatically. Payment processing (monthly/annual subscriptions via M-Pesa or card) will be introduced in a future update. For now, your premium simply expires.' },
  { q: 'How do I cancel my premium?', a: 'Go to Manage Premium and click "Cancel Premium". Your premium features will be revoked immediately. Since it is a free trial, there are no charges or refunds involved. You can also just let the trial and grace period expire naturally.' },
  { q: 'Can I reactivate after cancelling?', a: 'Yes. Go to the payment setup page again, re-enter your payment method, and you will receive another 30-day trial. There is no limit on how many times you can restart.' },
  { q: 'What payment methods are accepted?', a: 'We currently accept M-Pesa (Kenya) and credit/debit cards (Visa, Mastercard, Amex, Discover). More methods will be added in the future.' },
  { q: 'Is my payment information secure?', a: 'Yes. M-Pesa phone numbers and card details are stored securely in our database. We use industry-standard encryption and never expose full card numbers — only the last four digits and card brand are stored.' },
  { q: 'Why do vendors/coaches/gym owners need premium?', a: 'These roles have access to business tools — selling products, business dashboards, gallery uploads, inventory management, and growth analytics. Premium is required to unlock these features. Regular users (athletes, fans) can use CombatHub for free.' },
  { q: 'What does premium give athletes?', a: 'Athlete premium includes advanced profile stats, priority following, smart notifications, achievement badges, a personalized feed, event priority access, enhanced privacy controls, and an ad-free browsing experience.' },
  { q: 'What is the grace period?', a: 'The grace period is a 7-day extension granted automatically after your 30-day trial expires. It gives you extra time to decide if you want to keep premium before features are locked. You will receive a notification when it starts.' },
  { q: 'What happens to my products/data if premium expires?', a: 'Your products and data are preserved but hidden from the marketplace. Once you reactivate premium, everything is restored. Nothing is deleted.' },
  { q: 'Can I switch payment methods?', a: 'Yes. On the payment setup page, just enter your new payment info. It will replace your existing method on file.' },
  { q: 'I still have questions. How do I get help?', a: 'Send us a message through the app or contact support at mungailevi1@gmail.com. Premium users get priority responses.' },
]

export default function ContactUs() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [openFaq, setOpenFaq] = useState(null)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardBg = 'liquid-glass-card'

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">📞</div>
          <h1 className={'text-4xl md:text-5xl font-black tracking-tight mb-3 ' + textClass}>
            Contact <span className="text-nike-red">Us</span>
          </h1>
          <p className={'text-sm max-w-lg mx-auto ' + mutedClass}>
            Get in touch with the CombatHub team. We&apos;re here to help.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Reveal delay={50}>
            <div className={'p-6 rounded-2xl border text-center ' + borderClass + ' ' + cardBg}>
              <div className="text-3xl mb-3">📧</div>
              <h3 className={'font-bold text-sm tracking-widest uppercase mb-2 ' + textClass}>Email</h3>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=mungailevi1@gmail.com" target="_blank" rel="noopener noreferrer" className={'text-sm hover:text-nike-red transition-colors ' + mutedClass}>
                mungailevi1@gmail.com
              </a>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className={'p-6 rounded-2xl border text-center ' + borderClass + ' ' + cardBg}>
              <div className="text-3xl mb-3">📱</div>
              <h3 className={'font-bold text-sm tracking-widest uppercase mb-2 ' + textClass}>Phone</h3>
              <a href="tel:+254729624970" className={'text-sm hover:text-nike-red transition-colors ' + mutedClass}>
                0729624970
              </a>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className={'p-6 rounded-2xl border text-center ' + borderClass + ' ' + cardBg}>
              <div className="text-3xl mb-3">📍</div>
              <h3 className={'font-bold text-sm tracking-widest uppercase mb-2 ' + textClass}>Office</h3>
              <p className={'text-sm ' + mutedClass}>
                Nairobi, Chiromo<br />Parklands Plaza, 5th Floor
              </p>
            </div>
          </Reveal>
        </div>

        {/* FAQ */}
        <Reveal delay={200}>
          <div className={'rounded-2xl border p-6 md:p-8 backdrop-blur-sm ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl">❓</div>
              <div>
                <h2 className={'text-lg font-black tracking-tight ' + textClass}>Frequently Asked Questions</h2>
                <p className={'text-xs mt-0.5 ' + mutedClass}>Everything you need to know about CombatHub.</p>
              </div>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className={'rounded-xl border overflow-hidden transition-all duration-200 ' + borderClass + ' ' + cardBg}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className={'flex items-center justify-between w-full px-5 py-4 text-left transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/20' : 'hover:bg-white/5')}
                  >
                    <h3 className={'font-bold text-sm tracking-wide pr-4 ' + textClass}>{faq.q}</h3>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={'w-4 h-4 shrink-0 transition-transform duration-200 ' + (openFaq === i ? 'rotate-180' : '') + ' ' + mutedClass}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className={'overflow-hidden transition-all duration-300 ' + (openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
                    <p className={'px-5 pb-4 text-sm leading-relaxed ' + mutedClass}>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}