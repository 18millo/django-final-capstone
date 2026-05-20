import { useTheme } from '../providers/ThemeProvider'
import GSAP from 'gsap'
import { useEffect, useRef } from 'react'

const sections = [
  {
    title: 'Acceptance of Terms',
    content: 'By accessing or using CombatHub, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the platform. You must explicitly accept these terms during account creation. We reserve the right to update these terms at any time, with notice provided via email or platform notification. Continued use after changes constitutes acceptance of the updated terms.',
  },
  {
    title: 'User Accounts',
    content: 'You are responsible for maintaining the confidentiality of your account credentials. You must be at least 13 years old to use CombatHub. Accounts registered with false information, or accounts used for fraudulent activity, will be suspended. One person may hold only one account. You may delete your account at any time via Settings.',
  },
  {
    title: 'Premium Subscriptions',
    content: 'Premium features (including gallery uploads, verified badge, advanced analytics, and priority messaging) require an active subscription. Subscription fees are non-refundable except where required by law. CombatHub reserves the right to modify premium features with 30 days notice.',
  },
  {
    title: 'Content Ownership & Moderation',
    content: 'You retain full ownership of content you post (forum posts, gallery images, comments, product reviews). By posting, you grant CombatHub a non-exclusive, worldwide, royalty-free license to display, distribute, and promote your content within the platform. You represent that your content does not infringe any third-party rights. All content is subject to automated moderation — violent language, hate speech, profanity, and spam are automatically flagged and may result in content removal or account suspension.',
  },
  {
    title: 'Prohibited Conduct & Automated Flagging',
    content: 'You agree not to: (a) harass, bully, or threaten other users; (b) post hate speech, violence, or explicit content; (c) impersonate others or create虚假 accounts; (d) spam, scam, or engage in misleading practices; (e) attempt to access another user\'s account; (f) use the platform for illegal activities; (g) reverse engineer or abuse the platform\'s systems. Violations are automatically flagged by our content moderation system. Flagged content is reviewed by moderators and may result in warnings, content removal, temporary suspension, or permanent bans. Direct messages are not subject to automated content filtering to preserve user privacy.',
  },
  {
    title: 'Marketplace & Transactions',
    content: 'Products listed by vendors are sold by the vendor, not CombatHub. We facilitate the transaction but are not responsible for product quality, shipping, or returns. Disputes between buyers and vendors should be resolved directly. CombatHub may step in to mediate at its discretion.',
  },
  {
    title: 'Coaching & Gym Services',
    content: 'Coaching sessions and gym memberships booked through CombatHub are provided by independent coaches and gyms. CombatHub is a booking platform only and is not liable for the quality, safety, or outcome of training sessions. Users train at their own risk.',
  },
  {
    title: 'Reporting & Moderation',
    content: 'Users may report content or behavior that violates these terms via the Report button on posts, comments, gallery items, and profiles. Our moderation team reviews each report. Automated flags are also generated for profanity, violent content, and spam. Users with repeated violations face escalating penalties: warning → content removal → temporary suspension → permanent ban. Moderation decisions are at the sole discretion of CombatHub.',
  },
  {
    title: 'Intellectual Property',
    content: 'The CombatHub name, logo, design, and platform code are the intellectual property of CombatHub. You may not copy, modify, distribute, or create derivative works without explicit written permission.',
  },
  {
    title: 'Limitation of Liability',
    content: 'CombatHub is provided "as is" without warranties of any kind. We are not liable for damages arising from: (a) use or inability to use the platform; (b) actions of other users; (c) transactions between users; (d) data loss or breaches; (e) downtime or service interruptions. Our total liability is limited to the amount you have paid us in the past 12 months.',
  },
  {
    title: 'Privacy, Data & IP Logging',
    content: 'We collect and process data as described in our Privacy Policy. For security purposes, CombatHub logs and stores hashed IP addresses of all authenticated user activity. IP addresses are hashed using SHA-256 before storage — raw IPs are never stored. Logged data includes: hashed IP, user agent, timestamp, and action type. This data is retained for 90 days and used only for security auditing, abuse prevention, and troubleshooting. Your IP is hashed, not stored in plain text. You may request deletion of your account and associated data at any time by contacting support.',
  },
  {
    title: 'Termination',
    content: 'CombatHub may suspend or terminate your account at any time for violation of these terms. Upon termination, your access to all features ceases. We may retain certain data as required by law. You may terminate your account at any time through your settings page.',
  },
  {
    title: 'Governing Law',
    content: 'These terms are governed by the laws of Kenya. Any disputes shall be resolved in the courts of Nairobi, Kenya. This agreement constitutes the entire agreement between you and CombatHub regarding platform use.',
  },
]

export default function Terms() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const headerRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (headerRef.current) {
      GSAP.fromTo(headerRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
    }
    if (listRef.current) {
      const items = listRef.current.children
      GSAP.fromTo(items, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' })
    }
  }, [])

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div ref={headerRef} className="max-w-4xl mx-auto px-6 py-14 text-center">
          <div className="text-5xl mb-4">⚖️</div>
          <h1 className={'text-3xl md:text-4xl font-black tracking-tight ' + textClass}>Terms & Conditions</h1>
          <p className={'text-sm mt-3 max-w-lg mx-auto ' + mutedClass}>
            Last updated: May 2026. These terms govern your use of the CombatHub platform.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div ref={listRef} className="space-y-6">
          {sections.map((s, i) => (
            <div key={i} className={'rounded-2xl border p-6 md:p-8 transition-all hover:scale-[1.01] liquid-glass-card ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
              <div className="flex items-start gap-4">
                <span className={'text-xs font-black tracking-widest mt-0.5 shrink-0 ' + (isLight ? 'text-nike-light' : 'text-white/20')}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className={'text-base font-black tracking-tight mb-2 ' + textClass}>{s.title}</h3>
                  <p className={'text-sm leading-relaxed ' + mutedClass}>{s.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={'mt-12 p-6 rounded-2xl border text-center liquid-glass-card ' + (isLight ? 'bg-nike-red/5 border-nike-red/20' : 'bg-nike-red/10 border-nike-red/20')}>
          <p className={'text-sm font-bold ' + textClass}>For questions about these terms, contact legal@combathub.io</p>
        </div>
      </div>
    </div>
  )
}
