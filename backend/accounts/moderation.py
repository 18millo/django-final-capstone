import re
from .models import ContentFlag

FLAG_PATTERNS = {
    'profanity': re.compile(
        r'\b(?:f[uo]ck?|sh[i1]t?|b[i1]tch|cunts?|whore|slut|d[i1]ck|pussy|ass(?:hole)?|bastard|damn|hell)\b',
        re.IGNORECASE,
    ),
    'violence': re.compile(
        r'\b(?:kill\s+(?:you|ur|u|yourself)|murder|shoot|stab|bomb|terrorist|behead|torture|rape)\b',
        re.IGNORECASE,
    ),
    'spam': re.compile(
        r'(?:buy\s+now|click\s+here|free\s+money|limited\s+offer|act\s+now|subscribe\s+now|follow\s+me\s+for|check\s+(?:out\s+)?my|DM\s+me|link\s+in\s+bio)',
        re.IGNORECASE,
    ),
}


def flag_content(user, content_type, content_id, text):
    if not text:
        return

    for reason, pattern in FLAG_PATTERNS.items():
        if pattern.search(text):
            match = pattern.search(text)
            flagged_text = match.group() if match else text[:100]

            ContentFlag.objects.create(
                user=user,
                content_type=content_type,
                content_id=content_id,
                reason=reason,
                flagged_text=flagged_text,
                status='auto_moderated' if reason == 'spam' else 'pending',
            )
