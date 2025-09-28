# Angular Kanban Board

A modern, responsive Kanban board application built with the latest Angular features.

## Description

This project is a feature-rich Kanban board that demonstrates a modern frontend architecture using Angular. It includes functionalities like drag-and-drop for tasks, detailed card views with real-time comment simulation, and robust filtering options. The application is designed to be fully responsive, providing a seamless experience on desktop, tablet, and mobile devices.

It is built with:
- Angular v20 (zoneless, standalone components, signals)
- TypeScript
- Tailwind CSS for styling
- RxJS for reactive programming

## Features

- **Responsive Design**: Adapts to any screen size from mobile to desktop.
- **Drag & Drop**: Intuitively move cards between columns.
- **Card Details Modal**: Click on a card to view and edit its details, including title, description, assignees, labels, and due date.
- **Real-time Comments**: A simulated real-time comment stream on each card.
- **Filtering**: Filter the board by multiple assignees and labels.
- **Modern Stack**: Built with standalone components, signals for state management, and zoneless change detection for optimal performance.

## Setup and How to Run

This project uses an `importmap` in `index.html` to handle dependencies, so there's no need to run `npm install` to fetch application dependencies. However, a development server is required to run the project.

### Using npm and a local server

A `package.json` file is included with a simple development server.

1.  **Install dev dependencies:**
    This will install `http-server`, a lightweight local server.
    ```bash
    npm install
    ```

2.  **Run the application:**
    This command starts the local server. The `-c-1` flag disables caching, which is useful for development.
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:8080`.

3.  **Mock API:**
    The mock API is part of the frontend application, located in `src/services/kanban.service.ts`. There is no separate API server to run. The `npm run api` script is included for completeness and will simply print a confirmation message.
    ```bash
    npm run api
    ```

### Alternative: Running without npm

If you prefer not to use npm, you can run the project with any simple static file server.

1.  Navigate to the project's root directory.
2.  Start a local server. For example, if you have Python installed:
    ```bash
    # For Python 3
    python -m http.server
    ```
    Or using the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in Visual Studio Code.
