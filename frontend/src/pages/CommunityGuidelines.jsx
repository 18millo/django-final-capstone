import { useTheme } from '../providers/ThemeProvider'

const guidelines = [
  {
    title: 'Respect Everyone',
    desc: 'Treat all members with respect. Harassment, hate speech, bullying, or discrimination of any kind will not be tolerated.',
    icon: '🤝',
  },
  {
    title: 'No Spam or Self-Promotion',
    desc: 'Do not spam links, repeatedly promote products/services, or engage in unsolicited advertising. Vendors may promote through their official store only.',
    icon: '🚫',
  },
  {
    title: 'Keep It Safe',
    desc: 'Do not share personal contact information (phone, address, financial details) publicly. Report suspicious behavior immediately.',
    icon: '🛡️',
  },
  {
    title: 'No Doxxing or Impersonation',
    desc: 'Posting private information about others or impersonating another person, brand, or organization is strictly prohibited.',
    icon: '🔒',
  },
  {
    title: 'Appropriate Content Only',
    desc: 'All content must be appropriate for a general audience. No explicit, violent, or illegal material. This includes profile pictures, messages, and posts.',
    icon: '📝',
  },
  {
    title: 'Report Violations',
    desc: 'If you see something that violates these guidelines, report it to our team. We review all reports and take appropriate action, including account suspension.',
    icon: '🚨',
  },
]

export default function CommunityGuidelines() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h1 className={'text-3xl font-black tracking-tight ' + textClass}>Community Guidelines</h1>
          <p className={'text-sm mt-3 max-w-lg mx-auto ' + mutedClass}>
            CombatHub is built on respect, safety, and authenticity. These guidelines keep our community strong.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guidelines.map((g, i) => (
            <div key={i} className={'rounded-2xl border p-6 transition-all hover:scale-[1.02] liquid-glass-card ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
              <div className="text-3xl mb-3">{g.icon}</div>
              <h3 className={'text-base font-black tracking-tight mb-2 ' + textClass}>{g.title}</h3>
              <p className={'text-sm leading-relaxed ' + mutedClass}>{g.desc}</p>
            </div>
          ))}
        </div>

        <div className={'mt-12 p-6 rounded-2xl border text-center liquid-glass-card ' + (isLight ? 'bg-nike-red/5 border-nike-red/20' : 'bg-nike-red/10 border-nike-red/20')}>
          <p className={'text-sm font-bold ' + textClass}>Violations may result in account warnings, temporary suspension, or permanent removal from CombatHub.</p>
        </div>

        <div className={'mt-8 text-center text-xs ' + mutedClass}>
          <p>Guidelines last updated: May 2026</p>
          <p className="mt-1">Questions? Contact our support team.</p>
        </div>
      </div>
    </div>
  )
}
