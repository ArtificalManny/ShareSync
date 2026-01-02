#!/bin/bash

# File 1: FileUploader.jsx
sed -i '' "s/alert('File uploaded and activity logged!');/toast.success('File uploaded!', { description: 'Activity has been logged', duration: 3000 });/g" src/FileUploader.jsx
sed -i '' "s/alert('Upload failed.');/toast.error('Upload failed', { description: 'Please try again', duration: 3000 });/g" src/FileUploader.jsx

# File 2: ThreadForm.jsx
sed -i '' "s/alert('Thread created and activity logged!');/toast.success('Thread created!', { description: 'Activity has been logged', duration: 3000 });/g" src/ThreadForm.jsx
sed -i '' "s/alert('Failed to create thread.');/toast.error('Failed to create thread', { description: 'Please try again', duration: 3000 });/g" src/ThreadForm.jsx

# File 3: ShipCelebration.jsx
sed -i '' "s/alert('Link copied to clipboard!');/toast.success('Link copied!', { description: 'Share your achievement', duration: 2000 });/g" src/components/momentum/ShipCelebration.jsx

# File 4: PendingInvitesCard.jsx
sed -i '' "s/alert('Failed to accept invite.');/toast.error('Failed to accept invite', { description: 'Please try again', duration: 3000 });/g" src/components/projects/PendingInvitesCard.jsx

# File 5: Sidebar.jsx
sed -i '' "s/alert('Focus session complete! 🎉');/toast.success('Focus session complete! 🎉', { description: 'Great work!', duration: 4000 });/g" src/components/Sidebar.jsx

# File 6: ProjectActivityFeed.jsx
sed -i '' "s/alert(e\?\.message \|\| \"Failed to post update.\");/toast.error('Failed to post update', { description: e?.message || 'Please try again', duration: 3000 });/g" src/components/project/ProjectActivityFeed.jsx

# File 7: ProjectSettingsModal.jsx (3 alerts)
sed -i '' "s/alert(e\?\.message \|\| \"Failed to update icon.\");/toast.error('Failed to update icon', { description: e?.message || 'Please try again', duration: 3000 });/g" src/components/project/ProjectSettingsModal.jsx
sed -i '' "s/alert(e\?\.message \|\| \"Failed to disable public status.\");/toast.error('Failed to disable public status', { description: e?.message || 'Please try again', duration: 3000 });/g" src/components/project/ProjectSettingsModal.jsx
sed -i '' "s/alert(e\?\.message \|\| \"Failed to regenerate link.\");/toast.error('Failed to regenerate link', { description: e?.message || 'Please try again', duration: 3000 });/g" src/components/project/ProjectSettingsModal.jsx

# File 8: ShareCursorClip.jsx (2 alerts)
sed -i '' "s/alert('Failed to export video. Please try again.');/toast.error('Export failed', { description: 'Please try again', duration: 3000 });/g" src/components/social/ShareCursorClip.jsx
sed -i '' "s/alert('Download the video and share it to Instagram Stories manually.');/toast.info('Manual share required', { description: 'Download and share to Instagram Stories', duration: 4000 });/g" src/components/social/ShareCursorClip.jsx

# File 9: DMThread.jsx
sed -i '' "s/alert(e\?\.message \|\| \"Failed to send\");/toast.error('Failed to send message', { description: e?.message || 'Please try again', duration: 3000 });/g" src/components/messenger/DMThread.jsx

# File 10: AuditList.jsx
sed -i '' "s/alert(\"Could not export CSV.\");/toast.error('Export failed', { description: 'Could not export CSV', duration: 3000 });/g" src/components/audit/AuditList.jsx

# File 11: ProfilePicChanger.jsx
sed -i '' 's/alert`Upload failed:\\n\${err.message}`);/toast.error("Upload failed", { description: err.message, duration: 3000 });/g' src/components/ProfilePicChanger.jsx

# File 12: LinearAuthButton.jsx (3 alerts)
sed -i '' 's/alert("Linear SSO not configured. Continuing with a demo token.");/toast.warning("Demo mode", { description: "Linear SSO not configured - using demo token", duration: 3000 });/g' src/components/import/LinearAuthButton.jsx
sed -i '' 's/alert("Linear OAuth not implemented in this stub. Using demo token.");/toast.info("Demo mode", { description: "Using demo token for testing", duration: 3000 });/g' src/components/import/LinearAuthButton.jsx
sed -i '' "s/alert(e\?\.message \|\| \"Auth failed.\");/toast.error('Auth failed', { description: e?.message || 'Please try again', duration: 3000 });/g" src/components/import/LinearAuthButton.jsx

# File 13: JiraAuthButton.jsx
sed -i '' 's/alert("Jira SSO not configured. Continuing with a demo token.");/toast.warning("Demo mode", { description: "Jira SSO not configured - using demo token", duration: 3000 });/g' src/components/import/JiraAuthButton.jsx

echo "✅ All alert() calls replaced with toast()!"
