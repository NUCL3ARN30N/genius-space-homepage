// ===== Genius Space — Configuration =====

// GitHub username to fetch repositories from
const GITHUB_USER = 'NUCL3ARN30N';

// Repository Filter
// Leave empty array to show all repositories
// Add specific repository names to show only those
const ALLOWED_REPOS = [
'qr-genius',
'image-converter',
'PingPortTester',
];

// Display Settings
const DISPLAY_SETTINGS = {
  // Show forked repositories
  showForks: false,

  // Number of repositories to fetch per page (max 100)
  perPage: 100,

  // Sort order: 'updated', 'created', 'pushed', 'full_name'
  sortBy: 'updated',
};
