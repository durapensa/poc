import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface ChromeInstallation {
  profilePath: string;
  executablePath?: string;
  version?: string;
}

export class ChromePathDetector {
  private static getMacOSPaths(): string[] {
    const home = homedir();
    return [
      join(home, 'Library/Application Support/Google/Chrome/Default'),
      join(home, 'Library/Application Support/Google/Chrome Canary/Default'),
      join(home, 'Library/Application Support/Chromium/Default'),
    ];
  }

  private static getLinuxPaths(): string[] {
    const home = homedir();
    return [
      join(home, '.config/google-chrome/Default'),
      join(home, '.config/google-chrome-beta/Default'),
      join(home, '.config/chromium/Default'),
    ];
  }

  private static getWindowsPaths(): string[] {
    const home = homedir();
    return [
      join(home, 'AppData/Local/Google/Chrome/User Data/Default'),
      join(home, 'AppData/Local/Google/Chrome Beta/User Data/Default'),
      join(home, 'AppData/Local/Chromium/User Data/Default'),
    ];
  }

  private static getPlatformPaths(): string[] {
    const platform = process.platform;
    switch (platform) {
      case 'darwin':
        return this.getMacOSPaths();
      case 'linux':
        return this.getLinuxPaths();
      case 'win32':
        return this.getWindowsPaths();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  static detectChrome(): ChromeInstallation | null {
    const paths = this.getPlatformPaths();
    
    for (const profilePath of paths) {
      if (this.validateChromeProfile(profilePath)) {
        return { profilePath };
      }
    }
    
    return null;
  }

  private static validateChromeProfile(profilePath: string): boolean {
    if (!existsSync(profilePath)) {
      return false;
    }

    const requiredFiles = [
      'Cookies',
      'Local Storage',
      'Preferences'
    ];

    return requiredFiles.every(file => 
      existsSync(join(profilePath, file))
    );
  }

  static getAllProfiles(basePath?: string): ChromeInstallation[] {
    const paths = basePath ? [basePath] : this.getPlatformPaths();
    const installations: ChromeInstallation[] = [];

    for (const path of paths) {
      if (this.validateChromeProfile(path)) {
        installations.push({ profilePath: path });
      }
    }

    return installations;
  }
}