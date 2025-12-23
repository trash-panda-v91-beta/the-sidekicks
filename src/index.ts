import type { Plugin } from "@opencode-ai/plugin";
import { createBuiltinAgents } from "./agents";
import {
  createTodoContinuationEnforcer,
  createContextWindowMonitorHook,
  createSessionRecoveryHook,
  createSessionNotification,
  createCommentCheckerHooks,
  createToolOutputTruncatorHook,
  createDirectoryAgentsInjectorHook,
  createDirectoryReadmeInjectorHook,
  createEmptyTaskResponseDetectorHook,
  createThinkModeHook,
  createAnthropicAutoCompactHook,
  createRulesInjectorHook,
  createBackgroundNotificationHook,
  createKeywordDetectorHook,
  createAgentUsageReminderHook,
  createNonInteractiveEnvHook,
  createInteractiveBashSessionHook,
  createEmptyMessageSanitizerHook,
} from "./hooks";
import { builtinTools, createCallSidekick, createBackgroundTools, createLookAt, interactive_bash, getTmuxPath } from "./tools";
import { BackgroundManager } from "./features/background-agent";
import { TheSidekicksConfigSchema, type TheSidekicksConfig, type HookName } from "./config";
import { log, deepMerge, getUserConfigDir, addConfigLoadError } from "./shared";
import { PLAN_SYSTEM_PROMPT, PLAN_PERMISSION } from "./agents/plan-prompt";
import * as fs from "fs";
import * as path from "path";

function loadConfigFromPath(configPath: string): TheSidekicksConfig | null {
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      const rawConfig = JSON.parse(content);

      const result = TheSidekicksConfigSchema.safeParse(rawConfig);

      if (!result.success) {
        const errorMsg = result.error.issues.map((i) => `${String(i.path.join("."))}: ${i.message}`).join(", ");
        log(`Config validation error in ${configPath}:`, result.error.issues);
        addConfigLoadError({ path: configPath, error: `Validation error: ${errorMsg}` });
        return null;
      }

      log(`Config loaded from ${configPath}`, { agents: result.data.agents });
      return result.data;
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    log(`Error loading config from ${configPath}:`, err);
    addConfigLoadError({ path: configPath, error: errorMsg });
  }
  return null;
}

function mergeConfigs(
  base: TheSidekicksConfig,
  override: TheSidekicksConfig
): TheSidekicksConfig {
  return {
    ...base,
    ...override,
    agents: deepMerge(base.agents, override.agents),
    disabled_agents: [
      ...new Set([
        ...(base.disabled_agents ?? []),
        ...(override.disabled_agents ?? []),
      ]),
    ],
    disabled_hooks: [
      ...new Set([
        ...(base.disabled_hooks ?? []),
        ...(override.disabled_hooks ?? []),
      ]),
    ],
  };
}

function loadPluginConfig(directory: string): TheSidekicksConfig {
  const userConfigPath = path.join(
    getUserConfigDir(),
    "opencode",
    "the-sidekicks.json"
  );

  const projectConfigPath = path.join(
    directory,
    ".opencode",
    "the-sidekicks.json"
  );

  let config: TheSidekicksConfig = loadConfigFromPath(userConfigPath) ?? {};

  const projectConfig = loadConfigFromPath(projectConfigPath);
  if (projectConfig) {
    config = mergeConfigs(config, projectConfig);
  }

  log("Final merged config", {
    agents: config.agents,
    disabled_agents: config.disabled_agents,
    disabled_hooks: config.disabled_hooks,
  });
  return config;
}

const TheSidekicksPlugin: Plugin = async (ctx) => {
  const pluginConfig = loadPluginConfig(ctx.directory);
  const disabledHooks = new Set(pluginConfig.disabled_hooks ?? []);
  const isHookEnabled = (hookName: HookName) => !disabledHooks.has(hookName);

  const todoContinuationEnforcer = isHookEnabled("todo-continuation-enforcer")
    ? createTodoContinuationEnforcer(ctx)
    : null;
  const contextWindowMonitor = isHookEnabled("context-window-monitor")
    ? createContextWindowMonitorHook(ctx)
    : null;
  const sessionRecovery = isHookEnabled("session-recovery")
    ? createSessionRecoveryHook(ctx, { experimental: pluginConfig.experimental })
    : null;
  const sessionNotification = isHookEnabled("session-notification")
    ? createSessionNotification(ctx)
    : null;

  if (sessionRecovery && todoContinuationEnforcer) {
    sessionRecovery.setOnAbortCallback(todoContinuationEnforcer.markRecovering);
    sessionRecovery.setOnRecoveryCompleteCallback(todoContinuationEnforcer.markRecoveryComplete);
  }

  const commentChecker = isHookEnabled("comment-checker")
    ? createCommentCheckerHooks()
    : null;
  const toolOutputTruncator = isHookEnabled("tool-output-truncator")
    ? createToolOutputTruncatorHook(ctx, { experimental: pluginConfig.experimental })
    : null;
  const directoryAgentsInjector = isHookEnabled("directory-agents-injector")
    ? createDirectoryAgentsInjectorHook(ctx)
    : null;
  const directoryReadmeInjector = isHookEnabled("directory-readme-injector")
    ? createDirectoryReadmeInjectorHook(ctx)
    : null;
  const emptyTaskResponseDetector = isHookEnabled("empty-task-response-detector")
    ? createEmptyTaskResponseDetectorHook(ctx)
    : null;
  const thinkMode = isHookEnabled("think-mode")
    ? createThinkModeHook()
    : null;
  const anthropicAutoCompact = isHookEnabled("anthropic-auto-compact")
    ? createAnthropicAutoCompactHook(ctx, { experimental: pluginConfig.experimental })
    : null;
  const rulesInjector = isHookEnabled("rules-injector")
    ? createRulesInjectorHook(ctx)
    : null;
  const keywordDetector = isHookEnabled("keyword-detector")
    ? createKeywordDetectorHook()
    : null;
  const agentUsageReminder = isHookEnabled("agent-usage-reminder")
    ? createAgentUsageReminderHook(ctx)
    : null;
  const nonInteractiveEnv = isHookEnabled("non-interactive-env")
    ? createNonInteractiveEnvHook(ctx)
    : null;
  const interactiveBashSession = isHookEnabled("interactive-bash-session")
    ? createInteractiveBashSessionHook(ctx)
    : null;
  const emptyMessageSanitizer = isHookEnabled("empty-message-sanitizer")
    ? createEmptyMessageSanitizerHook()
    : null;

  const backgroundManager = new BackgroundManager(ctx);

  const backgroundNotificationHook = isHookEnabled("background-notification")
    ? createBackgroundNotificationHook(backgroundManager)
    : null;
  const backgroundTools = createBackgroundTools(backgroundManager, ctx.client);

  const callSidekick = createCallSidekick(ctx, backgroundManager);
  const lookAt = createLookAt(ctx);

  const tmuxAvailable = await getTmuxPath();

  return {
    tool: {
      ...builtinTools,
      ...backgroundTools,
      call_sidekick: callSidekick,
      look_at: lookAt,
      ...(tmuxAvailable ? { interactive_bash } : {}),
    },

    "chat.message": async (input, output) => {
      await keywordDetector?.["chat.message"]?.(input, output);
    },

    "experimental.chat.messages.transform": async (
      input: Record<string, never>,
      output: { messages: Array<{ info: unknown; parts: unknown[] }> }
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await emptyMessageSanitizer?.["experimental.chat.messages.transform"]?.(input, output as any);
    },

    config: async (config) => {
      const builtinAgents = createBuiltinAgents(
        pluginConfig.disabled_agents,
        pluginConfig.agents,
        ctx.directory,
        config.model,
      );

      const isProfessorEnabled = pluginConfig.professor_agent?.disabled !== true;

      if (isProfessorEnabled && builtinAgents.Professor) {
        const { name: _planName, ...planConfigWithoutName } = config.agent?.plan ?? {};
        const plannerProfessorOverride = pluginConfig.agents?.["Planner-Professor"];
        const plannerProfessorBase = {
          ...planConfigWithoutName,
          prompt: PLAN_SYSTEM_PROMPT,
          permission: PLAN_PERMISSION,
          description: `${config.agent?.plan?.description ?? "Plan agent"} (The Sidekicks version)`,
          color: config.agent?.plan?.color ?? "#6495ED",
        };

        const plannerProfessorConfig = plannerProfessorOverride
          ? { ...plannerProfessorBase, ...plannerProfessorOverride }
          : plannerProfessorBase;

        config.agent = {
          Professor: builtinAgents.Professor,
          "Planner-Professor": plannerProfessorConfig,
          ...Object.fromEntries(Object.entries(builtinAgents).filter(([k]) => k !== "Professor")),
          ...config.agent,
          build: { ...config.agent?.build, mode: "subagent" },
          plan: { ...config.agent?.plan, mode: "subagent" },
        };
      } else {
        config.agent = {
          ...builtinAgents,
          ...config.agent,
        };
      }

      config.tools = {
        ...config.tools,
      };

      if (config.agent.tracer) {
        config.agent.tracer.tools = {
          ...config.agent.tracer.tools,
          call_sidekick: false,
        };
      }
      if (config.agent.rocket) {
        config.agent.rocket.tools = {
          ...config.agent.rocket.tools,
          call_sidekick: false,
        };
      }
      if (config.agent.specter) {
        config.agent.specter.tools = {
          ...config.agent.specter.tools,
          task: false,
          call_sidekick: false,
          look_at: false,
        };
      }

      config.permission = {
        ...config.permission,
        webfetch: "allow",
        external_directory: "allow",
      }
    },

    event: async (input) => {
      await backgroundNotificationHook?.event(input);
      await sessionNotification?.(input);
      await todoContinuationEnforcer?.handler(input);
      await contextWindowMonitor?.event(input);
      await directoryAgentsInjector?.event(input);
      await directoryReadmeInjector?.event(input);
      await rulesInjector?.event(input);
      await thinkMode?.event(input);
      await anthropicAutoCompact?.event(input);
      await agentUsageReminder?.event(input);
      await interactiveBashSession?.event(input);

      const { event } = input;
      const props = event.properties as Record<string, unknown> | undefined;

      if (event.type === "session.error") {
        const sessionID = props?.sessionID as string | undefined;
        const error = props?.error;

        if (sessionRecovery?.isRecoverableError(error)) {
          const messageInfo = {
            id: props?.messageID as string | undefined,
            role: "assistant" as const,
            sessionID,
            error,
          };
          const recovered =
            await sessionRecovery.handleSessionRecovery(messageInfo);

          if (recovered && sessionID) {
            await ctx.client.session
              .prompt({
                path: { id: sessionID },
                body: { parts: [{ type: "text", text: "continue" }] },
                query: { directory: ctx.directory },
              })
              .catch(() => {});
          }
        }
      }
    },

    "tool.execute.before": async (input, output) => {
      await nonInteractiveEnv?.["tool.execute.before"](input, output);
      await commentChecker?.["tool.execute.before"](input, output);
      await directoryAgentsInjector?.["tool.execute.before"]?.(input, output);
      await directoryReadmeInjector?.["tool.execute.before"]?.(input, output);
      await rulesInjector?.["tool.execute.before"]?.(input, output);

      if (input.tool === "task") {
        const args = output.args as Record<string, unknown>;
        const subagentType = args.subagent_type as string;
        const isTracerOrRocket = ["tracer", "rocket"].includes(subagentType);

        args.tools = {
          ...(args.tools as Record<string, boolean> | undefined),
          background_task: false,
          ...(isTracerOrRocket ? { call_sidekick: false } : {}),
        };
      }
    },

    "tool.execute.after": async (input, output) => {
      await toolOutputTruncator?.["tool.execute.after"](input, output);
      await contextWindowMonitor?.["tool.execute.after"](input, output);
      await commentChecker?.["tool.execute.after"](input, output);
      await directoryAgentsInjector?.["tool.execute.after"](input, output);
      await directoryReadmeInjector?.["tool.execute.after"](input, output);
      await rulesInjector?.["tool.execute.after"](input, output);
      await emptyTaskResponseDetector?.["tool.execute.after"](input, output);
      await agentUsageReminder?.["tool.execute.after"](input, output);
      await interactiveBashSession?.["tool.execute.after"](input, output);
    },
  };
};

export default TheSidekicksPlugin;

export type {
  TheSidekicksConfig,
  AgentName,
  AgentOverrideConfig,
  AgentOverrides,
  HookName,
} from "./config";

export type { ConfigLoadError } from "./shared/config-errors";
