import { z } from "zod"

const PermissionValue = z.enum(["ask", "allow", "deny"])

const BashPermission = z.union([
  PermissionValue,
  z.record(z.string(), PermissionValue),
])

const AgentPermissionSchema = z.object({
  edit: PermissionValue.optional(),
  bash: BashPermission.optional(),
  webfetch: PermissionValue.optional(),
  doom_loop: PermissionValue.optional(),
  external_directory: PermissionValue.optional(),
})

export const BuiltinAgentNameSchema = z.enum([
  "Professor",
  "oracle",
  "rocket",
  "tracer",
  "pixel",
  "ink",
  "specter",
])

export const OverridableAgentNameSchema = z.enum([
  "build",
  "plan",
  "Professor",
  "Planner-Professor",
  "oracle",
  "rocket",
  "tracer",
  "pixel",
  "ink",
  "specter",
])

export const AgentNameSchema = BuiltinAgentNameSchema

export const HookNameSchema = z.enum([
  "todo-continuation-enforcer",
  "context-window-monitor",
  "session-recovery",
  "session-notification",
  "comment-checker",
  "tool-output-truncator",
  "directory-agents-injector",
  "directory-readme-injector",
  "empty-task-response-detector",
  "think-mode",
  "anthropic-auto-compact",
  "compaction-context-injector",
  "rules-injector",
  "background-notification",
  "startup-toast",
  "keyword-detector",
  "agent-usage-reminder",
  "non-interactive-env",
  "interactive-bash-session",
  "empty-message-sanitizer",
])

export const AgentOverrideConfigSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  prompt: z.string().optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
  disable: z.boolean().optional(),
  description: z.string().optional(),
  mode: z.enum(["subagent", "primary", "all"]).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  permission: AgentPermissionSchema.optional(),
})

export const AgentOverridesSchema = z.object({
  build: AgentOverrideConfigSchema.optional(),
  plan: AgentOverrideConfigSchema.optional(),
  Professor: AgentOverrideConfigSchema.optional(),
  "Planner-Professor": AgentOverrideConfigSchema.optional(),
  oracle: AgentOverrideConfigSchema.optional(),
  rocket: AgentOverrideConfigSchema.optional(),
  tracer: AgentOverrideConfigSchema.optional(),
  pixel: AgentOverrideConfigSchema.optional(),
  ink: AgentOverrideConfigSchema.optional(),
  specter: AgentOverrideConfigSchema.optional(),
})

export const ProfessorAgentConfigSchema = z.object({
  disabled: z.boolean().optional(),
})

export const ExperimentalConfigSchema = z.object({
  aggressive_truncation: z.boolean().optional(),
  auto_resume: z.boolean().optional(),
  /** Truncate all tool outputs, not just whitelisted tools (default: false) */
  truncate_all_tool_outputs: z.boolean().optional(),
})

export const TheSidekicksConfigSchema = z.object({
  $schema: z.string().optional(),
  disabled_agents: z.array(BuiltinAgentNameSchema).optional(),
  disabled_hooks: z.array(HookNameSchema).optional(),
  agents: AgentOverridesSchema.optional(),
  professor_agent: ProfessorAgentConfigSchema.optional(),
  experimental: ExperimentalConfigSchema.optional(),
})

export type TheSidekicksConfig = z.infer<typeof TheSidekicksConfigSchema>
export type AgentOverrideConfig = z.infer<typeof AgentOverrideConfigSchema>
export type AgentOverrides = z.infer<typeof AgentOverridesSchema>
export type AgentName = z.infer<typeof AgentNameSchema>
export type HookName = z.infer<typeof HookNameSchema>
export type ProfessorAgentConfig = z.infer<typeof ProfessorAgentConfigSchema>
export type ExperimentalConfig = z.infer<typeof ExperimentalConfigSchema>
