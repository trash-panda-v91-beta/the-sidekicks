import type { AgentConfig } from "@opencode-ai/sdk"
import type { BuiltinAgentName, AgentOverrideConfig, AgentOverrides } from "./types"
import { isGptModel } from "./types"
import { deepMerge } from "../shared"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import yaml from "js-yaml"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function parseMarkdownAgent(filePath: string): AgentConfig {
  const content = readFileSync(filePath, "utf-8")
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  
  if (!frontmatterMatch) {
    throw new Error(`Invalid markdown agent file: ${filePath} - missing YAML frontmatter`)
  }
  
  const [, frontmatterStr, promptContent] = frontmatterMatch
  const frontmatter = yaml.load(frontmatterStr) as Record<string, any>
  
  return {
    ...frontmatter,
    prompt: promptContent.trim(),
  } as AgentConfig
}

function loadMarkdownAgent(agentName: BuiltinAgentName, model?: string): AgentConfig {
  const agentFilePath = join(__dirname, "../../agents", `${agentName}.md`)
  const config = parseMarkdownAgent(agentFilePath)
  
  if (model) {
    config.model = model
  }
  
  if (agentName === "Professor" || agentName === "oracle") {
    const defaultModel = agentName === "Professor" 
      ? "github-copilot/claude-opus-4.5" 
      : "github-copilot/gpt-5.2"
    const effectiveModel = config.model || defaultModel
    
    if (isGptModel(effectiveModel)) {
      config.reasoningEffort = "medium"
      if (agentName === "oracle") {
        config.textVerbosity = "high"
      }
    } else {
      config.thinking = { type: "enabled", budgetTokens: 32000 }
    }
  }
  
  return config
}

export function createEnvContext(directory: string): string {
  const now = new Date()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const locale = Intl.DateTimeFormat().resolvedOptions().locale

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  const platform = process.platform as "darwin" | "linux" | "win32" | string

  return `
Here is some useful information about the environment you are running in:
<env>
  Working directory: ${directory}
  Platform: ${platform}
  Today's date: ${dateStr} (NOT 2024, NEVEREVER 2024)
  Current time: ${timeStr}
  Timezone: ${timezone}
  Locale: ${locale}
</env>`
}

function mergeAgentConfig(
  base: AgentConfig,
  override: AgentOverrideConfig
): AgentConfig {
  return deepMerge(base, override as Partial<AgentConfig>)
}

export function createBuiltinAgents(
  disabledAgents: BuiltinAgentName[] = [],
  agentOverrides: AgentOverrides = {},
  directory?: string,
  systemDefaultModel?: string
): Record<string, AgentConfig> {
  const result: Record<string, AgentConfig> = {}
  const allAgentNames: BuiltinAgentName[] = [
    "Professor",
    "oracle",
    "rocket",
    "tracer",
    "pixel",
    "ink",
    "specter",
  ]

  for (const agentName of allAgentNames) {
    if (disabledAgents.includes(agentName)) {
      continue
    }

    const override = agentOverrides[agentName]
    const model = override?.model ?? (agentName === "Professor" ? systemDefaultModel : undefined)

    let config = loadMarkdownAgent(agentName, model)

    if ((agentName === "Professor" || agentName === "rocket") && directory && config.prompt) {
      const envContext = createEnvContext(directory)
      config = { ...config, prompt: config.prompt + envContext }
    }

    if (override) {
      config = mergeAgentConfig(config, override)
    }

    result[agentName] = config
  }

  return result
}
