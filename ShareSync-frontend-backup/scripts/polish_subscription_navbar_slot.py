from pathlib import Path

path = Path("src/components/Navbar.jsx")
text = path.read_text()

# 1) Let the middle navbar area shrink properly so the right-side controls do not get crushed.
old_middle = '          <div className="flex-1 flex items-center justify-start px-4">'
new_middle = '          <div className="flex-1 min-w-0 flex items-center justify-start px-4">'

if old_middle in text:
    text = text.replace(old_middle, new_middle, 1)
else:
    print("Middle flex area already patched or not found.")

# 2) Protect the right-side controls from shrinking.
old_right = '''          <div className="flex items-center gap-2">
            <div className="hidden sm:block mr-2">'''

new_right = '''          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block mr-2">'''

if old_right in text:
    text = text.replace(old_right, new_right, 1)
else:
    print("Right control cluster already patched or not found.")

# 3) Replace the plain SubscriptionButton placement with a visually distinct plan slot.
old_subscription_slot = '''                        <div className="hidden md:block"><NavbarSoundToggle /></div>
            <BackgroundColorPicker />

            <div className="hidden md:block"><SubscriptionButton /></div>'''

new_subscription_slot = '''            <div className="hidden md:block shrink-0">
              <NavbarSoundToggle />
            </div>

            <BackgroundColorPicker />

            <div
              className="hidden md:flex shrink-0 items-center border-l border-slate-200/70 pl-3 ml-1 dark:border-white/10"
              aria-label="Subscription and plan status"
            >
              <div className="relative rounded-2xl bg-gradient-to-r from-violet-200/70 via-amber-200/70 to-cyan-200/70 p-[1px] shadow-sm shadow-violet-500/10 dark:from-violet-500/25 dark:via-amber-500/25 dark:to-cyan-500/25">
                <div className="rounded-[15px] bg-white/80 p-0.5 backdrop-blur-md dark:bg-[#0B0B10]/80">
                  <SubscriptionButton />
                </div>
              </div>
            </div>'''

if old_subscription_slot not in text:
    raise SystemExit("Could not find the exact NavbarSoundToggle + SubscriptionButton block. No unsafe edit made.")

text = text.replace(old_subscription_slot, new_subscription_slot, 1)

path.write_text(text)

print("✅ Navbar subscription slot polished.")
print("✅ Right controls now resist shrinking.")
print("✅ SubscriptionButton now has a distinct bordered premium/status container.")
