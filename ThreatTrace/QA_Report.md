### ThreatTrace - QA & Test Plan

**1. Executive Summary**

This document outlines the quality assurance and testing strategy for the ThreatTrace application. The analysis was conducted across both the backend (Flask) and frontend (React) codebases. The backend provides a REST API for security monitoring features, while the frontend provides the user interface to interact with these features.

The analysis revealed a solid foundation on the backend, with several key features implemented. However, it also uncovered several critical bugs, particularly in the frontend's communication with the backend, which render the application non-functional in its current state. The backend also has some non-critical bugs and placeholder endpoints.

The primary goal of this test plan is to first address the critical bugs to bring the application to a testable state, and then to provide a framework for comprehensive testing of all features.

**2. Scope**

*   **In Scope:**
    *   Backend API (Flask)
    *   Frontend UI (React)
    *   Functionality: Authentication, Ransomware Scanning, File Integrity Auditing, System Log Monitoring, Real-time Alerts, Reporting.
    *   Bug fixes identified during the analysis phase.
*   **Out of Scope:**
    *   Performance, load, and stress testing (can be considered in a future phase).
    *   Usability and UX testing (can be considered in a future phase).
    *   Infrastructure and deployment testing.

**3. Key Findings & Bug Report**

This section summarizes the bugs found during the initial analysis. These must be addressed before comprehensive testing can begin.

**3.1. Critical Bugs (Blocking)**

*   **[B-01] Frontend: Missing Authentication Headers:** No API requests from the frontend include the JWT `Authorization` header. As all data-related backend endpoints are protected, the entire application is non-functional.
*   **[B-02] Frontend: Hardcoded IP & Incorrect API Endpoints:** The service files (`auditService.js`, `systemLogsService.js`) contain hardcoded IP addresses and point to numerous incorrect backend API endpoints.

**3.2. Major Bugs**

*   **[B-03] Backend: Alerting System Not Initialized:** The `alert_manager` was not initialized in `app.py`, preventing any real-time alerts from being sent. (**Status: FIXED**)
*   **[B-04] Backend: Scheduler Blueprint Not Registered:** The blueprint in `scheduler_routes.py` was misnamed, preventing the scheduler API endpoints from being registered. (**Status: FIXED**)
*   **[B-05] Frontend: Non-existent API routes called:** Frontend services call backend routes that do not exist (e.g. `/api/audit/verify-path`, `/api/logs/levels`).
*   **[B-06] Backend: Broken Export Endpoints:** The `/api/audit/export/*` endpoints in `audit_routes.py` are broken.

**3.3. Minor Bugs & Code Quality Issues**

*   **[B-07] Misleading Dependency:** `scikit-learn` is listed as a dependency but is not used.
*   **[B-08] Placeholder Routes:** Several backend routes are placeholders (`logs`, `reports`, `alerts`).
*   **[B-09] Frontend: Lack of Centralized API Services:** API calls for features like auth and ransomware are likely made directly in components instead of dedicated service files.
*   **[B-10] Frontend: No Token Validation:** The `ProtectedRoute` component only checks for the presence of a token, not its validity.

**3.4. Audit Module E2E Test & Fixes**

An end-to-end test and audit of the Audit module was conducted. The following functionalities were reviewed:
*   `verify-by-path`
*   `upload-and-verify`
*   `scheduler start/stop/run-now`
*   `export CSV/PDF`
*   `load audit history`

The audit found that the module is generally well-designed and robust. However, several issues were identified and subsequently fixed:

*   **[A-01] `upload-and-verify`: File Validation Vulnerability:** The endpoint lacked validation for file size and type, posing a security risk (DoS, arbitrary file upload).
    *   **Fix:** Implemented a file size limit of 50MB and restricted allowed file extensions to `.log` and `.txt`.
*   **[A-02] `upload-and-verify`: Filename Sanitization:** The endpoint did not sanitize filenames.
    *   **Fix:** Added filename sanitization using `werkzeug.utils.secure_filename`.
*   **[A-03] `upload-and-verify`: Minor Race Condition:** A minor race condition was found in the `finally` block.
    *   **Fix:** The race condition was fixed by initializing the `save_path` variable.
*   **[A-04] `load audit history`: Inefficient and Misleading Endpoint:** The `/audit/history` endpoint was inefficient and misnamed.
    *   **Fix:** The endpoint was renamed to `/audit/files` and updated to be paginated, improving performance and clarity.

**4. Pre-Testing Phase: Bug Fixes**

Before starting the testing cycles, the following bugs must be fixed in order.

1.  **Fix Frontend API Services:**
    *   Create a centralized way to make API calls (e.g., using an `axios` instance).
    *   Implement an `axios` interceptor to automatically add the `Authorization` header with the token from `localStorage` to all requests.
    *   Replace the hardcoded IP addresses with relative URLs or environment variables.
    *   Correct all API endpoint URLs in the service files to match the backend routes.
2.  **Fix Backend Export Endpoints (B-06):** The `/export/` endpoints in `audit_routes.py` should be removed or corrected to work as intended.
3.  **Address Minor Bugs:** The minor bugs and code quality issues should be addressed to improve maintainability.

**5. Testing Strategy**

The testing will be performed in multiple stages.

**5.1. Unit Testing**

*   **Backend:**
    *   Write `pytest` tests for utility functions (e.g., `calculate_file_hash`, `calculate_entropy`).
    *   Write tests for individual API endpoints to verify their logic, authentication, and error handling. Mock the database and other external services where necessary.
*   **Frontend:**
    *   Write `jest`/`@testing-library/react` tests for individual React components to verify they render correctly based on props.
    *   Test utility functions.

**5.2. Integration Testing**

*   **Backend:**
    *   Test the interaction between different parts of the backend. For example, when a tampered file is detected in the audit module, verify that an alert is correctly sent via the `alert_manager`.
    *   Test the full authentication flow, from registration to token-protected endpoints.
*   **Frontend:**
    *   Test the integration between components. For example, when a file is uploaded in the `Ransomware` page, verify that the results are correctly displayed.
    *   Mock the API responses to test how the frontend handles different scenarios (success, error, loading).

**5.3. End-to-End (E2E) Testing**

This will be a manual testing process for the first phase. The goal is to simulate real user scenarios.

*   **Test Cases:**
    *   **Authentication:**
        1.  User can successfully sign up.
        2.  User can successfully log in and is redirected to the dashboard.
        3.  User is redirected to the login page when trying to access a protected route without being logged in.
        4.  User can successfully log out.
        5.  User can reset their password.
    *   **Ransomware Scanner:**
        1.  User can upload a clean file and see a "not suspicious" result.
        2.  User can upload a suspicious file (e.g., a file with a high entropy value or a known ransomware extension) and see a "suspicious" result and a real-time alert.
    *   **File Integrity Audit:**
        1.  User can specify a file path to monitor.
        2.  User can see that a new file is registered.
        3.  User can see that a modified file is detected as "tampered" and a real-time alert is generated.
        4.  User can view the history of a monitored file.
        5.  User can download a CSV/PDF report.
    *   **System Logs:**
        1.  User can view the stream of system logs.
        2.  User can filter logs by level and search by a keyword.
        3.  User can export logs to CSV/PDF.
    *   **Real-time Alerts:**
        1.  Verify that real-time alerts appear as toast notifications or in the alerts page when a threat is detected.

**6. Test Environment**

*   **Backend:** Python 3.x, Flask, MongoDB.
*   **Frontend:** Node.js, React, modern web browser (Chrome, Firefox).
*   **Tools:** `pytest` for backend unit tests, `jest` and `@testing-library/react` for frontend unit tests.

**7. Conclusion**

The ThreatTrace application has a good set of features, but it is currently in a non-testable state due to critical bugs in the frontend's communication layer. By following the proposed plan of fixing these bugs first and then executing the comprehensive testing strategy, we can ensure the quality and reliability of the application.
