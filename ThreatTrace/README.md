# ThreatTrace - Project Skeleton

Cycle 1: Repo scaffold for ThreatTrace project.
This folder contains a minimal backend Flask app and frontend scaffold.

## Backend
- Run:
    python -m venv venv
    source venv/bin/activate
    pip install -r backend/requirements.txt
    cd backend
    python app.py

## Frontend
- Navigate to frontend directory and follow Vite setup instructions (Cycle 1 includes basic files).

## Frontend Component Analysis Report

### Summary
A scan of the React components was performed to identify and fix issues related to broken imports, missing dependencies, re-render bottlenecks, layout conflicts, and responsiveness.

### Changes Made

*   **`src/pages/Audit.jsx`**:
    *   To improve performance and prevent re-render bottlenecks, all event handler functions were wrapped in the `useCallback` hook.
    *   Inline styles were moved to a separate CSS file (`src/pages/Audit.css`) to improve performance and code organization.
*   **`src/layouts/DashboardLayout.jsx`**:
    *   A layout issue was fixed where a large gap was visible when the sidebar is collapsed. The state of the sidebar was lifted to the `DashboardLayout`, and the margin of the main content is now dynamic based on the sidebar's state.
*   **`src/components/ui/Sidebar.jsx`**:
    *   The component was refactored to be a controlled component, which means its state is now managed by its parent component (`DashboardLayout`).

*   **`src/pages/SystemLogs.jsx`**:
    *   To handle high-frequency log updates, a buffering mechanism was implemented to batch state updates and reduce re-renders.
    *   The `useCallback` hook was used to memoize functions, preventing unnecessary re-creations and improving performance.
    *   The `useEffect` dependency arrays were updated to ensure effects are only re-run when necessary.
