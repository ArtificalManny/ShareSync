from pathlib import Path

path = Path("src/components/ecosystem/FeaturedProjects.jsx")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

broken_block = """  const projectName = project.name || project.title || project.projectName || 'Untitled Project';
  const description = project.description || project.subtitle || project.category || '';
  const relationshipLabel = getProjectRelationshipLabel(project);
  const relationshipButtonText =
    following && relationshipLabel === 'Follow' ? 'Following' : relationshipLabel;
"""

fixed_block = """  const projectName = project.name || project.title || project.projectName || 'Untitled Project';
  const description = project.description || project.subtitle || project.category || '';
"""

if broken_block not in text:
    raise SystemExit("Could not find the broken relationshipButtonText block before useFollow.")

text = text.replace(broken_block, fixed_block)

hook_block = """  const { following, loading: followLoading, toggle } = useFollow(
    pid,
    initialFollowing || false,
  );
"""

replacement_hook_block = """  const { following, loading: followLoading, toggle } = useFollow(
    pid,
    initialFollowing || false,
  );

  const relationshipLabel = getProjectRelationshipLabel(project);
  const relationshipButtonText =
    following && relationshipLabel === 'Follow' ? 'Following' : relationshipLabel;
"""

if hook_block not in text:
    raise SystemExit("Could not find useFollow hook block.")

text = text.replace(hook_block, replacement_hook_block)

path.write_text(text)
print(f"Fixed initialization order in {path}")
