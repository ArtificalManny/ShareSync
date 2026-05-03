from pathlib import Path
from datetime import datetime
import sys

TARGET = Path("src/activities/activities.service.ts")

def fail(message):
    print(f"[fix_activities_normalized_actor_id_type] ERROR: {message}")
    sys.exit(1)

def main():
    print("[fix_activities_normalized_actor_id_type] starting")

    if not TARGET.exists():
        fail(f"missing file: {TARGET}")

    text = TARGET.read_text()
    original = text

    backup = TARGET.with_suffix(
        TARGET.suffix + f".bak.before-normalized-actor-id-type-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(original)

    old = "normalizedActor?.id ||"
    new = "(normalizedActor as any)?.id ||"

    if new in text:
        print("[skip] normalizedActor id type cast already present")
    elif old in text:
        text = text.replace(old, new, 1)
        TARGET.write_text(text)
        print("[patched] normalizedActor?.id cast safely to any")
    else:
        fail("could not find normalizedActor?.id ||")

    updated = TARGET.read_text()

    if "normalizedActor?.id ||" in updated:
        fail("old unsafe normalizedActor?.id reference still present")

    if "(normalizedActor as any)?.id ||" not in updated:
        fail("new safe normalizedActor id reference missing")

    print(f"[fix_activities_normalized_actor_id_type] backup created: {backup}")
    print("[fix_activities_normalized_actor_id_type] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "normalizedActor|actorId|serializeActivityItemForClient|activityFeedSerializeActor" src/activities/activities.service.ts -C 8')
    print("  git diff -- src/activities/activities.service.ts")

if __name__ == "__main__":
    main()
