from pathlib import Path
from datetime import datetime
import re
import sys

STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

SETTINGS = Path("src/pages/project/ProjectSettings.jsx")
AVATAR = Path("src/components/project/ProjectAvatar.jsx")
PROJECT_HOME = Path("src/pages/ProjectHome.jsx")
DISCOVER = Path("src/pages/Discover.jsx")


def fail(message: str) -> None:
    print(f"[patch_project_branding_frontend] ERROR: {message}")
    sys.exit(1)


def backup(path: Path) -> Path:
    if not path.exists():
        fail(f"missing file: {path}")
    backup_path = path.with_suffix(path.suffix + f".bak.before-project-branding-{STAMP}")
    backup_path.write_text(path.read_text())
    return backup_path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        fail(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


def regex_replace_once(text: str, pattern: str, replacement: str, label: str) -> str:
    compiled = re.compile(pattern, re.DOTALL)
    matches = list(compiled.finditer(text))
    if len(matches) != 1:
        fail(f"{label}: expected 1 match, found {len(matches)}")
    return compiled.sub(replacement, text, count=1)


def patch_project_settings() -> None:
    print("[patch] ProjectSettings.jsx")
    text = SETTINGS.read_text()

    if "PROJECT BRANDING FRONTEND BRIDGE" in text:
        print("[skip] ProjectSettings branding bridge already present")
        return

    backup_path = backup(SETTINGS)

    text = text.replace(
        "import React, { useState, useEffect } from 'react';",
        "import React, { useState, useEffect, useRef } from 'react';",
        1,
    )

    helper_block = """
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT BRANDING FRONTEND BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
// The backend stores uploaded image URLs as relative values like:
//   /uploads/project-branding-...
// The browser is running on Vite, so previews need the backend asset origin.
const RAW_PROJECT_ASSET_BASE =
  client?.defaults?.baseURL ||
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_BACKEND_URL ||
  'http://localhost:5050/api';

const PROJECT_ASSET_ORIGIN = String(RAW_PROJECT_ASSET_BASE)
  .replace(/\\/api\\/?$/, '')
  .replace(/\\/$/, '');

function resolveProjectAssetUrl(value) {
  if (!value || typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    return `${PROJECT_ASSET_ORIGIN}/${trimmed.replace(/^\\/+/, '')}`;
  }

  return trimmed;
}

"""

    text = replace_once(
        text,
        "import client from '../../api/client';\n",
        "import client from '../../api/client';\n" + helper_block,
        "ProjectSettings helper insertion",
    )

    text = replace_once(
        text,
        """  const [formData, setFormData] = useState({
    name: '',
    picture: '',
    banner: '',
    description: ''
  });
""",
        """  const [formData, setFormData] = useState({
    name: '',
    icon: '📁',
    picture: '',
    banner: '',
    description: ''
  });
""",
        "ProjectSettings initial formData",
    )

    text = replace_once(
        text,
        """  const [saving, setSaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
""",
        """  const [saving, setSaving] = useState(false);
  const [uploadingBranding, setUploadingBranding] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const logoFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);
""",
        "ProjectSettings upload refs",
    )

    text = replace_once(
        text,
        """      setFormData({
        name: project.name || '',
        picture: project.icon || '📁',
        banner: project.banner || '',
        description: project.description || ''
      });
""",
        """      setFormData({
        name: project.name || '',
        icon: project.icon || project.emoji || '📁',
        picture: project.logoUrl || project.logo || project.avatarUrl || project.picture || '',
        banner: project.bannerUrl || project.banner || project.coverUrl || project.coverImageUrl || '',
        description: project.description || ''
      });
""",
        "ProjectSettings sync formData",
    )

    text = regex_replace_once(
        text,
        r"""      // ✅ FIX: Removed 'banner' because it doesn't exist in the backend schema
      // This stops NestJS from throwing a 400 Bad Request
      await client\.put\(`/projects/\$\{id\}`, \{
        name: formData\.name,
        description: formData\.description,
        icon: formData\.picture
      \}\);""",
        """      await client.put(`/projects/${id}`, {
        name: formData.name,
        description: formData.description,
        icon: formData.icon || '📁',
        emoji: formData.icon || '📁',
        logoUrl: formData.picture || '',
        bannerUrl: formData.banner || ''
      });""",
        "ProjectSettings save payload",
    )

    text = replace_once(
        text,
        """  const handleImageUpload = (type) => {
    toast({ title: 'Image upload coming soon!', variant: 'default' });
  };
""",
        """  const handleImageUpload = (type) => {
    if (!canEditProjectInfo || uploadingBranding) return;

    if (type === 'banner') {
      bannerFileInputRef.current?.click();
      return;
    }

    logoFileInputRef.current?.click();
  };

  const handleBrandingFileSelected = async (type, event) => {
    if (!canEditProjectInfo) return;

    const file = event?.target?.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith('image/')) {
      toast({
        title: 'Please choose an image file',
        variant: 'error'
      });
      event.target.value = '';
      return;
    }

    const normalizedType = type === 'banner' ? 'banner' : 'logo';
    const body = new FormData();
    body.append('file', file);
    body.append('kind', normalizedType);

    setUploadingBranding(true);

    try {
      const response = await client.post(`/projects/${id}/branding-image`, body, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const payload = response?.data?.data || response?.data || {};
      const url =
        payload.url ||
        payload.project?.[normalizedType === 'banner' ? 'bannerUrl' : 'logoUrl'] ||
        '';

      if (!url) {
        throw new Error('Upload succeeded, but no image URL was returned.');
      }

      setFormData((prev) => ({
        ...prev,
        ...(normalizedType === 'banner'
          ? { banner: url }
          : { picture: url }),
      }));

      toast({
        title: normalizedType === 'banner' ? '✅ Project banner uploaded!' : '✅ Project logo uploaded!',
        variant: 'success'
      });

      refresh();
    } catch (error) {
      toast({
        title: 'Image upload failed',
        description: error.response?.data?.message || error.message,
        variant: 'error'
      });
    } finally {
      setUploadingBranding(false);
      if (event?.target) event.target.value = '';
    }
  };
""",
        "ProjectSettings upload handler",
    )

    text = replace_once(
        text,
        """      <div className="max-w-4xl mx-auto px-6 py-8">
""",
        """      <div className="max-w-4xl mx-auto px-6 py-8">
        <input
          ref={logoFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleBrandingFileSelected('logo', event)}
        />
        <input
          ref={bannerFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleBrandingFileSelected('banner', event)}
        />
""",
        "ProjectSettings hidden file inputs",
    )

    text = text.replace(
        '<img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />',
        '<img src={resolveProjectAssetUrl(formData.banner)} alt="Banner" className="w-full h-full object-cover" />',
        1,
    )

    text = text.replace(
        "onClick={() => setFormData({ ...formData, banner: null })}",
        "onClick={() => setFormData({ ...formData, banner: '' })}",
        1,
    )

    text = text.replace(
        "Project Icon</label>",
        "Project Logo / Icon</label>",
        1,
    )

    preview_pattern = r"""<div className="w-20 h-20 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-3xl font-bold relative group">
                    \{formData\.picture\}
                    \{canEditProjectInfo && \(
                      <button
                        onClick=\{\(\) => handleImageUpload\('picture'\)\}
                        className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                    \)\}
                  </div>
                  <div className="flex-1">"""

    preview_replacement = """<div className="w-20 h-20 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-3xl font-bold relative group overflow-hidden">
                    {formData.picture ? (
                      <img
                        src={resolveProjectAssetUrl(formData.picture)}
                        alt={`${formData.name || 'Project'} logo`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{formData.icon || '📁'}</span>
                    )}

                    {canEditProjectInfo && (
                      <button
                        onClick={() => handleImageUpload('picture')}
                        disabled={uploadingBranding}
                        className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">"""

    text = regex_replace_once(
        text,
        preview_pattern,
        preview_replacement,
        "ProjectSettings logo preview",
    )

    text = text.replace(
        "value={formData.picture}",
        "value={formData.icon}",
        1,
    )

    text = text.replace(
        "onChange={(e) => setFormData({ ...formData, picture: e.target.value })}",
        "onChange={(e) => setFormData({ ...formData, icon: e.target.value })}",
        1,
    )

    text = text.replace(
        'placeholder="Enter emoji or icon URL"',
        'placeholder="Enter emoji fallback, e.g. 📁"',
        1,
    )

    text = text.replace(
        "disabled={saving}",
        "disabled={saving || uploadingBranding}",
        1,
    )

    text = text.replace(
        "{saving ? 'Saving...' : 'Save Changes'}",
        "{saving ? 'Saving...' : uploadingBranding ? 'Uploading image...' : 'Save Changes'}",
        1,
    )

    SETTINGS.write_text(text)
    print(f"[patched] ProjectSettings backup created: {backup_path}")


def patch_project_avatar() -> None:
    print("[patch] ProjectAvatar.jsx")
    text = AVATAR.read_text()

    if "PROJECT AVATAR BRANDING BRIDGE" in text:
        print("[skip] ProjectAvatar branding bridge already present")
        return

    backup_path = backup(AVATAR)

    helper_block = """
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT AVATAR BRANDING BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
// Prefer uploaded project logos over symbolic icon/emoji fallbacks.
const RAW_PROJECT_ASSET_BASE =
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_BACKEND_URL ||
  "http://localhost:5050/api";

const PROJECT_ASSET_ORIGIN = String(RAW_PROJECT_ASSET_BASE)
  .replace(/\\/api\\/?$/, "")
  .replace(/\\/$/, "");

function resolveProjectAssetUrl(value) {
  if (!value || typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    return `${PROJECT_ASSET_ORIGIN}/${trimmed.replace(/^\\/+/, "")}`;
  }

  return trimmed;
}

function getProjectLogoUrl(project, visual) {
  return resolveProjectAssetUrl(
    project?.logoUrl ||
      project?.logo ||
      project?.picture ||
      project?.avatarUrl ||
      project?.imageUrl ||
      visual?.imageUrl ||
      ""
  );
}

"""

    text = text.replace(
        "};\n\nexport default function ProjectAvatar",
        "};\n" + helper_block + "\nexport default function ProjectAvatar",
        1,
    )

    text = replace_once(
        text,
        """  const visual = getProjectVisuals(project);
  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.lg;
""",
        """  const visual = getProjectVisuals(project);
  const avatarImageUrl = getProjectLogoUrl(project, visual);
  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.lg;
""",
        "ProjectAvatar image variable",
    )

    text = text.replace("{visual.imageUrl ? (", "{avatarImageUrl ? (", 1)
    text = text.replace("src={visual.imageUrl}", "src={avatarImageUrl}", 1)

    AVATAR.write_text(text)
    print(f"[patched] ProjectAvatar backup created: {backup_path}")


def patch_project_home_banner() -> None:
    print("[patch] ProjectHome.jsx")
    text = PROJECT_HOME.read_text()

    if "PROJECT HOME BANNER BRANDING BRIDGE" in text:
        print("[skip] ProjectHome banner bridge already present")
        return

    backup_path = backup(PROJECT_HOME)

    helper_block = """// ─────────────────────────────────────────────────────────────────────────────
// PROJECT HOME BANNER BRANDING BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
const RAW_PROJECT_HOME_ASSET_BASE =
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_BACKEND_URL ||
  "http://localhost:5050/api";

const PROJECT_HOME_ASSET_ORIGIN = String(RAW_PROJECT_HOME_ASSET_BASE)
  .replace(/\\/api\\/?$/, "")
  .replace(/\\/$/, "");

function resolveProjectHomeAssetUrl(value) {
  if (!value || typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    return `${PROJECT_HOME_ASSET_ORIGIN}/${trimmed.replace(/^\\/+/, "")}`;
  }

  return trimmed;
}

function getProjectBannerUrl(project) {
  return resolveProjectHomeAssetUrl(
    project?.bannerUrl ||
      project?.banner ||
      project?.coverUrl ||
      project?.coverImageUrl ||
      ""
  );
}

"""

    if "function ProjectHeader({" not in text:
      fail("could not find ProjectHeader function")

    text = text.replace(
        "function ProjectHeader({",
        helper_block + "function ProjectHeader({",
        1,
    )

    nav_marker = """      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
"""

    banner_block = """      {getProjectBannerUrl(project) ? (
        <div className="mb-6 h-36 md:h-44 overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-100 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
          <img
            src={getProjectBannerUrl(project)}
            alt={`${project?.name || "Project"} banner`}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

"""

    if nav_marker not in text:
        fail("could not find ProjectHeader nav marker for banner insertion")

    text = text.replace(nav_marker, banner_block + nav_marker, 1)

    PROJECT_HOME.write_text(text)
    print(f"[patched] ProjectHome backup created: {backup_path}")


def inspect_discover() -> None:
    print("[inspect] Discover.jsx")
    if not DISCOVER.exists():
        print("[skip] Discover.jsx not found")
        return

    text = DISCOVER.read_text()

    if "ProjectAvatar" in text:
        print("[info] Discover.jsx already references ProjectAvatar; uploaded logos should work if project objects include logoUrl.")
    else:
        print("[note] Discover.jsx does not currently reference ProjectAvatar.")
        print("[note] If Discover still shows old emoji icons after this patch, paste:")
        print("       sed -n '1,460p' src/pages/Discover.jsx")
        print("[note] Then we can safely convert its project icon row to use ProjectAvatar without guessing.")


def main() -> None:
    print("[patch_project_branding_frontend] starting")
    patch_project_settings()
    patch_project_avatar()
    patch_project_home_banner()
    inspect_discover()
    print()
    print("[patch_project_branding_frontend] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "PROJECT BRANDING FRONTEND BRIDGE|PROJECT AVATAR BRANDING BRIDGE|PROJECT HOME BANNER BRANDING BRIDGE|branding-image|logoUrl|bannerUrl|resolveProjectAssetUrl|Project Logo / Icon" src/pages/project/ProjectSettings.jsx src/components/project/ProjectAvatar.jsx src/pages/ProjectHome.jsx -C 8')
    print("  git diff -- src/pages/project/ProjectSettings.jsx src/components/project/ProjectAvatar.jsx src/pages/ProjectHome.jsx")


if __name__ == "__main__":
    main()
