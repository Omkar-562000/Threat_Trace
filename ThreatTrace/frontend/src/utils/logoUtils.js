/**
 * Logo Utilities - Dynamic logo loading and management
 */

/**
 * Scans available logos in the public/images/logos/ folder
 * @returns {Promise<Array>} Array of available logo objects
 */
export const scanAvailableLogos = async () => {
  const logos = [];

  // Common logo naming patterns to check
  const logoPatterns = [
    'logo-full.png', 'logo-full.jpg', 'logo-full.svg',
    'logo-icon.png', 'logo-icon.jpg', 'logo-icon.svg',
    'logo.png', 'logo.jpg', 'logo.svg',
    'icon.png', 'icon.jpg', 'icon.svg'
  ];

  // Check each pattern
  for (const pattern of logoPatterns) {
    try {
      const response = await fetch(`/images/logos/${pattern}`, { method: 'HEAD' });
      if (response.ok) {
        const type = pattern.includes('full') ? 'full' :
                    pattern.includes('icon') ? 'icon' : 'main';
        logos.push({
          path: `/images/logos/${pattern}`,
          type: type,
          filename: pattern,
          exists: true
        });
      }
    } catch (error) {
      // Logo doesn't exist, continue
    }
  }

  return logos;
};

/**
 * Gets the best available logo for a given type
 * @param {string} type - 'full', 'icon', or 'main'
 * @param {Array} availableLogos - Array of available logos
 * @returns {Object|null} Best matching logo object or null
 */
export const getBestLogo = (type, availableLogos) => {
  if (!availableLogos || availableLogos.length === 0) return null;

  // Priority order for each type
  const priorities = {
    full: ['logo-full.png', 'logo-full.jpg', 'logo-full.svg', 'logo.png', 'logo.jpg', 'logo.svg'],
    icon: ['logo-icon.png', 'logo-icon.jpg', 'logo-icon.svg', 'icon.png', 'icon.jpg', 'icon.svg', 'logo.png', 'logo.jpg', 'logo.svg'],
    main: ['logo.png', 'logo.jpg', 'logo.svg', 'logo-full.png', 'logo-full.jpg', 'logo-full.svg']
  };

  const typePriorities = priorities[type] || priorities.main;

  for (const filename of typePriorities) {
    const logo = availableLogos.find(l => l.filename === filename);
    if (logo) return logo;
  }

  // If no exact match, return first available logo
  return availableLogos[0];
};

/**
 * Validates if an image file is a valid logo format
 * @param {string} filename - Filename to validate
 * @returns {boolean} True if valid logo format
 */
export const isValidLogoFormat = (filename) => {
  const validExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return validExtensions.includes(ext);
};

/**
 * Gets all available logos grouped by type
 * @param {Array} availableLogos - Array of available logos
 * @returns {Object} Logos grouped by type
 */
export const groupLogosByType = (availableLogos) => {
  const grouped = {
    full: [],
    icon: [],
    main: []
  };

  availableLogos.forEach(logo => {
    if (logo.type === 'full') grouped.full.push(logo);
    else if (logo.type === 'icon') grouped.icon.push(logo);
    else grouped.main.push(logo);
  });

  return grouped;
};
