#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/user/user.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[restore_user_streak_protection_methods] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


METHODS = """  async getStreakProtectionStatus(userId: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .select('preferences streakDays lastLogin')
      .lean()
      .exec();

    if (!user) throw new NotFoundException('User not found');

    const preferences = (user as any).preferences || {};
    const focus = preferences.focus || {};
    const momentum = preferences.momentum || {};

    const emergencyBreaksLeft = Number(
      focus.emergencyBreaksLeft ??
        momentum.freezeCount ??
        momentum.freezesLeft ??
        1,
    );

    const allowFreeze = Boolean(momentum.allowFreeze ?? true);
    const canUseFreeze = allowFreeze && emergencyBreaksLeft > 0;

    return {
      success: true,
      allowFreeze,
      canUseFreeze,
      freezeCount: Math.max(0, emergencyBreaksLeft),
      emergencyBreaksLeft: Math.max(0, emergencyBreaksLeft),
      streakDays: (user as any).streakDays ?? 0,
      lastLogin: (user as any).lastLogin ?? null,
    };
  }

  async useStreakFreeze(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) throw new NotFoundException('User not found');

    const currentPreferences = (user as any).preferences || {};
    const currentFocus = currentPreferences.focus || {};
    const currentMomentum = currentPreferences.momentum || {};

    const currentCount = Number(
      currentFocus.emergencyBreaksLeft ??
        currentMomentum.freezeCount ??
        currentMomentum.freezesLeft ??
        1,
    );

    if (currentCount <= 0) {
      return {
        success: false,
        used: false,
        allowFreeze: Boolean(currentMomentum.allowFreeze ?? true),
        canUseFreeze: false,
        freezeCount: 0,
        emergencyBreaksLeft: 0,
        message: 'No streak freezes available.',
      };
    }

    const nextCount = Math.max(0, currentCount - 1);

    (user as any).preferences = {
      ...currentPreferences,
      focus: {
        ...currentFocus,
        emergencyBreaksLeft: nextCount,
      },
      momentum: {
        ...currentMomentum,
        allowFreeze: currentMomentum.allowFreeze ?? true,
        freezeCount: nextCount,
        lastFreezeUsedAt: new Date(),
      },
    };

    user.markModified('preferences');
    await user.save();

    return {
      success: true,
      used: true,
      allowFreeze: true,
      canUseFreeze: nextCount > 0,
      freezeCount: nextCount,
      emergencyBreaksLeft: nextCount,
      message: 'Streak freeze used.',
    };
  }

"""


def main():
    print("[restore_user_streak_protection_methods] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    src = TARGET.read_text(encoding="utf-8")

    if "async getStreakProtectionStatus(userId: string): Promise<any>" in src:
        print("[restore_user_streak_protection_methods] getStreakProtectionStatus already exists")
    if "async useStreakFreeze(userId: string): Promise<any>" in src:
        print("[restore_user_streak_protection_methods] useStreakFreeze already exists")

    if (
        "async getStreakProtectionStatus(userId: string): Promise<any>" in src
        and "async useStreakFreeze(userId: string): Promise<any>" in src
    ):
        print("[restore_user_streak_protection_methods] no changes needed")
        return

    marker = "  async getActivitySummary(userId: string): Promise<any> {"
    if src.count(marker) != 1:
        fail("Could not find exact insertion marker: async getActivitySummary")

    if "NotFoundException" not in src:
        fail("NotFoundException import/usage not found. Paste the top of user.service.ts before patching.")

    backup = TARGET.with_name(f"{TARGET.name}.bak-restore-streak-protection-{STAMP}")
    backup.write_text(src, encoding="utf-8")
    print(f"[restore_user_streak_protection_methods] backup created: {backup}")

    new_src = src.replace(marker, METHODS + marker, 1)

    checks = [
        "async getStreakProtectionStatus(userId: string): Promise<any>",
        "async useStreakFreeze(userId: string): Promise<any>",
        "emergencyBreaksLeft",
        "lastFreezeUsedAt",
        "user.markModified('preferences');",
        "async getActivitySummary(userId: string): Promise<any>",
    ]

    for check in checks:
        if check not in new_src:
            fail(f"Post-edit safety check failed. Missing: {check}")

    TARGET.write_text(new_src, encoding="utf-8")
    print(f"[restore_user_streak_protection_methods] patched: {TARGET}")

    print("")
    print("[restore_user_streak_protection_methods] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getStreakProtectionStatus|useStreakFreeze|emergencyBreaksLeft|lastFreezeUsedAt|getActivitySummary\" src/user/user.service.ts src/user/user.controller.ts -C 8")
    print("  git diff -- src/user/user.service.ts")


if __name__ == "__main__":
    main()
