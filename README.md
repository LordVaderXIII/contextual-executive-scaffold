# Contextual Executive Scaffold (CES)

**Open-source framework and reference implementation for externalising executive function in interest-based nervous systems.**

CES helps adults whose cognitive architecture delivers strong reward for insight, resolution and novelty but weak or absent reward for sustained execution on non-preferred tasks, routine maintenance, and post-insight follow-through. It supplies deliberate external structure — AI decomposition with implementation intentions, visual timelines, context-aware scaffolding, gentle accountability integrations, and system-building patterns — so that activation and completion do not depend on unreliable internal motivation.

## The Underlying Model (Generalised)

- **Resolution / insight reward profile**: Dopamine spikes during problem framing and the moment of knowing the answer; drops sharply once the interesting part is solved. Execution and maintenance become unrewarding.
- **Interest-based attention regulation**: Attention gated by Novelty, Challenge, Urgency or Personal Interest. Zero-trigger tasks produce executive function paralysis ("I cannot start"), not laziness.
- **Post-insight trough**: Most abandonment occurs after insight but before completion.
- **Context & switching costs**: Difficulty maintaining appropriate task sets across environments or when hyperfocus on one domain crowds out others.
- **Externalisation as adaptation**: Many people in this profile unconsciously build data pipelines, agents or reminder systems during hyperfocus windows because they cannot activate reliably on the base behaviour. CES makes this conscious and systematic.

The goal is never to "fix" the architecture. It is to give it reliable external scaffolding.

## Core CES Capabilities

1. **AI-Assisted Decomposition + Implementation Intentions**  
   Input a vague or aversive task → receive concrete micro-steps plus optional if-then plans. Directly targets initiation barriers and the post-resolution trough.

2. **Visual Timeline Planning & Time Externalisation**  
   Daily/weekly visual timelines with one-tap timers and transition prompts. Addresses time blindness common in this profile.

3. **Hyperfocus Containment & Context Switching**  
   Declare contained sessions with explicit end conditions. Context rules (location/time) surface appropriate task sets and scaffolding for different environments.

4. **Gentle Persistence / Accountability Layer**  
   User-controlled nudges via smart-home or notification systems (Home Assistant example included). Salient but autonomy-preserving (easy snooze/dismiss). Outcome logging for tuning.

5. **Trigger-Wrapping & System-Building Patterns**  
   Guidance for wrapping zero-trigger behaviours inside data collection, analytics or agent monitoring so the meta-task supplies novelty/challenge/interest. Example: turning dietary compliance into "maintain and review personal health data pipeline".

6. **Self-Hosted Reference Stack**  
   FastAPI + PWA starter for Unraid/Docker with MariaDB, optional on-demand AI calls, and Home Assistant integration for contextual nudges and zones. Minimal and extensible.

## Scientific Foundations

- Dopamine motivational control and prediction-error signalling (Bromberg-Martin et al., 2010)
- Interest-based nervous system model and four-trigger activation (Dodson clinical framework)
- Executive function as self-directed motivation (Barkley)
- Implementation intentions effect sizes and benefits for attention-regulation populations (Gollwitzer meta-analyses)
- Prefrontal stress-signalling costs of chronic urgency (Arnsten)
- Identity and compensatory adaptation frameworks understood generically

CES treats these as a coherent, predictable cognitive architecture with real strengths (rapid integration, hyperfocus on novel/challenging work) and predictable friction points. The tools supply external structure where internal structure is unreliable.

## Example Home Assistant Integration (Copy-Paste Ready)

```yaml
alias: "CES Gentle Context Nudge"
description: "Low-salience external prompt for pending tasks"
trigger:
  - platform: time
    at: "20:00:00"
condition: []
action:
  - service: light.turn_on
    target:
      entity_id: light.living_area
    data:
      brightness_pct: 25
      rgb_color: [255, 220, 180]
  - delay:
      minutes: 3
  - service: notify.mobile_app_phone
    data:
      message: "CES: Check pending items for current context?"
      data:
        actions:
          - action: "CES_SNOOZE_60"
            title: "Snooze 1h"
          - action: "CES_MARK_REVIEWED"
            title: "Reviewed"
mode: single
```

Adapt entity names and add authentication. The principle is consistent external cue + easy user control.

## Philosophy

CES does not attempt to convert an interest-based system into an importance-based one. It builds reliable external triggers, explicit next actions, visual scaffolding and persistent monitoring so execution can occur without requiring the internal reward system to perform work it is not built for. All nudges, rules and AI calls remain fully user-configurable.

This is a public resource. Fork, adapt, contribute patterns that work for your stack.

## Getting Started

Clone, deploy the reference Docker stack (examples in /deploy), configure contexts if desired, and begin using the interface to generate micro-steps and plans. Review logs weekly and refine.

## Contributing

Issues and PRs welcome — especially additional integration examples, refined AI prompt templates, accessibility improvements, and real-world pattern libraries.

---

**Contextual Executive Scaffold (CES)** — deliberate external structure for cognitive architectures that already contain a powerful engine. Build the systems that keep running when your attention moves on.