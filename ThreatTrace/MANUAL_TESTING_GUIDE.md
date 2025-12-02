# Manual Testing Guide for ThreatTrace

This guide provides step-by-step instructions on how to set up and manually test the ThreatTrace web application.

## 1. Prerequisites

Before you begin, ensure you have the following installed:

*   **Python 3.x:** For running the backend server.
*   **Node.js and npm:** For running the frontend development server.
*   **MongoDB:** As the application's database. Make sure the MongoDB server is running.

## 2. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd e:\ThreatTrace\ThreatTrace\backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**
    *   On Windows:
        ```bash
        venv\Scripts\activate
        ```
    *   On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```

4.  **Install the required Python packages:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Set up environment variables:**
    Create a file named `.env` in the `backend` directory with the following content. Make sure to replace the placeholder values with your actual configuration.
    ```
    FLASK_APP=app.py
    FLASK_ENV=development
    MONGO_URI=mongodb://localhost:27017/threat_trace
    JWT_SECRET_KEY=your_strong_secret_key_here
    MAIL_SERVER=smtp.example.com
    MAIL_PORT=587
    MAIL_USE_TLS=True
    MAIL_USERNAME=your_email@example.com
    MAIL_PASSWORD=your_email_password
    ```

6.  **Run the Flask application:**
    ```bash
    flask run
    ```
    The backend server should now be running on `http://127.0.0.1:5000`.

## 3. Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd e:\ThreatTrace\ThreatTrace\frontend
    ```

2.  **Install the required Node.js packages:**
    ```bash
    npm install
    ```

3.  **Configure the proxy:**
    Open the `vite.config.js` file and add the following `server` configuration to proxy API requests to the backend:
    ```javascript
    import react from '@vitejs/plugin-react';
    import { defineConfig } from 'vite';

    export default defineConfig({
      plugins: [react()],
      server: {
        host: "0.0.0.0",
        port: 5173,
        strictPort: true,
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:5000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
          },
        },
      },
    });
    ```

4.  **Run the React development server:**
    ```bash
    npm run dev
    ```
    The frontend application should now be running and will open in your default web browser, usually at `http://localhost:5173`.

## 4. Manual Test Cases

Follow these test cases to manually verify the application's functionality.

### 4.1. Authentication

1.  **Sign Up:**
    *   Navigate to the signup page.
    *   Fill in the registration form with a new username, email, and password.
    *   Click "Sign Up".
    *   **Expected:** You should be redirected to the login page.

2.  **Log In:**
    *   Navigate to the login page.
    *   Enter the credentials you just created.
    *   Click "Login".
    *   **Expected:** You should be redirected to the dashboard, and a "Logged in successfully" notification should appear.

3.  **Protected Routes:**
    *   Log out of the application.
    *   Try to directly access a protected route, for example, the dashboard (`/`).
    *   **Expected:** You should be redirected to the login page.

4.  **Log Out:**
    *   Log in to the application.
    *   Click the "Logout" button.
    *   **Expected:** You should be redirected to the login page.

### 4.2. Ransomware Scanner

1.  **Upload a Clean File:**
    *   Navigate to the "Ransomware" page from the sidebar.
    *   Click the "Upload" button and select a harmless file (e.g., a simple `.txt` file).
    *   **Expected:** The results should show that the file is "Not Suspicious".

2.  **Upload a Suspicious File:**
    *   This is harder to test without a real ransomware sample. You can try to create a file with a known ransomware extension (e.g., `.crypted`) or a file with high entropy (e.g., a zip file renamed to `.txt`).
    *   Upload the file.
    *   **Expected:** The results should show that the file is "Suspicious", and a real-time alert should appear as a toast notification.

### 4.3. File Integrity Audit

1.  **Monitor a New File:**
    *   Navigate to the "Audit" page.
    *   In the "Verify by Path" section, enter the absolute path to a new file that you have created (e.g., `C:\Users\YourUser\Documents\test.log`).
    *   Click "Verify".
    *   **Expected:** A report should appear with the status "new". The file should now be listed in the "Audit History" table.

2.  **Verify an Unchanged File:**
    *   Click "Verify" again for the same file path without modifying the file.
    *   **Expected:** The report should show the status "clean".

3.  **Verify a Tampered File:**
    *   Modify the content of the file you are monitoring.
    *   Click "Verify" again.
    *   **Expected:** The report should show the status "tampered", and a diff of the changes should be visible. A real-time alert should also appear.

4.  **Download Reports:**
    *   From the "Audit History" table, click on a file to view its detailed report.
    *   Click the "Download CSV" and "Download PDF" buttons.
    *   **Expected:** The corresponding report files should be downloaded.

### 4.4. System Logs

1.  **View Logs:**
    *   Navigate to the "System Logs" page.
    *   **Expected:** You should see a stream of system logs being displayed.

2.  **Filter and Search:**
    *   Use the filter and search inputs to narrow down the logs.
    *   **Expected:** The log view should update to show only the matching logs.

3.  **Export Logs:**
    *   Click the export buttons.
    *   **Expected:** A CSV or PDF file of the logs should be downloaded. (Note: This functionality might still be a placeholder).

### 4.5. Real-time Alerts

*   As you perform actions that trigger alerts (e.g., uploading a suspicious file, a tampered file is detected), you should see toast notifications appear in the corner of the screen.
*   You can also navigate to the "Alerts" page to see a history of all alerts.

This guide provides a starting point for testing. Feel free to explore the application and test other scenarios as well.