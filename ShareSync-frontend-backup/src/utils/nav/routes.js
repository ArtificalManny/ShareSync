// Central nav config consumed by <Sidebar />.
// icon: a string key; map to lucide-react icons inside the Sidebar.
// countKey: key in a count object (e.g., { inbox: 3 }) to show a badge.

const routes = [
    { to: '/home',     label: 'Home',     icon: 'Home',     kbd: 'G H' },
    { to: '/projects', label: 'Projects', icon: 'Folder',   kbd: 'G P' },
    { to: '/me',       label: 'Profile',  icon: 'User',     kbd: 'G U' },
    { to: '/settings', label: 'Settings', icon: 'Settings', kbd: 'G S' },
  ];
  
  // Example of secondary routes (if you want a split group in the sidebar)
  // export const secondary = [
  //   { to: '/inbox', label: 'Inbox', icon: 'Inbox', countKey: 'inbox', kbd: null },
  // ];
  
  export default routes;
  