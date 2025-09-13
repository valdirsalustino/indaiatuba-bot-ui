Indaiatuba Bot - Admin UI
This project is the React frontend for the administrator dashboard, designed to monitor conversations and handle human handoff requests from the WhatsApp bot.

Getting Started
Prerequisites
Node.js (v18 or later recommended)

npm or yarn

Installation
Navigate to the project directory:
Make sure your terminal is in the admin_ui directory where your package.json file is located.

cd path/to/your/admin_ui

Install dependencies:
This command reads the package.json file and downloads all the necessary libraries for the project to run.

npm install

Running the Development Server
Start the FastAPI backend:
Before starting the UI, ensure your Python admin_backend server is running. It typically runs on http://localhost:8000.

Start the React development server:
This command will start the frontend application.

npm run dev

Open your browser and navigate to the local URL provided by Vite, which is usually http://localhost:5173.

Login Credentials
As configured in the backend's auth.py file, the default credentials to access the admin panel are:

Username: admin

Password: admin_password

Project Structure
src/main.jsx: The main entry point of the application.

src/App.jsx: The root component that manages state, authentication, and API calls.

src/components/: Contains the reusable UI components.

Login.jsx: The login form.

ConversationList.jsx: The left panel displaying all conversations.

ChatWindow.jsx: The main chat interface for a selected conversation.

src/index.css: Global styles and Tailwind CSS directives.

tailwind.config.js: Configuration file for Tailwind CSS.
