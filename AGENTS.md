# The Sidekicks - Agent Reference

A comic-inspired squad of specialized AI agents for OpenCode.

> **Note**: This repository contains the full agent and skill library. For Nix users, a home-manager module is provided.

## Agent Overview

| Agent | Role | Model | Mode |
|-------|------|-------|------|
| **Professor** | Mastermind orchestrator | claude-opus-4.5 | Primary |
| **Oracle** | Strategic technical advisor | gpt-5.2 | Subagent |
| **Rocket** | Open-source codebase researcher | claude-haiku-4.5 | Subagent |
| **Tracer** | Contextual codebase search | grok-code | Subagent |
| **Pixel** | UI/UX designer-developer | gemini-3-pro-preview | Subagent |
| **Ink** | Technical documentation writer | gemini-3-flash-preview | Subagent |
| **Specter** | Media file analyzer | gemini-2.5-flash | Subagent |

---

## Professor

**The Leader** - Primary orchestrating agent that coordinates the entire squad.

- **Model**: `github-copilot/claude-opus-4.5`
- **Role**: Mastermind orchestrator, task delegation, workflow management
- **When Active**: Default primary agent for all interactions

**Behavior**:
- Parses implicit requirements from explicit requests
- Adapts to codebase maturity (disciplined vs chaotic)
- Delegates specialized work to appropriate sidekicks
- Executes parallel operations for maximum throughput
- Never implements without explicit user request

**Delegation Pattern**:
- Frontend visual work → **Pixel**
- External library research → **Rocket** (background)
- Codebase exploration → **Tracer** (background)
- Architecture decisions → **Oracle**
- Documentation → **Ink**
- Media analysis → **Specter**

---

## Oracle

**The Strategist** - Deep reasoning advisor for complex technical decisions.

- **Model**: `github-copilot/gpt-5.2`
- **Role**: Strategic technical advisor, architecture consultant
- **Temperature**: Low (precise reasoning)

**When to Invoke**:
- Complex architecture design decisions
- After completing significant work (review)
- 2+ failed fix attempts (debugging guidance)
- Unfamiliar code patterns
- Security/performance concerns
- Multi-system tradeoffs

**Response Structure**:
1. **Bottom line**: 2-3 sentence recommendation
2. **Action plan**: Numbered implementation steps
3. **Effort estimate**: Quick (<1h) / Short (1-4h) / Medium (1-2d) / Large (3d+)

**Principles**:
- Bias toward simplicity
- Leverage existing code over new components
- Prioritize developer experience
- One clear path, not multiple options

---

## Rocket

**The Researcher** - Specialized agent for external codebase and documentation research.

- **Model**: `github-copilot/claude-haiku-4.5`
- **Role**: Open-source codebase understanding, documentation retrieval
- **Tools**: Read-only (no write/edit access)

**Capabilities**:
- Multi-repository analysis
- Remote codebase searching
- Official documentation retrieval
- Finding implementation examples in open source
- GitHub CLI integration

**Request Types**:
| Type | Trigger | Tools Used |
|------|---------|------------|
| Conceptual | "How do I use X?" | context7 + websearch |
| Implementation | "How does X implement Y?" | gh clone + read |
| Context | "Why was this changed?" | gh issues/prs + git log |
| Comprehensive | Complex/ambiguous | All tools parallel |

**Output**: Always includes GitHub permalinks as evidence.

---

## Tracer

**The Scout** - Fast contextual search specialist for local codebases.

- **Model**: `opencode/grok-code`
- **Role**: Codebase search, file discovery, pattern finding
- **Tools**: Read-only (no write/edit access)

**Answers Questions Like**:
- "Where is X implemented?"
- "Which files contain Y?"
- "Find the code that does Z"

**Thoroughness Levels**:
- `quick` - Basic search, fast results
- `medium` - Moderate depth
- `very thorough` - Comprehensive analysis

**Output Structure**:
```xml
<results>
  <files>
    - /path/to/file.ts — [relevance explanation]
  </files>
  <answer>[Direct answer to actual need]</answer>
  <next_steps>[What to do with this information]</next_steps>
</results>
```

**Key Behavior**: Launches 3+ tools simultaneously, never sequential unless output depends on prior result.

---

## Pixel

**The Artist** - Designer-turned-developer for stunning UI/UX.

- **Model**: `github-copilot/gemini-3-pro-preview`
- **Role**: UI/UX design and implementation
- **Tools**: Full access (can write/edit code)

**Specialties**:
- Visual design without mockups
- Pixel-perfect implementation
- Micro-interactions and animations
- Color harmony and typography
- Responsive layouts

**Design Process**:
1. Define purpose and target users
2. Choose aesthetic direction (minimal, maximalist, retro, etc.)
3. Identify technical constraints
4. Determine the ONE memorable element
5. Implement with precision

**Aesthetic Guidelines**:
- Distinctive typography (avoids Arial, Inter, Roboto)
- Bold color choices
- Intentional spacing and rhythm
- Memorable visual identity

**When to Delegate to Pixel**:
- Any visual/styling changes
- Color, spacing, layout, typography
- Animation and transitions
- Responsive breakpoints
- UI component design

---

## Ink

**The Scribe** - Technical writer for comprehensive documentation.

- **Model**: `github-copilot/gemini-3-flash-preview`
- **Role**: Documentation creation and maintenance
- **Tools**: Full access (can write/edit)

**Specialties**:
- README files
- API documentation
- Architecture docs
- User guides
- Code comments (when necessary)

**Principles**:
1. **Diligence**: Complete what's asked, no shortcuts
2. **Learning**: Study codebase before documenting
3. **Precision**: Follow exact specifications
4. **Verification**: Every code example must work

**Documentation Types**:
- Getting started guides
- API reference
- Architecture overviews
- Contributing guidelines
- Changelog entries

---

## Specter

**The Phantom** - Media file analyzer for non-text content.

- **Model**: `github-copilot/gemini-2.5-flash`
- **Role**: Media interpretation and extraction
- **Tools**: Read-only, no bash access

**Handles**:
- PDF documents (text, tables, structure)
- Images (UI elements, text, layouts)
- Diagrams (relationships, flows, architecture)
- Charts and graphs

**When to Use**:
- Media files the Read tool cannot interpret
- Extracting specific information from documents
- Describing visual content
- Analyzing diagrams or charts

**When NOT to Use**:
- Plain text or source code (use Read)
- Files needing editing (need literal content)
- Simple file reading without interpretation

**Output**: Direct extracted information, no preamble. Saves context tokens by processing files separately.

---

## Agent Invocation

### From Professor (Primary Agent)

Professor automatically delegates to sidekicks based on task type:

```
# Background tasks (non-blocking)
background_task(agent="tracer", prompt="Find auth implementation...")
background_task(agent="rocket", prompt="Look up JWT best practices...")

# Direct delegation
task(subagent_type="pixel", prompt="Redesign the login form...")
task(subagent_type="ink", prompt="Document the API endpoints...")
task(subagent_type="oracle", prompt="Review this architecture decision...")
```

### Tool: `call_sidekick`

For invoking Tracer or Rocket directly:

```typescript
call_sidekick({
  subagent_type: "tracer" | "rocket",
  prompt: "Your search query...",
  run_in_background: true  // recommended
})
```

---

## Installation

### Nix (Home Manager)

To use The Sidekicks with Home Manager, add the flake to your inputs and enable the module:

```nix
# flake.nix
{
  inputs.opencode-sidekicks.url = "github:trash-panda-v91-beta/the-sidekicks";
}

# home.nix
{
  imports = [ inputs.opencode-sidekicks.homeManagerModules.default ];
  programs.opencode-sidekicks.enable = true;
}
```

The module handles:
- Enabling the core plugin
- Configuring default LSPs, formatters, and permissions
- Symlinking all agents to `~/.config/opencode/agent/`
- Symlinking all skills to `~/.config/opencode/skill/`

### Manual

Non-Nix users need to manually copy or symlink agents and skills:

```bash
# Clone the repository
git clone https://github.com/trash-panda-v91-beta/the-sidekicks

# Symlink agents
ln -s /path/to/the-sidekicks/agents ~/.config/opencode/agent

# Symlink skills
ln -s /path/to/the-sidekicks/skills ~/.config/opencode/skill
```

---

## Configuration

Agents can be customized in `the-sidekicks.json`:

```json
{
  "agents": {
    "professor": { "model": "alternative-model" },
    "oracle": { "temperature": 0.2 }
  },
  "disabled_agents": ["specter"],
  "professor_agent": { "disabled": false }
}
```

### Config Locations
- User: `~/.config/opencode/the-sidekicks.json`
- Project: `.opencode/the-sidekicks.json`

---

## Skills System

Skills are reusable behavior guides that agents can load on-demand. This reduces base context size while providing detailed guidance when needed.

### Available Skills

| Skill | Description |
|-------|-------------|
| `codebase-assessment` | Assess codebase maturity before following patterns |
| `parallel-exploration` | Fire search agents in parallel effectively |
| `frontend-delegation` | Classify visual vs logic changes before acting |
| `oracle-consultation` | Ensure appropriate usage of Oracle |
| `systematic-debugging` | Root cause investigation before fixing |
| `test-driven-development` | Red-green-refactor cycle |
| `verification-checklist` | Ensure all requirements met before completion |
| `review-architecture` | Review code for architectural consistency and design systems |
| `review-code-quality` | Review code for quality, security, and best practices |
| `quality-engineering` | QA processes, test automation, and performance engineering |
| `delivery-and-infra` | Cloud architecture, CI/CD, and deployment strategies |
| `data-and-sql` | SQL optimization, database performance, and data analysis |
| `git-workflow` | Branches, conventional commits, and pull requests |
| `python-development` | Clean, performant, and idiomatic Python code |
| `nix-guidelines` | Idiomatic Nix code with flakes and modules |

### Skill Usage

OpenCode has a built-in `skill` tool that discovers and loads skills:

```typescript
// Load a skill by name
skill({ name: "systematic-debugging" })
```

### Skill Locations (priority order)
1. Project: `.opencode/skill/<name>/SKILL.md`
2. User: `~/.config/opencode/skill/<name>/SKILL.md`

> **Note**: With the Nix home-manager module, bundled skills are automatically symlinked to `~/.config/opencode/skill/`.

### Creating Custom Skills

Create a directory with a `SKILL.md` file:

```markdown
---
name: my-skill
description: Use when [specific condition]
---

# My Skill

[Skill content here]
```

---

## Model Summary

| Agent | Provider | Model | Purpose |
|-------|----------|-------|---------|
| Professor | GitHub Copilot | claude-opus-4.5 | Complex reasoning, orchestration |
| Oracle | GitHub Copilot | gpt-5.2 | Deep strategic reasoning |
| Rocket | GitHub Copilot | claude-haiku-4.5 | Fast research, documentation |
| Tracer | OpenCode | grok-code | Codebase search |
| Pixel | GitHub Copilot | gemini-3-pro-preview | Visual/creative work |
| Ink | GitHub Copilot | gemini-3-flash-preview | Documentation |
| Specter | GitHub Copilot | gemini-2.5-flash | Media analysis |
