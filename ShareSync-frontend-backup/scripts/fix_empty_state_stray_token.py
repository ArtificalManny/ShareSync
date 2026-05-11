from pathlib import Path
import re

path = Path("src/components/focus/YourMovesToday.jsx")
text = path.read_text()

start = text.find("function EmptyState({ onRefresh })")

if start == -1:
    raise SystemExit("Could not find function EmptyState({ onRefresh }). No changes made.")

expected_tail = """        >
          <RefreshCw className="w-4 h-4" />
          Check Again
        </button>
      </div>
    </div>
  );
}"""

tail_start = text.find(expected_tail, start)

if tail_start == -1:
    print("Could not find the expected EmptyState ending. Showing nearby code:")
    lines = text.splitlines()
    for i in range(245, min(len(lines), 320)):
        print(f"{i+1:04d}: {lines[i]}")
    raise SystemExit("No changes made.")

tail_end = tail_start + len(expected_tail)

before = text[:tail_end]
after = text[tail_end:]

# Remove exactly one immediate stray token after the function:
# possible leftovers: ;   );   };
new_after = re.sub(r"^\s*(?:;|\);|};)\s*\n", "\n", after, count=1)

if new_after == after:
    print("No obvious stray token found immediately after EmptyState.")
    print("Showing nearby code so we can inspect:")
    lines = text.splitlines()
    for i in range(250, min(len(lines), 318)):
        print(f"{i+1:04d}: {lines[i]}")
    raise SystemExit("No changes made.")

path.write_text(before + new_after)

print("✅ Removed stray token after EmptyState.")
print("✅ YourMovesToday.jsx should now parse again.")
