from pathlib import Path
from datetime import datetime
import re

CONTROLLER = Path("src/ai/ai.controller.ts")
MODULE = Path("src/ai/ai.module.ts")

def backup(path: Path):
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = path.with_suffix(path.suffix + f".bak.ai-usage-{stamp}")
    backup_path.write_text(path.read_text())
    print(f"[backup] {backup_path}")

def replace_once(text: str, old: str, new: str, label: str):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"[ERROR] {label}: expected 1 occurrence, found {count}")
    return text.replace(old, new)

def patch_controller():
    text = CONTROLLER.read_text()
    backup(CONTROLLER)

    text = replace_once(
        text,
        "import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';",
        "import { Body, Controller, Get, Post, Query, Req, TooManyRequestsException, UseGuards } from '@nestjs/common';",
        "nestjs common import"
    )

    if "SubscriptionsService" not in text:
        text = text.replace(
            "import { AIService } from './ai.service';",
            "import { AIService } from './ai.service';\nimport { SubscriptionsService } from '../subscriptions/subscriptions.service';"
        )

    text = replace_once(
        text,
        "  constructor(private readonly aiService: AIService) {}",
        """  constructor(
    private readonly aiService: AIService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  private getRequestUserId(req: Request): string | null {
    const user = (req as any)?.user || {};
    return user.sub || user.userId || user.id || null;
  }

  private async chargeAiCall(req: Request, amount = 1): Promise<void> {
    const userId = this.getRequestUserId(req);

    if (!userId) {
      return;
    }

    const usageCheck = await this.subscriptionsService.checkLimit(userId, 'aiCalls', amount);

    if (!usageCheck.allowed) {
      throw new TooManyRequestsException(
        `AI call limit reached for your current plan. Limit: ${usageCheck.limit}.`,
      );
    }

    await this.subscriptionsService.incrementUsage(userId, 'aiCalls', amount);
  }""",
        "AIController constructor"
    )

    text = replace_once(
        text,
        """  @Post('chat')
  async chat(@Body() body: any) {""",
        """  @Post('chat')
  async chat(@Req() req: Request, @Body() body: any) {""",
        "chat signature"
    )

    text = replace_once(
        text,
        """    const text = await this.aiService.generateChatResponse(body.prompt, contextData);
    return { text };""",
        """    const text = await this.aiService.generateChatResponse(body.prompt, contextData);
    await this.chargeAiCall(req);
    return { text };""",
        "chat usage charge"
    )

    text = replace_once(
        text,
        """  @Get('suggestion')
  async getSingleSuggestion() {
    const suggestion = await this.aiService.generateSingleSuggestion();
    // Wrap it in the exact JSON format your React AISuggestionCard expects
    return { suggestion };
  }""",
        """  @Get('suggestion')
  async getSingleSuggestion(@Req() req: Request) {
    const suggestion = await this.aiService.generateSingleSuggestion();
    await this.chargeAiCall(req);
    // Wrap it in the exact JSON format your React AISuggestionCard expects
    return { suggestion };
  }""",
        "single suggestion method"
    )

    text = replace_once(
        text,
        """    return this.aiService.getSuggestions(userId, {
      type: query.type,
      projectId: query.projectId,
      limit,
    });""",
        """    const suggestions = await this.aiService.getSuggestions(userId, {
      type: query.type,
      projectId: query.projectId,
      limit,
    });

    await this.chargeAiCall(req);

    return suggestions;""",
        "suggestions usage charge"
    )

    CONTROLLER.write_text(text)
    print("[patched] ai.controller.ts")

def patch_module():
    if not MODULE.exists():
        raise SystemExit("[ERROR] src/ai/ai.module.ts not found. Paste that file next if this fails.")

    text = MODULE.read_text()
    backup(MODULE)

    if "SubscriptionsModule" not in text:
        text = text.replace(
            "import { Module } from '@nestjs/common';",
            "import { Module } from '@nestjs/common';\nimport { SubscriptionsModule } from '../subscriptions/subscriptions.module';"
        )

    if "imports:" in text and "SubscriptionsModule" not in re.search(r"imports\\s*:\\s*\\[[\\s\\S]*?\\]", text).group(0):
        text = re.sub(
            r"imports\\s*:\\s*\\[",
            "imports: [\n    SubscriptionsModule,",
            text,
            count=1
        )
    elif "imports:" not in text:
        text = text.replace(
            "@Module({",
            "@Module({\n  imports: [SubscriptionsModule],",
            1
        )

    MODULE.write_text(text)
    print("[patched] ai.module.ts")

def main():
    print("[wire_ai_calls_into_subscription_usage] starting")
    patch_controller()
    patch_module()
    print()
    print("[wire_ai_calls_into_subscription_usage] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "chargeAiCall|getRequestUserId|SubscriptionsService|TooManyRequestsException|SubscriptionsModule|aiCalls" src/ai -C 6')
    print("  git diff -- src/ai/ai.controller.ts src/ai/ai.module.ts")

if __name__ == "__main__":
    main()
