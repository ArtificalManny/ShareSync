from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/project/ProjectSettings.jsx")
text = path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".bak-before-save-payload-{stamp}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

pattern = re.compile(
    r"""  const handleSaveProject = async \(\) => \{
    if \(!canEditProjectInfo\) return;
    setSaving\(true\);
    try \{
      await client\.put\(`/projects/\$\{id\}`, \{
        name: formData\.name,
        description: formData\.description,
        icon: formData\.icon \|\| '📁',
        emoji: formData\.icon \|\| '📁',
        logoUrl: formData\.picture \|\| '',
        bannerUrl: formData\.banner \|\| ''
      \}\);
      toast\(\{ title: '✅ Project updated!', variant: 'success' \}\);
      refresh\(\); // Reload data via hook
    \} catch \(error\) \{
      toast\(\{
        title: 'Failed to update project',
        description: error\.response\?\.data\?\.message \|\| error\.message,
        variant: 'error'
      \}\);
    \} finally \{
      setSaving\(false\);
    \}
  \};""",
    re.DOTALL,
)

replacement = """  const handleSaveProject = async () => {
    if (!canEditProjectInfo) return;

    const cleanIcon = String(formData.icon || '📁').trim() || '📁';

    const payload = {
      name: String(formData.name || '').trim(),
      description: String(formData.description || '').trim(),
      icon: cleanIcon,
      emoji: cleanIcon,
    };

    const cleanLogoUrl = String(formData.picture || '').trim();
    const cleanBannerUrl = String(formData.banner || '').trim();

    // Do not send empty image URLs. Let the branding upload endpoint control these.
    if (cleanLogoUrl && !cleanLogoUrl.startsWith('blob:')) {
      payload.logoUrl = cleanLogoUrl;
    }

    if (cleanBannerUrl && !cleanBannerUrl.startsWith('blob:')) {
      payload.bannerUrl = cleanBannerUrl;
    }

    setSaving(true);

    try {
      await client.put(`/projects/${id}`, payload);
      toast({ title: '✅ Project updated!', variant: 'success' });
      refresh();
    } catch (error) {
      const backendPayload = error?.response?.data;

      console.error('[ProjectSettings] Failed to update project:', {
        status: error?.response?.status,
        backendPayload,
        requestPayload: payload,
        message: error?.message,
      });

      toast({
        title: 'Failed to update project',
        description:
          backendPayload?.message ||
          backendPayload?.error ||
          error.message ||
          'Internal server error',
        variant: 'error'
      });
    } finally {
      setSaving(false);
    }
  };"""

text, count = pattern.subn(replacement, text, count=1)

if count != 1:
    raise SystemExit("❌ Could not replace handleSaveProject(). No changes written.")

path.write_text(text)

print("✅ ProjectSettings save payload hardened.")
print("✅ Empty logoUrl/bannerUrl are no longer sent on normal Save Changes.")
print("✅ Console logging added for backend error details.")
print("")
print("Inspect with:")
print('rg -n "const handleSaveProject|const payload|logoUrl|bannerUrl|Failed to update project" src/pages/project/ProjectSettings.jsx -C 8')
