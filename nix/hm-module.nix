# The Sidekicks - Home Manager Module
#
# This module provides a complete OpenCode configuration with:
# - The Sidekicks plugin (hooks, tools, background agents)
# - Core agents (Professor, Oracle, Tracer, Rocket, Pixel, Ink, Specter)
# - Skills (codebase-assessment, parallel-exploration, etc.)
# - Sensible default LSP, formatter, and permission configs
#
# Usage in your home-manager config:
#   imports = [ inputs.the-sidekicks.homeManagerModules.default ];
#   programs.opencode-sidekicks.enable = true;
#
{ self, opencode }:
{
  config,
  lib,
  pkgs,
  ...
}:
let
  cfg = config.programs.opencode-sidekicks;

  sidekicksPackage = self.packages.${pkgs.system}.opencode-sidekicks;
  opencodePackage = opencode.packages.${pkgs.system}.default;

  agentFiles = builtins.readDir "${sidekicksPackage}/agents";
  agentNames = builtins.filter (name: lib.hasSuffix ".md" name) (builtins.attrNames agentFiles);

  skillDirs = builtins.readDir "${sidekicksPackage}/skills";
  skillNames = builtins.attrNames skillDirs;

  agentFileAttrs = lib.optionalAttrs cfg.agents.enable (
    builtins.listToAttrs (
      map (name: {
        name = "opencode/agent/${name}";
        value = {
          source = "${sidekicksPackage}/agents/${name}";
        };
      }) agentNames
    )
  );

  skillFileAttrs = lib.optionalAttrs cfg.skills.enable (
    builtins.listToAttrs (
      lib.flatten (
        map (
          skillName:
          let
            skillPath = "${sidekicksPackage}/skills/${skillName}";
          in
          [
            {
              name = "opencode/skill/${skillName}/SKILL.md";
              value = {
                source = "${skillPath}/SKILL.md";
              };
            }
          ]
        ) skillNames
      )
    )
  );

  extraAgentAttrs = builtins.listToAttrs (
    lib.mapAttrsToList (name: source: {
      name = "opencode/agent/${name}.md";
      value = {
        inherit source;
      };
    }) cfg.agents.extra
  );

  extraSkillAttrs = builtins.listToAttrs (
    lib.mapAttrsToList (name: source: {
      name = "opencode/skill/${name}/SKILL.md";
      value = {
        inherit source;
      };
    }) cfg.skills.extra
  );

  instructionFileAttrs = builtins.listToAttrs (
    lib.imap0 (i: source: {
      name = "opencode/instructions/${toString i}-${baseNameOf (toString source)}";
      value = {
        inherit source;
      };
    }) cfg.instructions
  );

  defaultLspConfig = {
    nixd = {
      command = [ (lib.getExe pkgs.nixd) ];
      extensions = [ ".nix" ];
      initialization = {
        formatting.command = [ (lib.getExe pkgs.nixfmt-rfc-style) ];
      };
    };
    basedpyright = {
      command = [ (lib.getExe pkgs.basedpyright) ];
      extensions = [
        ".py"
        ".pyi"
      ];
    };
    ruff = {
      command = [
        (lib.getExe pkgs.ruff)
        "server"
      ];
      extensions = [
        ".py"
        ".pyi"
      ];
    };
    typescript = {
      command = [
        (lib.getExe pkgs.typescript-language-server)
        "--stdio"
      ];
      extensions = [
        ".ts"
        ".tsx"
        ".js"
        ".jsx"
        ".mjs"
        ".cjs"
        ".mts"
        ".cts"
      ];
    };
    gopls = {
      command = [ (lib.getExe pkgs.gopls) ];
      extensions = [
        ".go"
        ".mod"
        ".sum"
      ];
    };
    rust-analyzer = {
      command = [ (lib.getExe pkgs.rust-analyzer) ];
      extensions = [ ".rs" ];
    };
    yamlls = {
      command = [
        (lib.getExe pkgs.yaml-language-server)
        "--stdio"
      ];
      extensions = [
        ".yaml"
        ".yml"
      ];
    };
    jsonls = {
      command = [
        (lib.getExe' pkgs.vscode-langservers-extracted "vscode-json-language-server")
        "--stdio"
      ];
      extensions = [
        ".json"
        ".jsonc"
      ];
    };
  };

  defaultFormatterConfig = {
    nixfmt = {
      command = [
        (lib.getExe pkgs.nixfmt-rfc-style)
        "$FILE"
      ];
      extensions = [ ".nix" ];
    };
    rustfmt = {
      command = [
        (lib.getExe pkgs.rustfmt)
        "$FILE"
      ];
      extensions = [ ".rs" ];
    };
  };

  defaultPermissionConfig = {
    edit = "ask";
    read = "allow";
    list = "allow";
    glob = "allow";
    grep = "allow";
    webfetch = "ask";
    write = "ask";
    task = "allow";
    todowrite = "allow";
    todoread = "allow";
    bash = {
      "git status*" = "allow";
      "git log*" = "allow";
      "git diff*" = "allow";
      "git show*" = "allow";
      "git branch*" = "allow";
      "git remote*" = "allow";
      "git config*" = "allow";
      "git rev-parse*" = "allow";
      "git ls-files*" = "allow";
      "git ls-remote*" = "allow";
      "git describe*" = "allow";
      "git tag --list*" = "allow";
      "git blame*" = "allow";
      "git shortlog*" = "allow";
      "git reflog*" = "allow";
      "git add*" = "allow";

      "nix search*" = "allow";
      "nix eval*" = "allow";
      "nix show-config*" = "allow";
      "nix flake show*" = "allow";
      "nix flake check*" = "allow";
      "nix log*" = "allow";

      "ls*" = "allow";
      "pwd*" = "allow";
      "find*" = "allow";
      "grep*" = "allow";
      "rg*" = "allow";
      "cat*" = "allow";
      "head*" = "allow";
      "tail*" = "allow";
      "mkdir*" = "allow";
      "chmod*" = "allow";

      "systemctl list-units*" = "allow";
      "systemctl list-timers*" = "allow";
      "systemctl status*" = "allow";
      "journalctl*" = "allow";
      "dmesg*" = "allow";
      "env*" = "allow";

      "git reset*" = "ask";
      "git commit*" = "ask";
      "git push*" = "ask";
      "git pull*" = "ask";
      "git merge*" = "ask";
      "git rebase*" = "ask";
      "git checkout*" = "ask";
      "git switch*" = "ask";
      "git stash*" = "ask";

      "rm*" = "ask";
      "mv*" = "ask";
      "cp*" = "ask";

      "systemctl start*" = "ask";
      "systemctl stop*" = "ask";
      "systemctl restart*" = "ask";
      "systemctl reload*" = "ask";
      "systemctl enable*" = "ask";
      "systemctl disable*" = "ask";

      "curl*" = "ask";
      "wget*" = "ask";
      "ping*" = "ask";
      "ssh*" = "ask";
      "scp*" = "ask";
      "rsync*" = "ask";

      "sudo*" = "ask";
      "nixos-rebuild*" = "ask";
      "kill*" = "ask";
      "killall*" = "ask";
      "pkill*" = "ask";
    };
  };

  defaultKeybinds = {
    session_new = "ctrl+n";
    session_timeline = "ctrl+g";
    messages_half_page_up = "up";
    messages_half_page_down = "down";
    messages_copy = "ctrl+y";
    messages_undo = "ctrl+z";
    command_list = "ctrl+p";
    agent_list = "ctrl+a";
    editor_open = "ctrl+e";
    status_view = "ctrl+s";
    history_previous = "pageup";
    history_next = "pagedown";
  };
in
{
  options.programs.opencode-sidekicks = {
    enable = lib.mkEnableOption "The Sidekicks - Elite AI coding squad for OpenCode";

    package = lib.mkOption {
      type = lib.types.package;
      default = sidekicksPackage;
      description = "The opencode-sidekicks plugin package to use";
    };

    opencodePackage = lib.mkOption {
      type = lib.types.package;
      default = opencodePackage;
      description = "The OpenCode package to use. Defaults to the version bundled with this flake.";
      example = lib.literalExpression "pkgs.opencode";
    };

    keybinds = lib.mkOption {
      type = lib.types.attrsOf lib.types.str;
      default = defaultKeybinds;
      description = "Keyboard shortcuts for OpenCode";
      example = lib.literalExpression ''
        {
          session_new = "ctrl+n";
          agent_list = "ctrl+a";
        }
      '';
    };

    instructions = lib.mkOption {
      type = lib.types.listOf lib.types.path;
      default = [ ];
      description = "Global instruction files to include";
      example = lib.literalExpression ''
        [ ./rules/nushell.md ./rules/project-conventions.md ]
      '';
    };

    mcp = lib.mkOption {
      type = lib.types.attrsOf lib.types.attrs;
      default = { };
      description = "MCP server configurations (passthrough to OpenCode)";
      example = lib.literalExpression ''
        {
          filesystem = {
            command = "npx";
            args = [ "-y" "@anthropic/mcp-filesystem" "/home/user" ];
          };
        }
      '';
    };

    agents = {
      enable = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = "Whether to install bundled Sidekicks agents";
      };

      extra = lib.mkOption {
        type = lib.types.attrsOf lib.types.path;
        default = { };
        description = "Additional agent files to install (name -> path)";
        example = lib.literalExpression ''
          {
            my-agent = ./agents/my-agent.md;
          }
        '';
      };
    };

    skills = {
      enable = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = "Whether to install bundled Sidekicks skills";
      };

      extra = lib.mkOption {
        type = lib.types.attrsOf lib.types.path;
        default = { };
        description = "Additional skill files to install (name -> path to SKILL.md)";
        example = lib.literalExpression ''
          {
            my-skill = ./skills/my-skill/SKILL.md;
          }
        '';
      };
    };

    defaults = {
      lsp = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = "Whether to apply default LSP server configuration";
      };

      formatter = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = "Whether to apply default formatter configuration";
      };

      permissions = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = "Whether to apply default permission configuration";
      };

      keybinds = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = "Whether to apply default keybind configuration";
      };
    };

    extraSettings = lib.mkOption {
      type = lib.types.attrs;
      default = { };
      description = "Extra settings to merge into OpenCode configuration (escape hatch)";
      example = lib.literalExpression ''
        {
          autoshare = false;
          theme = "dark";
        }
      '';
    };
  };

  config = lib.mkIf cfg.enable {
    xdg.configFile =
      agentFileAttrs // skillFileAttrs // extraAgentAttrs // extraSkillAttrs // instructionFileAttrs;

    programs.opencode = {
      enable = true;
      package = cfg.opencodePackage;

      settings = lib.mkMerge [
        {
          plugin = [ cfg.package ];
          autoupdate = false;
          default_agent = "professor";
        }

        (lib.mkIf cfg.defaults.lsp { lsp = defaultLspConfig; })
        (lib.mkIf cfg.defaults.formatter { formatter = defaultFormatterConfig; })
        (lib.mkIf cfg.defaults.permissions { permission = defaultPermissionConfig; })
        (lib.mkIf cfg.defaults.keybinds { keybinds = cfg.keybinds; })

        (lib.mkIf (cfg.instructions != [ ]) {
          instructions = cfg.instructions;
        })

        (lib.mkIf (cfg.mcp != { }) {
          mcp = cfg.mcp;
        })

        cfg.extraSettings
      ];
    };
  };
}
