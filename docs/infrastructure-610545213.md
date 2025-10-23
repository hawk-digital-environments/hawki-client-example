# Infrastructure

With the backend established as a secure intermediary [handling configuration requests from the HAWKI API and delivering them to the frontend](hawki-configuration-broker-2105373639.md), this chapter provides an overview of the local development infrastructure for the `hawki-client-example` project. The entire setup is containerized using Docker and Docker Compose to ensure a consistent and reproducible environment for all developers.

## Overview

The project's infrastructure is defined in the `docker-compose.yml` file and consists of two main services:

1.  **`example` (PHP Service):** A PHP-FPM container that runs the application's backend logic. It is built from a custom `Dockerfile` based on a PHP 8.4 image. It automatically installs Composer dependencies on startup.
2.  **`nginx` (Web Server):** An Nginx container that acts as a web server. It serves static assets and forwards dynamic requests to the `example` (PHP-FPM) service for processing.

These services run on a dedicated Docker network, allowing them to communicate with each other securely and efficiently.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)

## Initial Setup and Configuration

To get started, you need to configure the environment variables for the application.

1.  **Create the Environment File:**
    The project includes a template file `.env.tpl`. You must create a copy of this file and name it `.env`.

    ```bash
    cp .env.tpl .env
    ```

2.  **Configure Environment Variables:**
    Open the newly created `.env` file and fill in the required values. These variables are crucial for connecting the example client to your Hawki instance.

    *   `PROJECT_NAME`: A unique name for your Docker project. The default `hawki-client-example` is usually sufficient.
    *   `HAWKI_URL`: The full URL of your Hawki instance (e.g., `https://my-instance.hawki.dev`).
    *   `HAWKI_USES_SELF_SIGNED_CERTIFICATE`: Set to `true` if your Hawki instance uses a self-signed SSL certificate, otherwise set to `false`.
    *   `HAWKI_API_TOKEN`: Your application's API token from the Hawki dashboard.
    *   `HAWKI_PRIVATE_KEY`: Your application's private key from the Hawki dashboard.

    Your `.env` file should look something like this:

    ```ini
    PROJECT_NAME="hawki-client-example"
    HAWKI_URL="https://nginx.hawki.dev"
    HAWKI_USES_SELF_SIGNED_CERTIFICATE=true
    HAWKI_API_TOKEN="your-apps-api-token"
    HAWKI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-apps-private-key\n-----END PRIVATE KEY-----\n"
    ```

## Building and Running the Environment

Once your `.env` file is configured, you can build and start the Docker containers.

1.  **Start the Services:**
    Run the following command from the root of the project directory:

    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: This flag forces Docker Compose to build the custom PHP image defined in the `Dockerfile`.
    *   `-d`: This runs the containers in "detached" mode, meaning they will run in the background.

    On the first run, the `php.entrypoint.dev.sh` script will execute `composer install` inside the `example` container to download all PHP dependencies.

2.  **Accessing the Application:**
    The application will be available at `http://127.0.0.1`. The Nginx container is configured to listen on port `80` (and `443` for SSL) on your host machine.

3.  **Stopping the Services:**
    To stop all running containers, use the following command:

    ```bash
    docker-compose down
    ```

## Advanced Configuration

### Using SSL

The Nginx service can be configured to use SSL. This is controlled by the Nginx configuration file loaded in `docker-compose.yml`.

To enable SSL:
1.  Generate a self-signed certificate and key. You can use a tool like `mkcert` or OpenSSL. Place the generated files, named `cert.pem` and `key.pem`, into the `./docker/certs/` directory.
2.  Set the `DOCKER_PROJECT_SSL_MARKER` environment variable to `.ssl` when running Docker Compose.

   ```bash
   DOCKER_PROJECT_SSL_MARKER=.ssl docker-compose up --build -d
   ```
   This will instruct Nginx to load `nginx.dev.ssl.conf` instead of the default `nginx.dev.conf`, enabling SSL and redirecting HTTP traffic to HTTPS.

### Xdebug

Xdebug is pre-configured in the development PHP container to facilitate debugging. The configuration in `docker/php/config/php.dev.ini` sets `xdebug.client_host` to `host.docker.internal`, allowing your IDE's debugger (running on your host machine) to connect to Xdebug inside the container.

## Best Practices

*   **File Permissions:** The `Dockerfile` attempts to match the container's `www-data` user ID with your host user's ID (`DOCKER_UID` and `DOCKER_GID`). This prevents file permission errors in the mounted `./backend` directory. If you encounter issues, ensure these values are passed correctly during the build.
*   **Updating Base Images:** To ensure you have the latest security patches and features from the base Docker images (`neunerlei/php`, `nginx`), periodically rebuild your environment using the `--pull` flag.
    ```bash
    docker-compose build --pull
    ```
*   **Production vs. Development:** The provided setup is for **local development only**. The `Dockerfile` contains a `php_root` stage, and `nginx.default.conf` provides a more secure configuration, hinting at a production build process. These are not used by the default `docker-compose.yml` file.

## Troubleshooting

*   **`502 Bad Gateway` Error:** This typically means Nginx cannot communicate with the PHP-FPM service.
    *   Check if the `example` container is running: `docker-compose ps`.
    *   Inspect the logs for errors: `docker-compose logs example`.

*   **Permission Denied Errors:** If you see permission errors related to files in the `backend` directory, it's likely a user ID mismatch.
    *   Find your user and group ID on your host machine by running `id -u` and `id -g`.
    *   Pass these values when building the containers: `DOCKER_UID=$(id -u) DOCKER_GID=$(id -g) docker-compose build example`.
    *   Restart the services: `docker-compose up -d`.

*   **Container Fails to Start:** Check the logs of the failing container for specific error messages.
    ```bash
    # For the PHP container
    docker-compose logs example

    # For the Nginx container
    docker-compose logs nginx
    ```

*   **Connection issues with Hawki:**
    *   Double-check all values in your `.env` file, especially the `HAWKI_URL`, `HAWKI_API_TOKEN`, and `HAWKI_PRIVATE_KEY`.
    *   Ensure the `HAWKI_USES_SELF_SIGNED_CERTIFICATE` setting matches your Hawki instance's SSL configuration.
    *   Verify that your machine has network access to the `HAWKI_URL`.

