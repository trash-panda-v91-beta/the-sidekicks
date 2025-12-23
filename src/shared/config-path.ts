import * as path from "path"
import * as os from "os"

/**
 * Returns the user-level config directory based on the OS.
 * - Linux/macOS: XDG_CONFIG_HOME or ~/.config
 * - Windows: Checks ~/.config first (cross-platform), then %APPDATA% (fallback)
 */
export function getUserConfigDir(): string {
  if (process.platform === "win32") {
    return process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming")
  }
  return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
}
