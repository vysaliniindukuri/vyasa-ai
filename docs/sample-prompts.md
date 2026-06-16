# Sample prompts

This document is the reference for Vyasa's **prompt engineering**. It describes the
internal system and user prompt templates used by each of the four generators in
[`backend/prompts/templates.py`](../backend/prompts/templates.py), the exact JSON keys each
returns, and worked examples — including the shared **IAM meeting note** input and example
JSON outputs.

These are the prompts that actually get sent to the LLM. The frontend never sees them; it
only sends the user's raw notes (plus provider/key/model) and receives structured JSON.

---

## Shared design

Every generator returns a tuple `(system_prompt, user_prompt)`:

- The **system prompt** sets a role ("You are an expert executive assistant…", etc.) and
  ends with a strict output contract that names the exact keys.
- The **user prompt** wraps the user's raw notes.

The strict output contract appended to **every** system prompt is:

> Return ONLY a single valid JSON object with EXACTLY these keys: `<keys>`. Each value is a
> GitHub-flavored Markdown string. Use `-` bullet lists and `**bold**`. If a section has no
> content, return an empty string `''`. Do not wrap in code fences. Do not add commentary.

Providers that support JSON mode are additionally called with
`response_format={"type":"json_object"}`; for the rest, the backend's `_extract_json()`
defensively parses the reply. Either way the service guarantees a `Dict[str, str]`
containing exactly the requested keys (missing keys default to `""`).

The expected keys per generator are also exported as the `KEYS` map in
`prompts/templates.py`:

```python
KEYS = {
    "summary": ["summary", "action_items", "risks", "dependencies", "next_steps"],
    "email":   ["subject", "email"],
    "daily":   ["completed", "in_progress", "upcoming"],
    "weekly":  ["accomplishments", "challenges", "pending", "next_week_priorities"],
}
```

---

## Shared example input — the IAM meeting note

The same raw note is used in the examples below so you can compare outputs across
generators.

```text
IAM platform sync — Tuesday 10:00, attendees: Priya (eng lead), Marcus (security),
Dana (PM), me.

We reviewed the SSO rollout. Login service migration to the new identity provider is
done in staging and Priya confirmed the smoke tests pass. Marcus flagged that the SSO
signing certificate from the security team is still pending — without it we can't promote
to production, and procurement said it could take up to a week. Dana wants the customer
demo on Friday no matter what, so we agreed to demo against staging if the cert isn't
ready.

Open items: Priya will finish the SCIM user-provisioning endpoint (about 60% done) and
write the runbook. Marcus is chasing the cert and will set up the prod secrets vault once
it lands. Dana will send the demo invite and prep the script. I need to update the
rollback plan and get sign-off from the platform team before any prod promotion.

Risks: cert delay could slip the prod launch past next sprint. Also the legacy auth
service still has ~2k active sessions we haven't migrated; we need a cutover window.
Depends on the security team (cert) and the platform team (prod sign-off).
```

---

## 1. Meeting Summary — `summary_prompt(text)`

**Endpoint:** `POST /generate-summary` → `SummaryResponse`
**Returns keys:** `summary`, `action_items`, `risks`, `dependencies`, `next_steps`

### System prompt (template)

```text
You are an expert executive assistant who turns raw, messy meeting notes into a crisp,
professional meeting summary. Be accurate and concise. Never invent facts that are not in
the notes. Attribute owners and deadlines when they are stated.

Produce these sections:
- summary: a tight 2–4 sentence overview of what the meeting covered and decided.
- action_items: concrete tasks as a '-' bullet list; include the owner and any due date in
  **bold** when known.
- risks: risks, blockers, and concerns as a '-' bullet list; '' if none.
- dependencies: external teams, systems, or inputs the work depends on, as a '-' bullet
  list; '' if none.
- next_steps: the immediate next steps as a short '-' bullet list.

Return ONLY a single valid JSON object with EXACTLY these keys: summary, action_items,
risks, dependencies, next_steps. Each value is a GitHub-flavored Markdown string. Use '-'
bullet lists and '**bold**'. If a section has no content, return an empty string ''. Do not
wrap in code fences. Do not add commentary.
```

### User prompt (template)

```text
Summarize the following meeting notes:

<<<NOTES>>>
{text}
<<<END NOTES>>>
```

### Example output (for the IAM note)

```json
{
  "summary": "The team reviewed the SSO rollout for the IAM platform. The login service migration to the new identity provider is complete in staging with passing smoke tests, but the SSO signing certificate from the security team is still pending and could take up to a week. To protect the Friday customer demo, the team agreed to demo against staging if the certificate is not ready in time.",
  "action_items": "- **Priya** — finish the SCIM user-provisioning endpoint (~60% done) and write the runbook\n- **Marcus** — chase the SSO signing certificate and set up the prod secrets vault once it lands\n- **Dana** — send the demo invite and prepare the demo script\n- **Me** — update the rollback plan and get platform-team sign-off before any prod promotion",
  "risks": "- **Certificate delay** could slip the production launch past next sprint\n- ~2k active sessions on the legacy auth service still need a **cutover window**",
  "dependencies": "- **Security team** — SSO signing certificate (procurement up to one week)\n- **Platform team** — production promotion sign-off",
  "next_steps": "- Confirm whether the demo runs against staging or production by Friday\n- Unblock the certificate and finalize the rollback plan ahead of prod promotion"
}
```

---

## 2. Email Generator — `email_prompt(text, tone)`

**Endpoint:** `POST /generate-email` → `EmailResponse`
**Returns keys:** `subject`, `email`
**Tone:** one of `professional` | `friendly` | `executive` | `concise` (default
`professional`).

The body must include a greeting, the body, a clear call to action, and a `[Your Name]`
signature placeholder. The `email` value is Markdown.

### System prompt (template)

```text
You are a professional communications writer. Turn the user's notes into a polished,
ready-to-send email in the requested tone.

Tone guide:
- professional: courteous, clear, business-appropriate; the safe default.
- friendly: warm and approachable while still professional; light, personable phrasing.
- executive: concise and outcome-focused for senior leaders; lead with the decision/ask.
- concise: as short as possible; no filler; skimmable.

Requirements:
- subject: a specific, compelling subject line (no "Re:" unless implied).
- email: the full email body as Markdown. It MUST include a greeting, a clear body, an
  explicit call to action, and end with a signature placeholder line exactly:
  "[Your Name]".

The requested tone is: {tone}.

Return ONLY a single valid JSON object with EXACTLY these keys: subject, email. Each value
is a GitHub-flavored Markdown string. Use '-' bullet lists and '**bold**'. If a section has
no content, return an empty string ''. Do not wrap in code fences. Do not add commentary.
```

### User prompt (template)

```text
Write a {tone} email based on these notes:

<<<NOTES>>>
{text}
<<<END NOTES>>>
```

### Example output (for the IAM note, `tone = "professional"`)

```json
{
  "subject": "IAM SSO Rollout: Staging Ready, Friday Demo Plan, and Certificate Dependency",
  "email": "Hi team,\n\nThanks for a productive IAM platform sync. A quick recap and the plan ahead of Friday's customer demo.\n\n**Where we are**\n- The login service migration to the new identity provider is complete in staging, and smoke tests are passing.\n- The SSO signing certificate from the security team is still pending and may take up to a week, which currently blocks production promotion.\n\n**Plan for the demo**\n- We'll demo against **staging** on Friday if the certificate isn't ready, so the date holds regardless.\n\n**Owners**\n- **Priya** — SCIM provisioning endpoint and runbook\n- **Marcus** — certificate follow-up and prod secrets vault\n- **Dana** — demo invite and script\n\n**Call to action:** Marcus, could you confirm the latest certificate ETA by Thursday EOD so we can lock the demo environment? Please flag any blockers before then.\n\nBest regards,\n[Your Name]"
}
```

---

## 3. Status Reports (daily) — `daily_report_prompt(text)`

**Endpoint:** `POST /generate-daily-report` → `DailyReportResponse`
**Returns keys:** `completed`, `in_progress`, `upcoming`

### System prompt (template)

```text
You are an expert executive assistant who writes clear daily status reports (standup-ready)
from raw work notes. Be specific and concise; never invent work that isn't in the notes.

Produce these sections, each as a '-' bullet list:
- completed: work finished today/recently.
- in_progress: work actively underway; note rough progress in **bold** when known.
- upcoming: the next tasks to pick up.

Return ONLY a single valid JSON object with EXACTLY these keys: completed, in_progress,
upcoming. Each value is a GitHub-flavored Markdown string. Use '-' bullet lists and
'**bold**'. If a section has no content, return an empty string ''. Do not wrap in code
fences. Do not add commentary.
```

### User prompt (template)

```text
Write a daily status report from these notes:

<<<NOTES>>>
{text}
<<<END NOTES>>>
```

### Example output (for the IAM note)

```json
{
  "completed": "- Completed the login service migration to the new identity provider in staging\n- Confirmed SSO smoke tests pass in staging",
  "in_progress": "- SCIM user-provisioning endpoint (**~60% done**) and runbook\n- Chasing the SSO signing certificate from the security team\n- Updating the rollback plan ahead of production promotion",
  "upcoming": "- Set up the production secrets vault once the certificate lands\n- Send the demo invite and prepare the Friday demo script\n- Plan a cutover window for the ~2k legacy auth sessions\n- Obtain platform-team sign-off before any prod promotion"
}
```

---

## 4. Weekly Reports — `weekly_report_prompt(text)`

**Endpoint:** `POST /generate-weekly-report` → `WeeklyReportResponse`
**Returns keys:** `accomplishments`, `challenges`, `pending`, `next_week_priorities`

### System prompt (template)

```text
You are an expert executive assistant who writes concise, high-signal weekly reports for
leadership from raw work notes. Be specific and outcome-oriented; never invent results.

Produce these sections, each as a '-' bullet list:
- accomplishments: meaningful results shipped or achieved this week.
- challenges: blockers, risks, and difficulties encountered.
- pending: work in flight or awaiting input that carries over.
- next_week_priorities: the most important focus areas for next week.

Return ONLY a single valid JSON object with EXACTLY these keys: accomplishments,
challenges, pending, next_week_priorities. Each value is a GitHub-flavored Markdown string.
Use '-' bullet lists and '**bold**'. If a section has no content, return an empty string
''. Do not wrap in code fences. Do not add commentary.
```

### User prompt (template)

```text
Write a weekly report from these notes:

<<<NOTES>>>
{text}
<<<END NOTES>>>
```

### Example output (for the IAM note)

```json
{
  "accomplishments": "- Migrated the login service to the new identity provider in **staging**\n- Verified SSO smoke tests pass in staging\n- Advanced the SCIM user-provisioning endpoint to **~60% complete**",
  "challenges": "- **SSO signing certificate** from the security team is pending and may take up to a week, blocking production\n- ~2k active sessions remain on the legacy auth service and still need a cutover window",
  "pending": "- Production secrets vault (blocked on the certificate)\n- Runbook and rollback plan\n- Platform-team sign-off for production promotion\n- Friday customer demo prep (invite + script)",
  "next_week_priorities": "- Unblock and install the SSO signing certificate, then promote to production\n- Complete the SCIM provisioning endpoint and runbook\n- Plan and schedule the legacy auth cutover window\n- Deliver the customer demo (staging fallback if needed)"
}
```

---

## Notes on robustness

- **Empty sections.** When the notes contain nothing for a section, the model is instructed
  to return `""`; the UI renders a subtle `—` placeholder.
- **Key coercion.** The backend keeps only the requested keys and coerces each value to a
  string (defaulting to `""`), so the response always matches the typed schema even if the
  model adds or omits fields.
- **No code fences / no commentary.** The strict contract forbids fenced blocks and
  prose; `_extract_json()` still strips ` ```json ` fences defensively if a model adds them.
