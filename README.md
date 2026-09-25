# TaskDrop ⚡

> **The frictionless, AI-native task and mind-dumping workspace built for high-output thinkers.**

---

## 💡 The Philosophy & Concept

Most modern task management applications get in your way. They demand too many clicks, dropdowns, dates, project folders, and complex workflows just to record a fleeting thought. The cognitive friction often kills the very flow state you were trying to preserve.

**TaskDrop** is designed with a fundamentally different premise: **zero cognitive resistance**.

It serves as your external brain buffer—a fast, local-first canvas where you can dump your mental queue in natural language, collaborate with AI models to plan and prioritize your life, and stay in total control of your data with zero lock-in.

```
┌─────────────────┐       Instant Dump       ┌─────────────────────────┐
│   Your Brain    │ ───────────────────────> │        TaskDrop         │
│ (Raw Thoughts)  │                          │  (Smart NL Parsing)     │
└─────────────────┘                          └─────────────────────────┘
         ▲                                                │
         │                                                │ 1-Click Payload
         │ AI Executive Summary                           ▼
┌─────────────────┐       Atomic Paste       ┌─────────────────────────┐
│ LLM / Assistant │ <─────────────────────── │ LLM-Optimized Clipboard │
│ (Claude/GPT/etc)│ ───────────────────────> │  (Prompts + Memories)   │
└─────────────────┘                          └─────────────────────────┘
```

---

## ✨ Key Pillars

### 1. 🧠 Frictionless Brain Dump & Natural Language Engine

Type commitments exactly how you think them. TaskDrop instantly understands deadlines, recurring habits, tags, priorities, and sub-notes on the fly:

- `"Tomorrow 10am tech sync with team !urgent #work // bring roadmap"`
- `"Every day 8am morning workout #fitness"`
- `"Friday evening review pull requests !low"`
- Supports both **English** (LTR) and **Persian** (RTL) natural language date and time recognition.

### 2. 🤖 AI-Native Roundtripping (Payload Drops)

TaskDrop bridges your personal workflow with large language models (Claude, ChatGPT, Gemini, DeepSeek, or local models):

- **One-Click AI Payload**: Copies your active tasks, backlog, completed milestones, pinned focus notes, and persistent AI preferences into an LLM-optimized prompt.
- **Intelligent Executive Delegation**: Ask your favorite AI to act as your chief of staff—break down big projects, reschedule overdue tasks based on your energy levels, or eliminate low-impact clutter.
- **Instant Paste & Merge**: Paste the AI response straight back into TaskDrop. The app intelligently merges changes with atomic safety and full undo support.
- **Persistent AI Memory**: Configure custom instructions (e.g., _"Prioritize deep-work coding in the morning, keep meetings after 2 PM"_) that automatically travel with every AI payload.

### 3. 🔒 Local-First, End-to-End Encrypted (E2EE) Sync

Your daily tasks, thoughts, and private reflections belong to you alone.

- **Instant & Offline-First**: Works entirely offline with ultra-fast local storage. No spinners, no network latency.
- **Zero-Knowledge Cloud Relay**: Optional seamless real-time synchronization between devices using client-side **AES-GCM 256-bit encryption**. The sync server never sees your unencrypted task data.
- **QR & Token Pairing**: Instant device pairing via scan-and-go QR codes or encrypted tokens.

### 4. 📊 Daily Digest & Momentum Tracking

- **Daily Standup & Digest Generator**: Formats your completed achievements, current agenda, and tomorrow’s commitments into clean GitHub-flavored Markdown—ready to paste into Slack, Discord, email, or a daily journal.
- **7-Day Streak & Consistency Flame**: Visual feedback loop that builds productive daily momentum without shame mechanics.
- **Focus Pinboard ("Keep in Sight")**: A lightweight pinboard at the top of your workspace for core reminders and north-star thoughts that shouldn't be treated as checkable tasks.

### 5. 🎨 Radical Minimalism & Scoped Metadata Facets

- **Zero-Clutter Canvas by Default**: The interface stays clean and focused on raw execution. No mandatory sidebars, no multi-level dropdowns, and no noisy folder hierarchies unless you want them.
- **Infinite Customization via Scoped Tags**: Organize tasks across any dimension using key-value tags (e.g., `#area:work`, `#area:personal`, `#area:ngo`, `#type:routine`, `#project:redesign`).
- **AI-Managed Taxonomy**: Large language models understand and curate your scoped metadata effortlessly during import/export without breaking the schema or cluttering your canvas.
- **Dynamic On-Demand Tabs**: When scoped tags are present, sleek contextual tabs and faceted filters appear seamlessly to let you slice your focus.

### 6. 🌐 Bilingual & Truly Cross-Platform

- **English & Persian Native Support**: Complete bidirectional UI layout switching (LTR / RTL), custom typography, and locale-aware calendar formatting.
- **Everywhere You Are**: Available as an installable Progressive Web App (PWA) with desktop keyboard shortcuts, and as a native standalone Android APK with lock-screen alarms and background notifications.

---

## ⌨️ Essential Keyboard Navigation

TaskDrop is built for speed and keyboard enthusiasts:

| Shortcut                                                   | Action                                     |
| :--------------------------------------------------------- | :----------------------------------------- |
| <kbd>/</kbd> or <kbd>N</kbd>                               | Jump to Quick Add input                    |
| <kbd>Tab</kbd> / <kbd>Enter</kbd>                          | Accept smart auto-complete suggestion      |
| <kbd>M</kbd>                                               | Add a pinned focus note                    |
| <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd> | Undo last deleted task                     |
| <kbd>?</kbd>                                               | Open cheat sheet & syntax guide            |
| <kbd>Esc</kbd>                                             | Close any open modal or clear active input |

---

## 🎯 The Natural Language Cheat Sheet

| Intent                | Syntax Examples                                                   |
| :-------------------- | :---------------------------------------------------------------- |
| **High Priority**     | `!urgent`, `!high`, `!p1`, `!فوری`, `!مهم`                        |
| **Medium Priority**   | `!medium`, `!med`, `!p2`, `!متوسط`                                |
| **Low Priority**      | `!low`, `!p3`, `!کم`                                              |
| **Relative Times**    | `+2h`, `in 30 min`, `tomorrow`, `day after tomorrow`, `next week` |
| **Named Times**       | `morning`, `noon`, `afternoon`, `evening`, `night`, `midnight`    |
| **Recurring**         | `daily` / `every day`, `weekly` / `every week`, `monthly`         |
| **Tags**              | `#work`, `#project`, `#finance`, `#health`, `#personal`           |
| **Secondary Details** | `// Meeting link: meet.google.com/xyz`                            |

---

## 📄 License

Open-source under the MIT License. Crafted with care for focused minds.
