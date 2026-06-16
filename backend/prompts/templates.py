from __future__ import annotations

"""Prompt templates for the four generators.

Every builder returns a ``(system_prompt, user_prompt)`` tuple. The system
prompt enforces a strict JSON-only contract so the LLM service can parse the
response into a flat ``Dict[str, str]`` of GitHub-flavored Markdown sections.
"""

from typing import Dict, List, Tuple


# Central registry of the JSON keys each generator returns. Keeping this here
# lets the router stay DRY and guarantees prompts and parsing agree.
KEYS: Dict[str, List[str]] = {
    "summary": ["summary", "action_items", "risks", "dependencies", "next_steps"],
    "email": ["subject", "email"],
    "daily": ["completed", "in_progress", "upcoming"],
    "weekly": ["accomplishments", "challenges", "pending", "next_week_priorities"],
}

# Ordered Markdown section headers used by the streaming endpoint. The frontend
# splits the streamed Markdown back into these sections (one per output card),
# so the header text must stay in sync with the frontend SECTIONS map.
STREAM_HEADERS: Dict[str, List[str]] = {
    "summary": ["Summary", "Action Items", "Risks & Blockers", "Dependencies", "Next Steps"],
    "email": ["Subject", "Email"],
    "daily": ["Completed", "In Progress", "Upcoming"],
    "weekly": ["Accomplishments", "Challenges", "Pending", "Next Week Priorities"],
}


def _json_contract(keys: List[str]) -> str:
    """Shared instruction block that pins the exact JSON output contract."""
    key_list = ", ".join('"%s"' % k for k in keys)
    return (
        "Return ONLY a single valid JSON object with EXACTLY these keys: "
        + key_list
        + ". Each value is a GitHub-flavored Markdown string. Use '-' bullet "
        "lists and '**bold**' for emphasis. If a section has no content, return "
        "an empty string ''. Do not invent facts that are not supported by the "
        "notes. Do not wrap the JSON in code fences. Do not add commentary "
        "before or after the JSON object."
    )


# ---------------------------------------------------------------------------
# Meeting summary
# ---------------------------------------------------------------------------
def summary_prompt(text: str) -> Tuple[str, str]:
    keys = KEYS["summary"]
    system = (
        "You are an expert executive assistant who distills messy meeting notes "
        "into crisp, decision-ready summaries for busy leaders.\n\n"
        "Produce these sections:\n"
        "- summary: 2-4 sentences capturing the purpose, key decisions, and "
        "outcomes of the meeting.\n"
        "- action_items: a bullet list of concrete tasks. Where the notes make "
        "it clear, prefix each with the owner in bold, e.g. '- **Alice:** ...'. "
        "Be specific and actionable.\n"
        "- risks: a bullet list of risks, blockers, or open concerns raised.\n"
        "- dependencies: a bullet list of cross-team or external dependencies "
        "that must be resolved.\n"
        "- next_steps: a bullet list of the immediate next steps and follow-ups, "
        "including any dates or deadlines mentioned.\n\n"
        + _json_contract(keys)
    )
    user = (
        "Summarize the following meeting notes into the required JSON object.\n\n"
        "MEETING NOTES:\n\"\"\"\n" + text.strip() + "\n\"\"\""
    )
    return system, user


# ---------------------------------------------------------------------------
# Email generator
# ---------------------------------------------------------------------------
_TONE_GUIDE: Dict[str, str] = {
    "professional": (
        "polished, courteous, and businesslike; clear and respectful without "
        "being stiff"
    ),
    "friendly": (
        "warm, approachable, and conversational while remaining professional; "
        "uses a personable but not overly casual voice"
    ),
    "executive": (
        "concise, high-signal, and confident; leads with the point, suited for "
        "senior leaders who scan quickly"
    ),
    "concise": (
        "brief and to the point; short sentences, no filler, only essential "
        "information"
    ),
}


def email_prompt(text: str, tone: str) -> Tuple[str, str]:
    keys = KEYS["email"]
    tone_key = tone if tone in _TONE_GUIDE else "professional"
    tone_desc = _TONE_GUIDE[tone_key]
    system = (
        "You are a professional communications writer who turns rough notes into "
        "well-structured, ready-to-send emails.\n\n"
        "Write the email in a %s tone (%s).\n\n"
        "Produce these sections:\n"
        "- subject: a clear, specific subject line (plain text, no Markdown).\n"
        "- email: the full email body as Markdown. It MUST include: a greeting, "
        "one or more well-organized body paragraphs (use '-' bullet lists where "
        "it improves clarity), an explicit call to action, a polite sign-off, "
        "and the signature placeholder '[Your Name]' on its own final line.\n\n"
        % (tone_key, tone_desc)
        + _json_contract(keys)
    )
    user = (
        "Draft an email based on the following notes. Infer the recipient and "
        "intent from the content; keep all factual claims grounded in the "
        "notes.\n\nNOTES:\n\"\"\"\n" + text.strip() + "\n\"\"\""
    )
    return system, user


# ---------------------------------------------------------------------------
# Daily status report
# ---------------------------------------------------------------------------
def daily_report_prompt(text: str) -> Tuple[str, str]:
    keys = KEYS["daily"]
    system = (
        "You are an expert executive assistant who converts a person's working "
        "notes into a clean daily status report.\n\n"
        "Produce these sections:\n"
        "- completed: a bullet list of work finished today. Lead each item with "
        "a bold short label where helpful, e.g. '- **Bugfix:** ...'.\n"
        "- in_progress: a bullet list of work currently underway, with brief "
        "status where the notes provide it.\n"
        "- upcoming: a bullet list of tasks planned next, including any "
        "deadlines mentioned.\n\n"
        + _json_contract(keys)
    )
    user = (
        "Create a daily status report from the following notes.\n\n"
        "NOTES:\n\"\"\"\n" + text.strip() + "\n\"\"\""
    )
    return system, user


# ---------------------------------------------------------------------------
# Weekly report
# ---------------------------------------------------------------------------
def weekly_report_prompt(text: str) -> Tuple[str, str]:
    keys = KEYS["weekly"]
    system = (
        "You are an expert executive assistant who synthesizes a week's worth of "
        "working notes into a structured weekly report for stakeholders.\n\n"
        "Produce these sections:\n"
        "- accomplishments: a bullet list of the week's key achievements and "
        "shipped outcomes, emphasizing impact in bold where relevant.\n"
        "- challenges: a bullet list of obstacles, blockers, or issues faced.\n"
        "- pending: a bullet list of work still in flight or not yet started.\n"
        "- next_week_priorities: a bullet list of the most important priorities "
        "for the coming week, ordered by importance.\n\n"
        + _json_contract(keys)
    )
    user = (
        "Create a weekly report from the following notes.\n\n"
        "NOTES:\n\"\"\"\n" + text.strip() + "\n\"\"\""
    )
    return system, user


# ---------------------------------------------------------------------------
# Streaming (Markdown) prompts
# ---------------------------------------------------------------------------
# The streaming endpoint asks the model for Markdown (not JSON) so the response
# renders live as it arrives, then the frontend splits it by the section headers.
_STREAM_ROLE: Dict[str, str] = {
    "summary": "an expert executive assistant who distills messy meeting notes into crisp, decision-ready summaries",
    "email": "a professional communications writer who turns rough notes into polished, ready-to-send emails",
    "daily": "an expert executive assistant who turns working notes into a clean daily status report",
    "weekly": "an expert executive assistant who synthesizes a week of notes into a structured weekly report",
}

_STREAM_GUIDE: Dict[str, str] = {
    "summary": (
        "Under 'Summary' write 2-4 sentences on purpose, decisions, and outcomes. "
        "Under 'Action Items' use a bullet list, prefixing the owner in bold where clear "
        "(e.g. '- **Alice:** ...'). Under 'Risks & Blockers' bullet the risks/concerns. "
        "Under 'Dependencies' bullet cross-team or external dependencies. Under 'Next Steps' "
        "bullet the immediate follow-ups including any dates."
    ),
    "email": (
        "Under 'Subject' write a single clear subject line (plain text, no bullets). "
        "Under 'Email' write the full email as Markdown: a greeting, well-organized body "
        "paragraphs (bullets where helpful), an explicit call to action, a polite sign-off, "
        "and the signature placeholder '[Your Name]' on its own final line."
    ),
    "daily": (
        "Under 'Completed' bullet work finished today (bold a short label where helpful). "
        "Under 'In Progress' bullet work underway with brief status. Under 'Upcoming' bullet "
        "tasks planned next, including any deadlines."
    ),
    "weekly": (
        "Under 'Accomplishments' bullet the week's key achievements (bold impact where relevant). "
        "Under 'Challenges' bullet obstacles or blockers. Under 'Pending' bullet work still in "
        "flight. Under 'Next Week Priorities' bullet the top priorities, ordered by importance."
    ),
}


def stream_prompt(kind: str, text: str, tone: str = "professional") -> Tuple[str, str]:
    """Build a (system, user) prompt that yields Markdown with fixed section headers."""
    if kind not in STREAM_HEADERS:
        raise ValueError("Unknown generator kind '%s'." % kind)

    headers = STREAM_HEADERS[kind]
    header_lines = ", ".join("'## %s'" % h for h in headers)

    tone_clause = ""
    if kind == "email":
        tone_key = tone if tone in _TONE_GUIDE else "professional"
        tone_clause = "Write the email in a %s tone (%s).\n" % (tone_key, _TONE_GUIDE[tone_key])

    system = (
        "You are %s.\n\n" % _STREAM_ROLE[kind]
        + tone_clause
        + _STREAM_GUIDE[kind]
        + "\n\n"
        + "FORMAT RULES:\n"
        + "- Output GitHub-flavored Markdown ONLY.\n"
        + "- Use EXACTLY these level-2 headings, each on its own line, in this order: "
        + header_lines
        + ".\n"
        + "- Put content under each heading using '-' bullet lists or short paragraphs.\n"
        + "- If a section has no content, write '_None_' under it.\n"
        + "- Do not output JSON or code fences. Do not add any text before the first "
        + "heading or after the last section. Do not invent facts not supported by the notes."
    )
    user = (
        "Transform the following notes into the required Markdown sections.\n\n"
        "NOTES:\n\"\"\"\n" + text.strip() + "\n\"\"\""
    )
    return system, user
