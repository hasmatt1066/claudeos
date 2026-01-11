# Vision: ClaudeOS

## The premise

The future of personal computing is an AI that has access to your local filesystem and builds UI and software functionality as you need it, as you imagine it.

Software becomes a conversation, not a product. Instead of searching for an app that's 70% of what you need, you describe the problem and a capable agent builds exactly what you need, on your machine, for your context.

## The core insight

**ClaudeOS is a blank canvas, not a feature set.**

We don't build a job search tracker, a budget tool, or a calendar integration. We build the substrate—the shell, the engine, the context brain—and Claude builds everything else in response to what the user needs.

The user stories in this document aren't features we ship. They're examples of what users will *ask Claude to build*. Our job is to make sure the underlying structure supports this range of emergent functionality.

What we build:
- The Electron shell (chat, learning window, tool gallery)
- The Claude Agent SDK integration
- The context repository and retrieval system
- The tool persistence and launch infrastructure

What Claude builds (on demand):
- Command centers for complex projects
- Dashboards for tracking anything
- Automations and file watchers
- Integrations with cloud services
- Custom UIs for specific workflows
- Whatever the user describes

## The problem with today

**For users:**
- Personal data is scattered across apps and cloud services
- Context is lost as you switch between tools
- Most software has features you'll never use and is missing the one thing you actually need
- "Coding" feels like a foreign skill, inaccessible

**For AI tools:**
- Claude Code is powerful but lives in terminal—accessible to maybe 5% of knowledge workers
- ChatGPT can see your screen but can't do anything persistent
- No-code tools trap you in their abstractions
- Nothing connects your local reality to an agent that can act on it

---

## Technical foundation

### Architecture

ClaudeOS is an Electron application powered by the Claude Agent SDK.

```
┌────────────────────────────────────────────────────────┐
│                    ClaudeOS (Electron)                 │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                  Chat Interface                  │  │
│  │  Streaming conversation + dynamic UI generation  │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │               Learning Window                    │  │
│  │  Collapsible panel showing files and actions     │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │                 Tool Gallery                     │  │
│  │  Built tools as launchable widgets               │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                             │
│                          ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Claude Agent SDK (Node.js)            │  │
│  │  - Inherits Claude Code credentials              │  │
│  │  - Streaming structured output                   │  │
│  │  - Permission callbacks → UI prompts             │  │
│  │  - Session persistence                           │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                             │
│                          ▼                             │
│                    Claude API                          │
│              (via Max/Pro subscription)                │
└────────────────────────────────────────────────────────┘
```

### Why Electron

- Claude Agent SDK is Node.js native—runs directly in Electron's main process
- Consistent cross-platform rendering (same Chromium everywhere)
- Battle-tested for similar apps (VS Code, Slack, Discord)
- Trivial child process management for background tools
- ~100MB bundle size is acceptable for a desktop OS experience

### Authentication model

ClaudeOS requires Claude Code to be installed and authenticated. No API key management needed.

- Users authenticate once via `claude auth login`
- ClaudeOS inherits these credentials through the Agent SDK
- Max, Pro, and Team plans are supported
- No third-party OAuth—Anthropic doesn't offer this publicly

---

## First-run experience

```
1. Welcome to ClaudeOS

2. Let's connect to Claude.
   [Checking for Claude Code...]

   ├─ Found: Logged in as matt@example.com (Max)
   │  [Continue →]
   │
   └─ Not found
      ClaudeOS needs Claude Code to work.
      [Download Claude Code] → opens anthropic.com
      [I've installed it →] → triggers `claude auth login`

3. Where should ClaudeOS store your data?
   📁 ~/ClaudeOS  [Change...]
   This is your local brain—documents, tools, and context.

4. You're ready.
   [Start with a blank canvas]
   [Show me what ClaudeOS can do]
```

---

## The three surfaces

### 1. Chat interface

You talk, things happen.

> "I need something that watches my Downloads folder and automatically sorts files into client folders based on the filename."

No flags, no config, no "first install Node."

Progress is narrated, not logged:

> "Looking at your Downloads folder... I see 47 files. I'm going to create a small app that watches for new files and moves them based on patterns. Building that now... Done. It's running. Want me to show you what it did with a test file?"

Errors are human:

> "That didn't work because Excel has the file open. Close it and I'll try again."

Not `EBUSY: resource busy or locked`.

### 2. Learning window

This is **not** hidden complexity. It's **narrated** complexity.

A collapsible panel shows what Claude just did:
- Created a folder called `invoice-sorter`
- Made three files inside it
- Here's what each one does, in plain language

The principle: people discover that coding is just making files with text in them. After watching an agent build five tools, the mystique dissolves. Users graduate from consumer to collaborator to creator—not through a course, through exposure.

### 3. Tool gallery

Built tools persist and become launchable:
- Each tool appears as a card in the gallery
- Click to launch, right-click to configure or delete
- Tools can run in the background (system tray)
- Tools can have their own UI (mini windows, menu bar icons)

Tools are stored as files in the ClaudeOS home folder—visible, editable, yours.

---

## The context brain

A local repository where everything lands. Claude organizes, indexes, and retrieves.

### How it works

```
~/ClaudeOS/
├── inbox/              ← Drop anything here
│   └── (files land, get processed, moved)
│
├── context/            ← Claude-organized storage
│   ├── projects/
│   │   ├── consulting/
│   │   ├── mvp-club/
│   │   ├── garden-substack/
│   │   └── job-search/
│   ├── documents/
│   ├── conversations/
│   └── reference/
│
├── tools/              ← Built tools live here
│   ├── file-sorter/
│   ├── budget-tracker/
│   └── weekly-review/
│
└── .claudeos/          ← System config
    ├── settings.json
    └── credentials/
```

### The inbox pattern

Users don't have to think about where things go. They drop files, documents, transcripts, data—anything—into the inbox. Claude:

1. Watches the inbox for new items
2. Analyzes what each item is
3. Moves it to an appropriate location in the context tree
4. Names it in a way that helps retrieval (semantic, not arbitrary)
5. Indexes it for search

When the user asks a question or starts a task, Claude retrieves relevant context from this organized store.

### Retrieval, not just storage

- "What was that article I saved about training ROI?" actually works
- Claude surfaces relevant context when you're working on related tasks
- Your source of truth is local, Claude-managed
- Cloud services become endpoints, not habitats

---

## Bidirectional collaboration

Current AI is reactive. ClaudeOS is a partnership.

Claude surfaces things:
- "You haven't updated your budget in 12 days."
- "This task has been stuck—want to break it down?"
- "You mentioned wanting to post more—here's a draft from your notes."

Claude generates the interface for the next step:
- "To connect to Twitter, I need these three things—" *shows input fields*
- The UI is built in response to the moment

---

## Cloud tentacles

Local-first doesn't mean local-only.

- Pull data from cloud services into your local brain
- Push content out: "We just made a cool video—push to all my socials"
- Claude guides users through making these connections, generating the auth UI, storing credentials securely

---

## Who is this for?

### Primary persona: The Vibe Coder

Vibe coding—describing what you want and letting AI build it—is the foundational skill of working with AI. It's not a transitional hack; it's how humans will interact with computers going forward. ClaudeOS is the desktop environment for this new paradigm.

The primary user is someone who:
- Has learned to collaborate with AI to build things
- Has no formal software engineering training, but has deployed real apps
- Runs multiple projects across multiple domains (work, personal, creative, community)
- Wants one place to manage everything, with Claude as the connective tissue
- Wants to keep getting better—at thinking, planning, executing, and seeing value

**Example: Matt**

Matt runs a consulting company, manages an online community (MVP Club on Mighty Networks), writes a gardening Substack, and maintains multiple vibe coding projects. He juggles personal and work calendars, household budgets, correspondence with friends, and a professional presence on LinkedIn.

He's strong at execution, product operations, and product design. He knows his weak spots: business acumen, product-market fit, marketing, sales. He wants Claude not just to do tasks, but to shore up those gaps—to help him think better, plan better, and amplify his impact.

Matt doesn't want five apps and a terminal. He wants one unified interface where everything is connected, where Claude understands his full context, and where asking for help is as simple as describing what he needs.

### Secondary personas

| Persona | Description |
|---------|-------------|
| **The Curious Professional** | Uses apps well, never coded. Knows there's a better way but doesn't know how to build it. |
| **The Tinkerer** | Has tried no-code tools, maybe some scripts. Wants more control but real coding feels like a cliff. |
| **The Lapsed Developer** | Can code but doesn't want to for personal stuff. Could build it, but the setup overhead isn't worth it. |

Starting with personal computers. Enterprise is the harder and more valuable problem, but personal is where we learn what good looks like.

---

## What this is not

- **Not a no-code platform.** The code is real, visible, and yours.
- **Not a SaaS product.** It runs on your machine.
- **Not an AI wrapper.** It's a new computing paradigm—Claude as the OS layer.

---

## User stories

### Onboarding

1. **When** I first open ClaudeOS, **I want to** get started in under 2 minutes, **so I can** see if this is real before investing more time.

2. **When** I'm setting up, **I want to** use my existing Claude Max subscription, **so I** don't have to manage another API key or billing relationship.

3. **When** I choose my ClaudeOS home folder, **I want to** understand what will be stored there, **so I** feel in control of my data.

### Core loop: Describe → Build → Use

4. **When** I describe a problem in plain English, **I want** Claude to build a working solution, **so I** don't have to context-switch to another tool or write code myself.

5. **When** Claude is building something, **I want to** see progress in human terms, **so I** know it's working and can follow along.

6. **When** something goes wrong, **I want** an explanation I can act on, **so I** can fix it without Googling error codes.

7. **When** Claude builds a tool, **I want** it to appear somewhere tangible, **so I** can use it again without re-asking.

### Learning and growth

8. **When** Claude creates files, **I want to** see what was created and why, **so I** gradually understand how software works.

9. **When** I want to modify a tool, **I want to** describe the change in chat, **so I** don't have to edit code directly (but I can if I want).

10. **When** I'm working on something I'm weak at (marketing, sales, PMF), **I want** Claude to coach me through it, **so I** get better over time, not just get tasks done.

### Managing multiple domains

11. **When** I'm switching between consulting work, MVP Club, my Substack, and personal projects, **I want** Claude to hold context for each, **so I** don't have to re-explain everything every time.

12. **When** I need to check my calendar, **I want to** ask Claude and see a unified view (personal + work), **so I** don't have to open two apps.

13. **When** I need to post to LinkedIn or Substack, **I want to** draft and publish from ClaudeOS, **so I** don't have to context-switch to those platforms.

14. **When** I have a household project or budget to manage, **I want to** track it in ClaudeOS, **so I** don't need a separate spreadsheet or app.

### Tool gallery and persistence

15. **When** I've built several tools, **I want** a place to see and launch them all, **so I** don't lose track of what I've made.

16. **When** I want a tool to run automatically, **I want to** tell Claude to run it on a schedule or trigger, **so I** don't have to remember to launch it.

17. **When** a tool is running in the background, **I want** a subtle indicator, **so I** know it's active without it being intrusive.

### Document brain

18. **When** I drop files into my ClaudeOS folder, **I want** Claude to organize and index them, **so I** can find things by describing them later.

19. **When** I ask "what was that article about X?", **I want** Claude to find it, **so I** don't have to remember file names or folder structures.

### Proactive partnership

20. **When** I haven't touched a project in a while, **I want** Claude to gently remind me, **so I** don't let things slip.

21. **When** I'm stuck, **I want** Claude to offer to break the problem down, **so I** can make progress without figuring out the next step myself.

22. **When** there's a natural next action from my notes, **I want** Claude to surface it, **so I** capture value from things I've written.

23. **When** I'm about to make a decision in a weak area (pricing, positioning, sales), **I want** Claude to offer a second opinion or framework, **so I** make better decisions.

### Cloud connections

24. **When** I want to connect a cloud service (Google Calendar, Mighty Networks, Substack, LinkedIn), **I want** Claude to guide me through auth step-by-step, **so I** don't have to figure out OAuth or API keys.

25. **When** I say "post this to LinkedIn," **I want** it to just work, **so I** don't have to open another app.

### Amplification

26. **When** I'm planning something complex, **I want** Claude to help me think through it, **so I** get better at planning, not just execution.

27. **When** I complete a project, **I want** Claude to help me reflect on what worked and what didn't, **so I** compound my learning.

28. **When** I'm unsure if I'm focusing on the right thing, **I want** Claude to help me zoom out, **so I** stay aligned with what actually matters.

---

## Example: Job search command center

This illustrates how ClaudeOS works in practice. The user doesn't get a "job search feature"—they describe what they need, and Claude builds it.

**User:** "Hey Claude, I'm looking for a new job. I'd love for you to make a command center for managing this project and help me operationalize the search so I actually get better at it."

**Claude builds:**
- A dashboard tracking applications, networking events, and follow-ups
- A system to surface relevant job postings based on the user's criteria
- Reminders to apply to networking events and schedule time to attend
- A friction log: "You haven't applied to anything in 5 days. What's blocking you?"
- Weekly prompts: "Let's review what's working and what's not."

**What appears in the tool gallery:** "Job Search Command Center" — launchable, persistent, evolving as the search progresses.

**The key insight:** Claude isn't just doing tasks. It's helping the user get better at job searching—identifying weak spots, reducing friction, building habits.

---

## More use cases (Claude-built, not hardcoded)

1. **Personal finance.** Budget tracker that imports bank CSVs, categorizes spending, shows trends.
2. **Task/project dashboard.** Personal tasks and projects with custom views, connected to automations.
3. **File automation.** Watch folders, sort documents, trigger workflows.
4. **Slide decks.** Generate presentations from notes or outlines.
5. **Weekly reviews.** Summarize activity, surface stuck items, draft priorities.
6. **Client project tracker.** For consulting work—track deliverables, hours, invoices.
7. **Content calendar.** Manage Substack posts, LinkedIn presence, drafts in progress.
8. **Community management.** Track MVP Club engagement, surface members who need attention.
9. **Household projects.** Budget, timeline, and task tracking for home improvements.
10. **Learning sprints.** Structured approach to getting better at a weak area (marketing, sales, etc.).

---

## The long-term frame

ClaudeOS is a step toward running Claude **as** the operating system. Not replacing Windows or Mac, but becoming the real interface. The filesystem, apps, cloud services—all become backends that Claude orchestrates.

You stop context-switching between apps and start just... working.

---

*This document is a starting point. The vision will evolve as we build.*
