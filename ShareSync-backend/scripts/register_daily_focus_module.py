from pathlib import Path

path = Path("src/app.module.ts")
text = path.read_text()

daily_focus_import = "import { DailyFocusModule } from './daily-focus/daily-focus.module';"

# 1. Add import after TasksModule import because Daily Focus depends on tasks/projects logic.
if daily_focus_import not in text:
    anchor = "import { TasksModule } from './tasks/tasks.module';"
    if anchor not in text:
        raise SystemExit("Could not find TasksModule import. No changes written.")

    text = text.replace(
        anchor,
        anchor + "\nimport { DailyFocusModule } from './daily-focus/daily-focus.module';",
        1,
    )

# 2. Add DailyFocusModule after TasksModule in the imports array.
if "DailyFocusModule," not in text:
    anchor = "    TasksModule,\n"
    if anchor not in text:
        raise SystemExit("Could not find TasksModule in @Module imports. No changes written.")

    text = text.replace(
        anchor,
        anchor + "    DailyFocusModule,\n",
        1,
    )

# 3. Safety checks.
if text.count(daily_focus_import) != 1:
    raise SystemExit("Safety check failed: DailyFocusModule import count is not exactly 1. No changes written.")

if text.count("    DailyFocusModule,") != 1:
    raise SystemExit("Safety check failed: DailyFocusModule registration count is not exactly 1. No changes written.")

path.write_text(text)

print("✅ AppModule now imports DailyFocusModule.")
print("✅ AppModule now registers DailyFocusModule after TasksModule.")
print("⚠️ Next step: create src/daily-focus/daily-focus.module.ts before starting backend.")
