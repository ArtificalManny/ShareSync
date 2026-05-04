from pathlib import Path

path = Path("src/components/ecosystem/Achievements.jsx")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

old = """    loadStats();

    const onRefresh = () => loadStats();
    window.addEventListener('task.completed', onRefresh);
    window.addEventListener('project.completed', onRefresh);
    window.addEventListener('project:lifecycle-updated', onRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener('task.completed', onRefresh);
      window.removeEventListener('project.completed', onRefresh);
      window.removeEventListener('project:lifecycle-updated', onRefresh);
    };
  }, []);"""

new = """    loadStats();

    const pollingId = window.setInterval(loadStats, 30000);

    const onRefresh = () => loadStats();
    window.addEventListener('task.completed', onRefresh);
    window.addEventListener('project.completed', onRefresh);
    window.addEventListener('project:lifecycle-updated', onRefresh);
    window.addEventListener('local-ship', onRefresh);

    return () => {
      cancelled = true;
      window.clearInterval(pollingId);
      window.removeEventListener('task.completed', onRefresh);
      window.removeEventListener('project.completed', onRefresh);
      window.removeEventListener('project:lifecycle-updated', onRefresh);
      window.removeEventListener('local-ship', onRefresh);
    };
  }, []);"""

if old not in text:
    raise SystemExit("Could not find Achievements stats loading effect block.")

text = text.replace(old, new, 1)

path.write_text(text)
print("Added 30-second stats polling fallback to Achievements.jsx")
