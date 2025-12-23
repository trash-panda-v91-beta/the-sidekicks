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

function mergeAgentConfig(
  base: AgentConfig,
  override: AgentOverrideConfig
): AgentConfig {
  return deepMerge(base, override as Partial<AgentConfig>)
}

export function createBuiltinAgents(
  disabledAgents: BuiltinAgentName[] = [],
  agentOverrides: AgentOverrides = {},
  _directory?: string,
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

    if (override) {
      config = mergeAgentConfig(config, override)
    }

    result[agentName] = config
  }

  return result
}
