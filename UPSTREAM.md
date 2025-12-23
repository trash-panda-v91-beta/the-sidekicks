# Upstream Source: oh-my-opencode

This plugin was forked from [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) v2.4.5 and customized for personal use.

## Base Version

- **Repository**: <https://github.com/code-yeongyu/oh-my-opencode>
- **Version**: v2.4.5 (forked on Dec 23, 2025), synced to v2.4.6 (Dec 23, 2025)
- **License**: MIT

## Philosophy Differences

**oh-my-opencode** is designed as a batteries-included, widely-distributed plugin for the OpenCode community. It prioritizes:

- Plug-and-play installation for new users
- Sensible defaults that work for everyone
- Pre-compiled TypeScript agents for easy distribution
- Comprehensive feature set enabled by default

**the-sidekicks** is a personal configuration system prioritizing:

- Direct editability and transparency
- Agents as markdown files in dotfiles (not compiled TypeScript)
- Customization over distribution
- Personal workflow optimization

## Major Changes from Upstream

### 1. Agent Architecture

| oh-my-opencode | the-sidekicks |
|----------------|---------------|
| Agents defined in TypeScript | Agents defined in Markdown |
| Compiled into plugin bundle | Loaded from `agents/` directory at runtime |
| Dynamic model detection in code | Static markdown with optional runtime augmentation |
| Distribution-focused | Editability-focused |

**Rationale**: TypeScript agents require rebuild cycles. Markdown agents are directly editable, version-controlled clearly, and transparent.

### 2. Removed Features

**Removed entirely:**

- Google Auth (built-in OAuth implementation)
  - **Why**: External `opencode-antigravity-auth` plugin is superior (multi-account load balancing, more models)
  - **Alternative**: User configures via external plugin
- Claude Code compatibility layer defaults
  - **Why**: Personal use doesn't need legacy compatibility
  - **Alternative**: Can be re-enabled if needed
- Environment Context Injector hook (`env-context-injector`)
  - **Why**: OpenCode core already injects environment context (working directory, git status, platform, date, file tree) into ALL agents including subagents via `SystemPrompt.environment()`. Our hook only added time/timezone/locale on top, which duplicated most fields and provided marginal value for coding tasks.
  - **Investigation**: See OpenCode's `packages/opencode/src/session/system.ts` and `packages/opencode/src/session/prompt.ts:535` - environment is injected unconditionally for all agent types.

**Simplified:**

- Auto-update checker → Removed
- Startup toast → Removed
- Feature advertising → Removed

**Rationale**: These features optimize for new user onboarding. Personal config doesn't need them.

### 3. Renamed Components

| oh-my-opencode | the-sidekicks | Reason |
|----------------|---------------|---------|
| "Sisyphus" agent | "Professor" agent | Personal preference, thematic consistency |
| "oh-my-opencode" | "the-sidekicks" | Personal branding |

### 4. Configuration Approach

| oh-my-opencode | the-sidekicks |
|----------------|---------------|
| `~/.config/opencode/oh-my-opencode.json` | `~/.config/opencode/the-sidekicks.json` |
| Feature toggles in JSON | Feature toggles + markdown agent overrides |
| Plugin ships all defaults | Plugin provides infrastructure, agents are separate |

### 5. Tool Modifications

**Kept from upstream:**

- LSP tools (hover, goto, rename, etc.)
- AST-grep tools
- Background task manager
- Look_at multimodal tool
- Interactive bash (tmux integration)
- All hooks (todo enforcer, comment checker, etc.)

**Modified:**

- Grep/glob tool replacements with timeout handling
- Tool output truncation logic
- Context window management

**Rationale**: Core tool infrastructure is solid. Kept everything that improves agent capabilities.

## What We Kept (and Why)

### Core Infrastructure ✅

- **Hooks system**: Todo continuation, comment checking, context monitoring
- **Background agent system**: Parallel agent orchestration
- **Tool suite**: LSP, AST-grep, enhanced grep/glob
- **MCP integration**: context7, exa, grep.app
- **Claude Code compatibility layer**: Useful for importing existing configs

### Why These Work for Personal Use

- Infrastructure code rarely needs editing
- Features directly improve agent productivity
- No compromise needed between distribution and customization

## Upstream Sync Strategy

**When to check upstream:**

- Monthly check for new features
- When encountering bugs that might be fixed upstream
- When new OpenCode versions require plugin updates

**How to evaluate upstream changes:**

```bash
# Compare upstream changes
git remote add upstream https://github.com/code-yeongyu/oh-my-opencode.git
git fetch upstream
git log upstream/dev --oneline --since="1 month ago"
```

**Cherry-picking criteria:**

| Change Type | Action | Rationale |
|-------------|--------|-----------|
| **Bug fixes in hooks/tools** | ✅ Merge immediately | Core functionality improvements |
| **New LSP/AST tools** | ✅ Evaluate and merge | Enhances agent capabilities |
| **New hooks** | 🤔 Evaluate case-by-case | Only if solves personal pain point |
| **New MCPs** | 🤔 Evaluate case-by-case | Only if needed for workflows |
| **Agent prompt changes** | ❌ Ignore | We maintain our own prompts |
| **Distribution features** | ❌ Ignore | Not relevant for personal use |
| **UI/UX improvements** | ❌ Ignore | Startup toasts, update notifications, etc. |

## Implementation Differences

### Dynamic Logic We Preserved

Even though agents are markdown, we kept some dynamic behavior:

1. **Model-specific adaptations** (`src/agents/professor.ts`, `src/agents/oracle.ts`)
   - GPT models get `reasoningEffort` parameter
   - Claude models get `thinking` budget
   - Allows using same agent with different models

2. **Tool restrictions** (`src/index.ts`)
   - Tracer/Rocket can't use `call_sidekick` (prevents recursion)
   - Specter can't use `task`, `call_sidekick`, `look_at`
   - Applied programmatically during config injection

### What We Moved to Markdown

Agent **prompts** are now in `agents/*.md`:

- Professor's orchestration instructions
- Oracle's reasoning framework
- Rocket's research methodology
- Tracer's search patterns
- Pixel's design philosophy
- Ink's documentation standards
- Specter's media analysis approach

These are the "personality" of each agent—should be directly editable.

### What Stayed in TypeScript

Plugin **infrastructure** remains in `src/`:

- Hook implementations
- Tool definitions
- Background task manager
- Agent loading and injection logic
- Config parsing and merging

These are the "nervous system"—rarely need editing, benefit from type safety.

## Maintenance Notes

**For future me:**

When oh-my-opencode releases a new version:

1. Read their changelog
2. Check if any bugs you've hit are fixed → merge the fix
3. Check if new tools/hooks are useful → evaluate
4. Ignore: agent prompt changes, distribution features, UI polish
5. Update this document with what you merged and why

**Quick merge workflow:**

```bash
# See what changed
git log upstream/dev..HEAD --oneline

# Cherry-pick useful commits
git cherry-pick <commit-hash>

# Or merge specific files
git checkout upstream/dev -- src/hooks/some-hook.ts
```

**Testing after merge:**

```bash
bun run build
opencode  # Verify plugin loads
# Test the specific feature you merged
```

## Sync Log

### Dec 23, 2025 - Refactored to use OpenCode native agent loading

**Major architecture change:**

Removed TypeScript agent loading in favor of OpenCode's native agent discovery system.

**What changed:**

| Before | After |
|--------|-------|
| Plugin loaded agents via `createBuiltinAgents()` | OpenCode loads from `~/.config/opencode/agent/` |
| Tool restrictions set in TypeScript | Tool restrictions in agent frontmatter (`tools:`) |
| Path resolution issues in Nix store | No path resolution needed |
| `src/agents/` directory with utils, types, plan-prompt | Deleted entirely |
| Planner-Professor created dynamically | `agents/Planner-Professor.md` static file |
| Professor default via object ordering | `default_agent = "professor"` in HM module |

**Files deleted:**
- `src/agents/utils.ts` - Agent markdown loading logic
- `src/agents/types.ts` - BuiltinAgentName types
- `src/agents/plan-prompt.ts` - Planner-Professor prompt/permissions
- `src/agents/index.ts` - Re-exports

**Files added:**
- `agents/Planner-Professor.md` - Read-only planning agent

**Files modified:**
- `agents/tracer.md` - Added `call_sidekick: false`
- `agents/rocket.md` - Added `call_sidekick: false`
- `agents/specter.md` - Added `call_sidekick: false`, `task: false`, `look_at: false`
- `nix/hm-module.nix` - Added `default_agent = "professor"`
- `src/index.ts` - Removed agent loading, simplified config hook

**Result:**
- Bundle size reduced 100KB (1.37MB → 1.27MB)
- No more Nix store path resolution bugs
- Agent configuration fully in markdown frontmatter
- Aligns with OpenCode's native agent system

**Breaking changes for users:**
- `disabled_agents` config option no longer works; use `disable: true` in agent frontmatter instead
- Agent names are now lowercase (`professor` not `Professor`) in config

---

### Dec 23, 2025 - Cherry-picked v2.4.6 fixes

**Merged commits:**

- `8495be6` - Enhance non-interactive-env hook with additional env vars and command patterns
  - Added `npm_config_yes`, `PIP_NO_INPUT`, `YARN_ENABLE_IMMUTABLE_INSTALLS` env vars
  - Added `SHELL_COMMAND_PATTERNS` documentation for banned/good/bad patterns
- `61740e5` - feat(non-interactive-env): add banned command detection using SHELL_COMMAND_PATTERNS
  - Detects and warns about interactive commands (vim, nano, less, etc.)
  - Prevents agents from running commands that would hang
- `e752032` - fix(look-at): use direct file passthrough instead of Read tool
  - Files now passed directly via `file://` URL format
  - Removed dependency on Read tool for multimodal-looker agent
  - Added `inferMimeType` helper for proper MIME type detection
  - Better performance for media file analysis

**Skipped from v2.5.0/v2.5.1:**

- CLI interactive install command (distribution feature)
- Docs updates for Antigravity provider (not used)
- npm packaging fixes (distribution feature)

---

## Attribution

This project is deeply grateful to [@code-yeongyu](https://github.com/code-yeongyu) and the oh-my-opencode contributors for:

- Exceptional engineering of the base plugin
- Comprehensive hook system
- Advanced LSP/AST tool integration
- Background agent architecture
- Battle-tested agent orchestration patterns

Without their work, this personal configuration system would not exist.

The upstream project represents months of research, testing, and refinement (as noted in their README, $24,000 worth of token experimentation). We benefit from all that hard work.

**When in doubt, check upstream first.** They've likely already solved it.
