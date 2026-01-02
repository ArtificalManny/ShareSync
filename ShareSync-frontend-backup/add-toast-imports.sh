#!/bin/bash

FILES=(
  "src/FileUploader.jsx"
  "src/ThreadForm.jsx"
  "src/components/momentum/ShipCelebration.jsx"
  "src/components/projects/PendingInvitesCard.jsx"
  "src/components/Sidebar.jsx"
  "src/components/project/ProjectActivityFeed.jsx"
  "src/components/project/ProjectSettingsModal.jsx"
  "src/components/social/ShareCursorClip.jsx"
  "src/components/messenger/DMThread.jsx"
  "src/components/audit/AuditList.jsx"
  "src/components/ProfilePicChanger.jsx"
  "src/components/import/LinearAuthButton.jsx"
  "src/components/import/JiraAuthButton.jsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if toast import exists
    if ! grep -q "import.*toast" "$file"; then
      # Find the correct relative path based on file location
      if [[ "$file" == src/components/* ]]; then
        # Files in components/ need "../ui/Toast"
        import_line='import { toast } from "../ui/Toast";'
      else
        # Files in src/ root need "./components/ui/Toast"
        import_line='import { toast } from "./components/ui/Toast";'
      fi
      
      # Add import at the top after existing imports
      echo "$import_line" | cat - "$file" > temp && mv temp "$file"
      echo "✅ Added toast import to $file"
    else
      echo "⏭️  Toast already imported in $file"
    fi
  else
    echo "❌ File not found: $file"
  fi
done

echo ""
echo "🎉 All done! Toast imports added to all files!"
