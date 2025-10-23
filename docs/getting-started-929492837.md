# Getting Started

Welcome to `hawki-client-example`! This guide will walk you through setting up and running a simple, functional chat application that demonstrates how to integrate a web app with the **HAWKI** real-time communication service.

## Overview

This project is a chat application built to showcase the features of the `@hawk-hhg/hawki-client` library. It consists of two main parts:

*   **A PHP Backend**: A simple backend that handles user authentication and securely provides the necessary configuration for the frontend to connect to HAWKI.
*   **A Vanilla JavaScript Frontend**: A Single Page Application (SPA) built without a major framework. It uses the `hawki-client` library to manage all communication and data.

The frontend is built on a **reactive state model**, which means the UI automatically updates whenever data changes on the server. You'll see how fetching data, sending messages, and seeing real-time updates can be achieved with surprisingly little code.

### Project Structure

The project is organized into two primary directories:

*   `backend/`: Contains the PHP backend application logic, including a simple custom router and API handlers.
*   `public/`: Contains the entire frontend application, including `index.html`, JavaScript files, and other static assets.

## Prerequisites

Before you begin, ensure you have the following tools installed on your system:

*   **Git**: For cloning the repository.
*   **Docker and Docker Compose**: For running the containerized development environment.
*   **A running HAWKI instance**: This example application needs a HAWKI backend to connect to.
*   **An SSH key configured with your GitHub account**: The repository is cloned via SSH.

## Cloning the Repository

To get started, clone the project repository from GitHub to your local machine. Open your terminal and run the following command:

```bash
git clone git@github.com:hawk-digital-environments/hawki-client-example.git
cd hawki-client-example
```

## Installation and Setup

This project uses a handy command-line helper, `bin/env`, to manage the entire development environment. It wraps Docker commands, ensuring a consistent setup for everyone.

### Step 1: Configure Your Environment

First, you need to create a local environment file by copying the provided template.

```bash
cp .env.tpl .env
```

Now, open the newly created `.env` file and review the variables. The most important ones to configure are related to your HAWKI instance.

*   `HAWKI_URL`: The URL of your HAWKI instance.
    *   **Tip**: If you are running a local HAWKI Docker setup, the `hawki-client-example` container needs to access it. Set this value to `https://nginx.hawki.dev` if you are using the default HAWKI docker-compose setup with the provided override, or `http://host.docker.internal` if HAWKI is running on your host machine's port 80.
*   `HAWKI_API_TOKEN` & `HAWKI_PRIVATE_KEY`: These are secret credentials for your application. You will generate them in the next step.

### Step 2: Create an External App in HAWKI

For this example app to connect to HAWKI, you must register it as an "external app" within your HAWKI instance.

1.  **Enable External Apps in HAWKI**: Ensure the following environment variables are set to `true` in your HAWKI instance's configuration. You may need to restart your HAWKI services for this to take effect.
    ```
    ALLOW_EXTERNAL_COMMUNICATION=true
    ALLOW_EXTERNAL_APPS=true
    ```

2.  **Run the Creation Command**: In your HAWKI project's terminal, run the command to create a new external app.
    ```bash
    # If using the provided HAWKI docker-compose environment
    bin/env artisan ext-app:create
    
    # Or, if running PHP natively
    php artisan ext-app:create
    ```

3.  **Answer the Prompts**: The command-line tool will ask you a few questions:
    *   **Name**: `HAWKI Client Example`
    *   **URL of external app**: `http://localhost` (or the URL where you will run this example).
    *   **Redirect URL**: `http://localhost` (same as above).

4.  **Save Your Keys**: The tool will output an **API Token** and a **Private Key**. **This is the only time you will see these keys!** Copy them immediately.

5.  **Update Your `.env` file**: Paste the token and key into your `hawki-client-example` project's `.env` file:
    ```env
    HAWKI_API_TOKEN=<The API Token generated in step 4>
    HAWKI_PRIVATE_KEY=<The Private Key generated in step 4>
    ```

> **Important**: The `hawki-client` requires a running WebSocket connection (`reverb`), which in turn needs a queue worker to be active in your HAWKI instance. Ensure the queue worker is running: `bin/env dev` or `php artisan queue:work`.

### Step 3: Start the Application

With your configuration in place, you can now start the application.

1.  **(Optional, but Recommended) One-Time Install**: The `bin/env` tool has an optional `install` command that performs a one-time setup on your machine. It configures a local domain (e.g., `hawki-client-example.dev.local`) and generates a trusted SSL certificate, allowing you to access the app via HTTPS.

    ```bash
    # This may prompt for your administrator (sudo) password
    bin/env install
    ```
    You do **not** need to run this command to use the application, but it automates a more advanced and convenient setup.

2.  **Start the Services**: Use the `up` command to build the Docker images and start the containers.

    ```bash
    bin/env up
    ```
    This will start the PHP and Nginx containers in the background. The first time you run this, it will also install Composer dependencies for the backend.

### Step 4: Access the Application

The application is now running!

*   If you ran `bin/env install`, simply use the `open` command to launch the project in your default browser at its HTTPS URL:
    ```bash
    bin/env open
    ```
*   If you skipped the `install` step, you can access the application at `http://localhost`.

You should see a login screen. Use any of the mock user credentials to log in and start exploring the chat!

## Daily Development Workflow

The `bin/env` helper is your primary tool for managing the project. Here are the most common commands you'll use:

| Command                   | Description                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `bin/env up`              | Starts the Docker containers in the background.                                                                 |
| `bin/env down`            | Stops and removes the running Docker containers.                                                                |
| `bin/env logs`            | Shows the logs for all services. Use `bin/env logs -f` to follow the logs in real-time.                           |
| `bin/env ssh`             | Opens a `bash` shell inside the main PHP service container.                                                     |
| `bin/env composer ...`    | Runs a Composer command (e.g., `install`, `update`) inside the PHP container.                                   |
| `bin/env open`            | Opens the project's URL in your browser (only available after `bin/env install`).                               |
| `bin/env clean`           | **Destructive!** Stops and removes all containers, networks, volumes, and images associated with the project.   |

A typical workflow for a development session looks like this:

```bash
# Start your day
bin/env up

# Work on your code, check logs if needed
bin/env logs -f

# Need to run a command in the container?
bin/env ssh

# Done for the day
bin/env down
```

## Unleashing the Power of `bin/env`

With these essential commands at your fingertips, you're ready to streamline your development process effortlessly. But `bin/env` is packed with even more features to enhance your workflow— from advanced container management to seamless environment setup. In the next chapter, we'll explore the full capabilities of this local dev helper in detail.

[bin/env - Your local dev helper](bin-env-your-local-dev-helper-862670637.md)


