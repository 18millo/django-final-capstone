const EMOJIS = [
  '😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘',
  '😋','😛','😜','🤪','😝','🤗','🤭','🤔','😐','😑','😶','😏','😒','🙄','😬',
  '😮','😯','😲','😳','🥺','😢','😭','😤','😡','🤬','💀','☠️','👍','👎','👊',
  '✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤟','🤘','👌','✋','🤙',
  '💪','🔥','⭐','🏆','🥇','🥊','🥋','💯','💎','👑','💰','🎯','🎨','🎵','🎶',
  '💬','💭','👋','🖐️','💪','👀','🧠','💔','❤️','🧡','💛','💚','💙','💜','🖤',
  '💘','💖','💗','💓','💕','💋','👄','👊','💀','🔥','💯','🎉','✨','🚀','💪',
  '🙏','👑','⚔️','🛡️','🎯','🥋','🥊','🏋️','🤼','🤸','⛩️','🏆','🥇','🥈','🥉',
]

export default function EmojiPicker({ onSelect, onClose }) {
  return (
    <div className={'absolute bottom-full left-0 mb-2 p-2 rounded-xl border shadow-xl z-50'} style={{ width: '276px', maxHeight: '208px', overflowY: 'auto', backgroundColor: 'var(--color-nike-dark)', borderColor: 'var(--color-nike-gray)' }}>
      <div className="grid grid-cols-7 gap-0.5">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onMouseDown={(e) => { e.preventDefault(); onSelect(emoji); onClose() }}
            className="w-9 h-9 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
