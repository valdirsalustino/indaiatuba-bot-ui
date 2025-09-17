# Indaiatuba Bot - Admin UI

This project is the React frontend for the administrator dashboard, designed to monitor conversations and handle human handoff requests from the WhatsApp bot.

---

## Getting Started

### Prerequisites

* Node.js (v18 or later recommended)
* npm or yarn

### Installation

1.  **Navigate to the project directory:**
    Make sure your terminal is in the `admin_ui` directory where your `package.json` file is located.

    ```bash
    cd path/to/your/admin_ui
    ```

2.  **Install dependencies:**
    This command reads the `package.json` file and downloads all the necessary libraries for the project to run.

    ```bash
    npm install
    ```

### Running the Development Server

1.  **Start the FastAPI backend:**
    Before starting the UI, ensure your Python `admin_backend` server is running. It typically runs on `http://localhost:8000`.

2.  **Start the React development server:**
    This command will start the frontend application.

    ```bash
    npm run dev
    ```

Open your browser and navigate to the local URL provided by Vite, which is usually `http://localhost:5173`.

---

## Login Credentials

As configured in the backend's `auth.py` file, the default credentials to access the admin panel are:

* **Username:** `admin`
* **Password:** `admin_password`

---

## Project Structure

* `src/main.jsx`: The main entry point of the application.
* `src/App.jsx`: The root component that manages state, authentication, and API calls.
* `src/components/`: Contains the reusable UI components.
    * `Login.jsx`: The login form.
    * `ConversationList.jsx`: The left panel displaying all conversations.
    * `ChatWindow.jsx`: The main chat interface for a selected conversation.
* `src/index.css`: Global styles and Tailwind CSS directives.
* `tailwind.config.js`: Configuration file for Tailwind CSS.

---

## API Configuration

* **API Base URL:** `http://localhost:8000`
* **WebSocket URL:** `ws://localhost:8000/ws`

---

## Scripts

* `npm run dev`: Starts the development server.
* `npm run build`: Builds the application for production.
* `npm run lint`: Lints the code to check for errors.
* `npm run preview`: Previews the production build.

---

## Dependencies

### Main Dependencies

* `react`: ^18.2.0
* `react-dom`: ^18.2.0

### Development Dependencies

* `@types/react`: ^18.2.15
* `@types/react-dom`: ^18.2.7
* `@vitejs/plugin-react`: ^4.0.3
* `autoprefixer`: ^10.4.16
* `eslint`: ^8.45.0
* `eslint-plugin-react`: ^7.32.2
* `eslint-plugin-react-hooks`: ^4.6.0
* `eslint-plugin-react-refresh`: ^0.4.3
* `postcss`: ^8.4.31
* `tailwindcss`: ^3.3.3
* `vite`: ^7.1.4