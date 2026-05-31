from pathlib import Path
import shutil
from datetime import datetime

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

app_path = Path("src/App.jsx")
reset_path = Path("src/pages/ResetPassword.jsx")

for path in [app_path, reset_path]:
    backup = path.with_suffix(path.suffix + f".bak-before-reset-password-route-{stamp}")
    shutil.copy2(path, backup)
    print(f"✅ Backup created: {backup}")

# ─────────────────────────────────────────────────────────────────────────────
# 1) Patch App.jsx: import ResetPassword + route /reset-password/:token
# ─────────────────────────────────────────────────────────────────────────────
app = app_path.read_text()

if 'import ResetPassword from "./pages/ResetPassword";' not in app:
    app = app.replace(
        'import ForgotPassword from "./pages/ForgotPassword";',
        'import ForgotPassword from "./pages/ForgotPassword";\nimport ResetPassword from "./pages/ResetPassword";',
        1,
    )
    print("✅ Added ResetPassword import to App.jsx")
else:
    print("✅ ResetPassword import already exists")

# Make reset password count as an auth page so app chrome does not show there.
old_auth_check = '''  const isAuthPage = [
    "/login",
    "/create-account",
    "/forgot-password",
    "/landing",
    "/onboarding",
  ].includes(location.pathname);'''

new_auth_check = '''  const isAuthPage =
    [
      "/login",
      "/create-account",
      "/forgot-password",
      "/landing",
      "/onboarding",
    ].includes(location.pathname) ||
    location.pathname.startsWith("/reset-password/");'''

if old_auth_check in app:
    app = app.replace(old_auth_check, new_auth_check, 1)
    print("✅ Updated isAuthPage to include /reset-password/:token")
else:
    print("⚠️ Could not find exact isAuthPage block. Route will still work, but chrome hiding may need manual review.")

route_block = '''              <Route
                path="/reset-password/:token"
                element={
                  <PublicOnlyRoute>
                    <ResetPassword />
                  </PublicOnlyRoute>
                }
              />
'''

if 'path="/reset-password/:token"' not in app:
    marker = '''              <Route
                path="/forgot-password"
                element={
                  <PublicOnlyRoute>
                    <ForgotPassword />
                  </PublicOnlyRoute>
                }
              />
'''
    if marker not in app:
        raise SystemExit("❌ Could not find /forgot-password route block. No route inserted.")
    app = app.replace(marker, marker + route_block, 1)
    print("✅ Added /reset-password/:token route to App.jsx")
else:
    print("✅ /reset-password/:token route already exists")

app_path.write_text(app)

# ─────────────────────────────────────────────────────────────────────────────
# 2) Patch ResetPassword.jsx: use the same AuthContext pattern as ForgotPassword
# ─────────────────────────────────────────────────────────────────────────────
reset = reset_path.read_text()

reset = reset.replace(
    "import React, { useState, useEffect, useContext } from 'react';",
    "import React, { useState, useEffect } from 'react';",
    1,
)

reset = reset.replace(
    "import { AuthContext } from '../AuthContext';",
    "import { useAuth } from '../context/AuthContext';",
    1,
)

reset = reset.replace(
    "  const { resetPassword, isAuthenticated, isLoading, authError, setAuthError } = useContext(AuthContext);",
    "  const { resetPassword, user, loading, authError, setAuthError } = useAuth();",
    1,
)

reset = reset.replace(
    "    if (!isLoading && isAuthenticated) {\n      navigate('/', { replace: true });\n    }\n  }, [isLoading, isAuthenticated, navigate]);",
    "    if (!loading && user) {\n      navigate('/home', { replace: true });\n    }\n  }, [loading, user, navigate]);",
    1,
)

reset = reset.replace("  if (isLoading) {", "  if (loading) {", 1)

reset_path.write_text(reset)

print("✅ ResetPassword.jsx now uses ../context/AuthContext useAuth()")
print("")
print("Inspect:")
print('rg -n "ResetPassword|reset-password|isAuthPage|useAuth|isLoading|isAuthenticated|../AuthContext" src/App.jsx src/pages/ResetPassword.jsx -C 4')
