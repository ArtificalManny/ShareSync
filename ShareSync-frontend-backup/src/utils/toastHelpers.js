/**
 * Common toast notification helpers
 */

export const showSuccessToast = (toast, title, message, action) => {
  return toast.addToast({
    type: 'success',
    title,
    message,
    action,
    duration: 5000,
  });
};

export const showErrorToast = (toast, title, message, action) => {
  return toast.addToast({
    type: 'error',
    title,
    message,
    action,
    duration: 7000, // Errors stay longer
  });
};

export const showWarningToast = (toast, title, message, action) => {
  return toast.addToast({
    type: 'warning',
    title,
    message,
    duration: 6000,
  });
};

export const showInfoToast = (toast, title, message, action) => {
  return toast.addToast({
    type: 'info',
    title,
    message,
    duration: 4000,
  });
};

// Common use cases
export const toastMessages = {
  projectCreated: (projectName) => ({
    type: 'success',
    title: 'Project Created',
    message: `${projectName} is ready to go!`,
  }),
  
  taskCompleted: (taskName) => ({
    type: 'success',
    title: 'Task Completed',
    message: `"${taskName}" marked as done. Keep the momentum! 🚀`,
  }),
  
  saveError: (action) => ({
    type: 'error',
    title: 'Save Failed',
    message: 'Could not save your changes. Please try again.',
    action,
  }),
  
  networkError: (action) => ({
    type: 'error',
    title: 'Connection Lost',
    message: 'Check your internet connection and try again.',
    action,
  }),
  
  changesSaved: () => ({
    type: 'success',
    title: 'Changes Saved',
    message: 'All changes synced successfully.',
    duration: 3000,
  }),
  
  inviteSent: (email) => ({
    type: 'success',
    title: 'Invite Sent',
    message: `Invitation sent to ${email}`,
  }),
  
  featureComingSoon: () => ({
    type: 'info',
    title: 'Coming Soon',
    message: 'This feature is in development. Stay tuned!',
  }),
};
