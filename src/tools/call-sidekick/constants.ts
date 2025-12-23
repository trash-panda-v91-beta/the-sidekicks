export const ALLOWED_AGENTS = ["tracer", "rocket"] as const

export const CALL_SIDEKICK_DESCRIPTION = `Spawn tracer/rocket sidekick. run_in_background REQUIRED (true=async with task_id, false=sync).

Available: {agents}

Prompts MUST be in English. Use \`background_output\` for async results.`
