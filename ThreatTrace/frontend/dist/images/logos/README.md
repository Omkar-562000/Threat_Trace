# Logo Integration Guide

This folder contains logos that are automatically integrated into the ThreatTrace application.

## How It Works

The Logo component (`src/components/ui/Logo.jsx`) automatically scans this folder and displays the best available logo based on naming conventions.

## Supported File Formats

- PNG (.png)
- JPEG (.jpg, .jpeg)
- SVG (.svg)
- WebP (.webp)

## Naming Conventions

The system looks for logos in this priority order:

### For Full Logo (with text):
1. `logo-full.png`
2. `logo-full.jpg`
3. `logo-full.svg`
4. `logo.png`
5. `logo.jpg`
6. `logo.svg`

### For Icon Logo (icon only):
1. `logo-icon.png`
2. `logo-icon.jpg`
3. `logo-icon.svg`
4. `icon.png`
5. `icon.jpg`
6. `icon.svg`
7. `logo.png` (fallback)

## Usage

Simply drop your logo files into this folder with the appropriate names. The application will automatically detect and display them within 5 seconds.

### Examples:

```
logos/
├── logo-full.png      # Full logo with text
├── logo-icon.png      # Icon-only version
├── logo.png          # Generic logo (used as fallback)
└── README.md         # This file
```

## Component Usage

```jsx
import Logo from '../components/ui/Logo';

// Full logo
<Logo variant="full" size="md" />

// Icon only
<Logo variant="icon" size="sm" />

// Disable auto-refresh
<Logo variant="full" autoRefresh={false} />
```

## Features

- **Auto-detection**: Logos are detected automatically when added
- **Real-time updates**: Changes are reflected within 5 seconds
- **Fallback system**: Shows "ThreatTrace" text logo if no images available
- **Multiple variants**: Support for full logos and icons
- **Responsive sizing**: sm, md, lg, xl sizes available
- **Error handling**: Graceful fallback if images fail to load

## Tips

1. Use PNG for best compatibility
2. Ensure logos have transparent backgrounds for best results
3. Full logos should be wider, icon logos should be square
4. Test different sizes to ensure they look good at all scales
5. SVG logos scale perfectly at any size
