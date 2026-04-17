# Automated Power Factor Monitoring and Correction: Web Portal Documentation

## Introduction

### Project Overview
The 'Automated Power Factor Monitoring and Correction' project is a comprehensive system designed to improve electrical efficiency. It combines hardware sensors (PZEM module), a microcontroller (ESP32), and a sophisticated web application to provide real-time monitoring, analysis, and control of power factor in an electrical system. By automatically managing inductive and capacitive loads, the system aims to reduce electricity costs, decrease power losses, and enhance the stability of the power grid.

### The Web Application's Role
The web application serves as the central hub for interacting with and managing the entire system. It provides a user-friendly interface for stakeholders to:
*   **Visualize Data:** Monitor key electrical parameters like voltage, current, power, and, most importantly, power factor in real-time.
*   **Control Loads:** Manually or automatically switch capacitor banks or other loads to correct a lagging power factor.
*   **Receive Insights:** Leverage AI-driven analysis to understand power consumption patterns and receive predictive alerts about potential issues.
*   **Manage System:** Configure settings, manage user access, and export historical data for reporting and further analysis.

---

## System Architecture

### High-Level Overview
The system is composed of three main parts:
1.  **Hardware:** An ESP32 microcontroller is connected to a PZEM-004T power and energy monitoring module. This unit is responsible for capturing raw electrical data from the power lines.
2.  **Backend Server:** A Node.js application that acts as the brain of the system. It ingests data from the ESP32, stores it in a MongoDB database, runs AI analysis, manages control logic, and exposes a REST API for the frontend.
3.  **Frontend Client:** A React-based single-page application (SPA) that provides the user interface. It communicates with the backend server to display data and send control commands.

### Architectural Diagram
```
  [Electrical System]---->[PZEM Module]---->[ESP32 Microcontroller]
        |                                          | (Wi-Fi)
        |                                          v
        +---------------------------------->[Backend Server (Node.js/Express)]
                                                   ^           |
                                                   | (REST API)| (WebSockets)
                                                   v           v
                                             [Frontend Client (React)]---->[User]
                                                   |
                                                   v
                                             [MongoDB Database]
```

### Data Flow
1.  The PZEM module continuously measures electrical parameters.
2.  The ESP32 reads this data and sends it to the backend server over Wi-Fi at regular intervals.
3.  The backend server receives the data, authenticates the source, and stores it in the `EnergyData` collection in the MongoDB database.
4.  The server pushes the new data in real-time to all connected frontend clients using WebSockets.
5.  The frontend React application receives the data and updates the charts and displays on the dashboard.
6.  When a user issues a control command (e.g., 'Turn on Capacitor Bank 1'), the frontend sends a request to the backend's control API.
7.  The backend validates the request and sends the command to the appropriate ESP32, which then actuates a relay or switch.

---

## Technology Stack

### Hardware
*   **Microcontroller:** ESP32 (for its built-in Wi-Fi and processing power).
*   **Sensor:** PZEM-004T Power and Energy Monitor (or a similar module).

### Backend Technologies
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB with Mongoose ODM
*   **Real-time Communication:** Socket.IO
*   **Authentication:** JSON Web Tokens (JWT)
*   **Scheduled Jobs:** `node-cron`
*   **Push Notifications:** `web-push`
*   **Other:** `cors`, `dotenv`, `body-parser`, `csv-writer`

### Frontend Technologies
*   **Framework:** React.js
*   **Charting:** Chart.js
*   **Real-time Communication:** Socket.IO Client
*   **Build Tool:** Create React App (`react-scripts`)
*   **Styling:** Plain CSS (as suggested by `styles.css`)

---

## Backend Deep Dive

### Project Structure
The server's code is organized into a modular and maintainable structure:
*   `server.js`: The main entry point of the application.
*   `/config`: Database connection configuration (`db.js`).
*   `/controllers`: Logic for handling requests (e.g., `authController.js`, `dataController.js`).
*   `/models`: Mongoose schemas defining the data structures (e.g., `User.js`, `EnergyData.js`).
*   `/routes`: Express routes that map URLs to controller functions.
*   `/middleware`: Functions that run between the request and the controller (e.g., `auth.js` for JWT verification).
*   `/services`: Business logic that is not directly tied to HTTP requests (e.g., `aiService.js`, `scheduler.js`).
*   `/utils`: Utility functions.

### API Endpoints
The server exposes several RESTful API endpoints, defined in the `/routes` directory:
*   `authRoutes.js`: Handles user registration and login (`/api/auth/register`, `/api/auth/login`).
*   `dataRoutes.js`: Provides access to historical and current energy data.
*   `controlRoutes.js`: Manages load control commands.
*   `overrideRoutes.js`: Handles manual override of automated controls.
*   `aiRoutes.js`: Delivers insights from the AI service.
*   `exportRoutes.js`: Manages requests for data exporting.

### Database Schema
The `/models` directory contains the following Mongoose schemas:
*   `User.js`: Stores user credentials and roles.
*   `EnergyData.js`: Stores time-series data from the PZEM module (voltage, current, power factor, etc.).
*   `Alert.js`: Stores system-generated alerts.
*   `AIInsight.js`: Stores insights generated by the `aiService`.
*   `LoadControl.js`: Represents controllable loads (e.g., capacitor banks).

### Core Backend Services
*   `aiService.js`: This service likely analyzes historical `EnergyData` to identify patterns, predict future power factor drops, and generate actionable insights stored in the `AIInsight` collection.
*   `pushService.js`: Manages sending web push notifications to users who have subscribed, likely for critical alerts.
*   `scheduler.js`: Uses `node-cron` to run tasks at scheduled intervals, such as daily data aggregation (`DailyEnergy` model) or running the `aiService` analysis.

---

## Frontend Deep Dive

### Project Structure
The React client follows a standard Create React App structure:
*   `/public`: Contains the main `index.html` file and static assets.
*   `/src`: Contains all the React source code.
*   `/src/pages`: Top-level components representing different pages of the application (`Dashboard.js`, `Login.js`).
*   `/src/services`: Modules for interacting with backend services (`api.js` for REST, `socket.js` for WebSockets, `auth.js` for user authentication).
*   `/src/ui`: Reusable UI components used across the application (`LineChart.js`, `CardGrid.js`).
*   `App.js`: The root component that manages routing between pages.
*   `index.js`: The entry point for the React application.

### Core Components and Pages
*   `Login.js`: A page with a form for users to authenticate.
*   `Dashboard.js`: The main page after login. It likely hosts the `CardGrid` for displaying current stats and the `LineChart` for visualizing historical data.
*   `LineChart.js`: A reusable component that uses `Chart.js` to render time-series data.
*   `AlertBanner.js`: A component to display important system alerts.

### State Management and API Communication
The application likely uses React's built-in state management (e.g., `useState`, `useContext`) to handle application state. The `services/api.js` module probably uses a library like Axios (or the native `fetch` API) to make requests to the backend's REST API. The `proxy` setting in `package.json` ensures these requests are correctly routed to the backend server during development.

### Real-time Updates with WebSockets
The `services/socket.js` module establishes a connection to the Socket.IO server on the backend. The application listens for events (e.g., 'newData') from the server. When new data arrives, the state of the relevant components (like `LineChart.js` and `CardGrid.js`) is updated, causing the UI to re-render with the latest information without needing a page refresh.

---

## Hardware Integration

### Role of the Microcontroller
The ESP32 is the bridge between the physical electrical system and the digital web application. Its primary responsibilities are:
1.  Reading data from the PZEM sensor via a serial interface.
2.  Connecting to the local Wi-Fi network.
3.  Periodically sending the collected data to the backend server in a structured format (like JSON).
4.  Listening for control commands from the server to actuate relays or switches.

### ESP32 Code Overview (`esp32_code.cpp`)
The `esp32_code.cpp` file contains the C++/Arduino code for the ESP32. Key sections of the code would include:
*   Inclusion of Wi-Fi and HTTP client libraries.
*   Configuration for Wi-Fi credentials and the server's IP address/hostname.
*   A main loop that reads data from the PZEM module.
*   A function to format the data into a JSON payload.
*   A function that makes an HTTP POST request to the backend's data ingestion endpoint (e.g., `/api/data`).
*   Logic to handle incoming control commands, perhaps via a separate endpoint or a WebSocket connection.

### Hardware-Server Communication
The ESP32 communicates with the server primarily by making HTTP POST requests to a specific data endpoint. The body of the request contains the sensor readings. To ensure security, the ESP32 might include a secret API key in the request headers to be validated by the backend.

---

## User Guide: How the Website Works

### User Authentication
Users first visit the login page. After successful authentication via the `authController`, the server returns a JSON Web Token (JWT). This token is stored in the browser (e.g., in `localStorage`) and sent with all subsequent API requests to protected endpoints.

### Navigating the Dashboard
The dashboard is the central view. Here, users can see:
*   A grid of cards showing the most current values for Voltage, Current, Power Factor, etc.
*   A line chart showing the trend of these values over time. Users can likely change the time range (e.g., last hour, last 24 hours).
*   These components update in real-time as new data is pushed from the server.

### Controlling Loads
The dashboard will have a section for load control. This might be a list of switches. A user can click a switch to manually turn a capacitor bank on or off. This action sends a command to the `controlController` on the server, which then relays the instruction to the ESP32. An "override" switch likely exists to disable the automatic correction logic and put the system in manual-only mode.

### Understanding AI Insights and Alerts
The dashboard will display insights generated by the `aiService`, such as "High-consumption period detected between 2 PM and 4 PM" or "Power factor is predicted to drop at 8 PM." Alerts, managed by the `Alert.js` model, will show more urgent messages, like "Power factor critically low: 0.75".

---

## Setup and Deployment Guide

### Prerequisites
*   Node.js and npm
*   MongoDB database instance (local or cloud-hosted)
*   Git
*   Arduino IDE or PlatformIO for flashing the ESP32

### Backend Setup
1.  Navigate to the `server` directory.
2.  Create a `.env` file and populate it with the MongoDB connection string, JWT secret, and other necessary environment variables.
3.  Run `npm install` to install dependencies.
4.  Run `npm start` to start the server. For development, use `npm run dev` to use `nodemon`.

### Frontend Setup
1.  Navigate to the `client` directory.
2.  Run `npm install` to install dependencies.
3.  Run `npm start` to start the React development server. This will open the application in your default browser.

### Hardware Setup
1.  Open `esp32_code.cpp` in the Arduino IDE.
2.  Update the Wi-Fi SSID, password, and server IP address variables.
3.  Connect the ESP32 to your computer.
4.  Select the correct board and port in the IDE.
5.  Upload the code to the ESP32.

---

## In-Depth Feature Analysis

### Real-time Monitoring and Visualization
This is achieved through a combination of WebSockets and Chart.js. The backend pushes data, and the frontend client uses the `socket.io-client` library to listen for these pushes. On receiving new data, the React state is updated, which causes the `LineChart.js` component to re-render with the new data point, creating a smooth, live-updating graph.

### Automated Load Control and Manual Override
The automatic control logic likely resides in the backend. It constantly checks the incoming power factor data. If it falls below a configured threshold, the server automatically sends a command to the ESP32 to switch on a capacitor bank. The `overrideController` provides endpoints that allow a user to disable this automatic logic, giving them full manual control through the `controlController`.

### AI-Powered Insights and Predictive Alerts
The `aiService` is a powerful feature. It runs scheduled jobs to analyze the `EnergyData` collection. It might use statistical methods or simple machine learning models to:
*   Identify peak usage hours.
*   Correlate power factor drops with specific events or times.
*   Predict future drops based on historical patterns.
The results are stored as `AIInsight` documents and displayed to the user.

### Data Exporting
The `exportController` and the `csv-writer` library work together to provide this feature. A user can request a data export for a specific time range from the frontend. The backend queries the `EnergyData` collection, generates a CSV file on the fly, and sends it back to the user for download.

---

## Conclusion and Future Work

### Project Summary
The Automated Power Factor Monitoring and Correction system is a robust, full-stack IoT application. It successfully integrates hardware for data acquisition with a modern web stack for data visualization, control, and analysis. With features like real-time updates, AI-driven insights, and remote control, it provides a powerful tool for managing electrical efficiency.

### Potential Enhancements
*   **Mobile App:** Develop a native or hybrid mobile app for on-the-go monitoring and alerts.
*   **Advanced AI Models:** Implement more sophisticated machine learning models for more accurate prediction and anomaly detection.
*   **Multi-tenancy:** Allow multiple sites or locations to be managed from a single application instance.
*   **Customizable Reports:** Enhance the data export feature to allow users to generate custom PDF reports with charts and tables.
*   **Enhanced Security:** Implement two-factor authentication (2FA) and more granular user roles and permissions.
