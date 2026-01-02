#!/bin/bash

# File 1: ProfilePicChanger.jsx (line 45 - template literal alert)
sed -i '' '45s/.*/      toast.error("Upload failed", { description: err.message, duration: 3000 });/' src/components/ProfilePicChanger.jsx

# File 2: JiraAuthButton.jsx (2 alerts)
sed -i '' 's/alert("Jira OAuth not implemented in this stub. Using demo token.");/toast.info("Demo mode", { description: "Using demo token for testing", duration: 3000 });/g' src/components/import/JiraAuthButton.jsx
sed -i '' "s/alert(e\?\.message \|\| \"Auth failed.\");/toast.error('Auth failed', { description: e?.message || 'Please try again', duration: 3000 });/g" src/components/import/JiraAuthButton.jsx

# File 3: SubmitAssignment.jsx (2 alerts)
sed -i '' "s/alert('Assignment submitted and activity logged!');/toast.success('Assignment submitted!', { description: 'Activity has been logged', duration: 3000 });/g" src/SubmitAssignment.jsx
sed -i '' "s/alert('Submission failed.');/toast.error('Submission failed', { description: 'Please try again', duration: 3000 });/g" src/SubmitAssignment.jsx

# File 4: ImportWizard.jsx (2 alerts - template literals)
sed -i '' '81s/.*/      toast.success("Import complete", { description: `Imported ${selected.length} items from ${provider}`, duration: 3000 });/' src/pages/import/ImportWizard.jsx
sed -i '' "85s/.*/      toast.error('Import failed', { description: e?.message || 'Please try again', duration: 3000 });/" src/pages/import/ImportWizard.jsx

echo "✅ All 7 remaining alert() calls replaced!"
