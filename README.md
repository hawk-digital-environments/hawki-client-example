# HAWKI Client Example

Welcome to the `hawki-client-example`! 👋

This project is a simple yet functional chat application designed to demonstrate how to integrate a web app with the **HAWKI** real-time communication service. It serves as a practical, hands-on guide for developers looking to build on the HAWKI platform.

It features a basic PHP backend for handling authentication and a vanilla JavaScript frontend that acts as a Single Page Application (SPA). The frontend leverages the [`@hawk-hhg/hawki-client`](https://github.com/hawk-digital-environments/hawki-client) library to manage all data and communication, showcasing a powerful *reactive state model* that automatically updates the UI when data changes.

## ✨ Features

*   🚀 Demonstrates the core functionality of the `@hawk-hhg/hawki-client` library.
*   🌐 Simple PHP backend for secure API configuration and user authentication.
*   💻 Lightweight, framework-less vanilla JavaScript Single Page Application (SPA).
*   ✨ Reactive state model for seamless, automatic UI updates.
*   💬 Real-time chat functionality powered by HAWKI.
*   🐳 Pre-configured Docker environment managed by a simple `bin/env` helper script for a consistent and easy setup.

## 🚀 Getting Started

This guide will walk you through setting up and running the project on your local machine.

### Prerequisites

Before you begin, ensure you have the following tools installed:
*   **Git**
*   **Docker and Docker Compose**
*   **A running HAWKI instance**: This example needs a HAWKI backend to connect to.
*   **An SSH key configured with your GitHub account**

### Step 1: Clone the Repository

Open your terminal, clone the repository, and navigate into the project directory.

```bash
git clone git@github.com:hawk-digital-environments/hawki-client-example.git
cd hawki-client-example
```

### Step 2: Configure Your Environment

First, create a local environment file by copying the provided template. This file will hold your secret keys and connection URLs.

```bash
cp .env.tpl .env
```

You will populate this `.env` file in the next step.

### Step 3: Create an External App in HAWKI

For this example to communicate with HAWKI, you must register it as an "external app" within your HAWKI instance.

1.  **Enable External Apps in HAWKI**: In your HAWKI instance's environment configuration (e.g., its `.env` file), ensure the following variables are set to `true`. You may need to restart your HAWKI services for this to take effect.
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

3.  **Answer the Prompts**: The command-line tool will ask for some information. Use the following:
    *   **Name**: `HAWKI Client Example`
    *   **URL of external app**: `http://localhost` (or the URL where you will run this example)
    *   **Redirect URL**: `http://localhost` (same as above)

    > **Note**: These URLs are used for browser redirects during the authentication flow. They only need to be accessible from the user's browser, not from the HAWKI server itself.

4.  **Save Your Keys**: The tool will output an **API Token** and a **Private Key**.

    > **🚨 IMPORTANT**: This is the **only time** you will see these keys! Copy them immediately and store them securely.

5.  **Update Your `.env` file**: Paste the token and key into your `hawki-client-example` project's `.env` file:
    ```env
    HAWKI_API_TOKEN=<The API Token generated in step 4>
    HAWKI_PRIVATE_KEY=<The Private Key generated in step 4>
    ```
6. **Ensure HAWKI Queue is Running**: The `hawki-client` requires a running WebSocket connection (Reverb), which depends on the queue worker. Make sure the queue worker is active in your HAWKI instance.
    ```bash
    # If using the provided HAWKI docker-compose environment
    bin/env dev

    # Or, run the queue worker directly
    php artisan queue:work
    ```

### Step 4: Configure the Connection to HAWKI

Next, you need to tell the example app how to reach your HAWKI instance by setting the `HAWKI_URL` in the `.env` file.

<details>
<summary><strong>Option A: Connecting to the official HAWKI Docker setup (Recommended)</strong></summary>

If you have cloned the [main HAWKI repository](https://github.com/hawk-digital-environments/HAWKI) and are running it via Docker Compose, you can link it with this example project.

1.  In your local HAWKI project, create a `docker-compose.override.yml` file with the following content. This allows the two separate Docker Compose projects to communicate over a shared network.
    ```yaml
    services:
      nginx:
        container_name: nginx.hawki.dev
        networks:
          - default
          - example
    networks:
      example:
        name: hawki-client-example-network
        external: true
    ```
2.  Restart your HAWKI services (`docker-compose up -d --force-recreate`).
3.  In this example project's `.env` file, ensure the `HAWKI_URL` is set correctly. The template defaults to `https://nginx.hawki.dev`, which is correct for this setup if you used the HAWKI installer. If not, you may need to use `http://nginx.hawki.dev`.

</details>

<details>
<summary><strong>Option B: Connecting to HAWKI running on your local machine</strong></summary>

If you are running a local HAWKI instance directly on your host machine (e.g., at `http://localhost`), the Docker container for this example needs a special address to reach it.

1.  In this project's `.env` file, set the `HAWKI_URL` as follows:
    ```env
    HAWKI_URL=http://host.docker.internal
    ```
    This special DNS name inside Docker resolves to your host machine's IP address.

</details>

### Step 5: Start the Application

This project uses a handy `bin/env` script to simplify Docker management.

1.  **(Optional, but Recommended) One-Time Install**: The `bin/env` tool has an optional `install` command that configures a local domain (`hawki-client-example.dev.local`) and generates trusted SSL certificates. This allows you to access the app via HTTPS.
    ```bash
    # This may prompt for your administrator (sudo) password
    ./bin/env install
    ```
    You can use the project without this step, but it provides a smoother development experience.

2.  **Start the Services**: Use the `up` command to build the Docker images and start the containers.
    ```bash
    bin/env up
    ```
    This will start PHP and Nginx containers in the background and install Composer dependencies.

### Step 6: Access the Application

The application is now running!

*   If you ran `bin/env install`, simply use the `open` command:
    ```bash
    bin/env open
    ```
*   If you skipped the `install` step, access the application at **[http://localhost](http://localhost)**.

You should see a login screen. Use any of the mock user credentials to log in and start exploring the chat!

## ⚙️ Daily Development Workflow

The `bin/env` helper is your primary tool for managing the project. Here are the most common commands:

<details>
<summary><strong>Click to see common <code>bin/env</code> commands</strong></summary>

| Command                   | Description                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `bin/env up`              | Starts the Docker containers in the background.                                                               |
| `bin/env down`            | Stops and removes the running Docker containers.                                                              |
| `bin/env logs`            | Shows the logs for all services. Use `bin/env logs -f` to follow in real-time.                             |
| `bin/env ssh`             | Opens a `bash` shell inside the main PHP service container.                                                   |
| `bin/env composer ...`    | Runs a Composer command (e.g., `install`, `update`) inside the appropriate container.                         |
| `bin/env open`            | Opens the project's URL in your browser (only if `bin/env install` was used).                                 |
| `bin/env clean`           | **Destructive!** Stops and removes all containers, networks, volumes, and images associated with the project. |

</details>

## 📚 Full Tutorial

For a more in-depth guide and explanation of the concepts used in this project, check out the full documentation:

*   **[Getting Started Guide](./docs/getting-started-929492837.md)**
*   **[Using the `bin/env` Helper](./docs/bin-env-your-local-dev-helper-862670637.md)**
