# bin/env - Your local dev helper

Having covered the installation and basics of using `hawki-client-example` in the [Getting Started](getting-started-929492837.md) chapter, let's build on that foundation by exploring the `bin/env` helper script designed to streamline your local development workflow. To make your development experience as smooth as possible, this project includes a powerful command-line helper script: `bin/env`. This chapter will guide you through its features, usage, and how you can extend it to fit your needs.

## Overview

`bin/env` is a self-contained helper program designed to streamline all aspects of your local development workflow. It's written in Node.js and TypeScript and acts as a single, consistent entry point for managing environment variables, running scripts, and controlling the project's Docker environment.

One of its key features is that it **manages its own Node.js installation**. The `bin/env` shell script will automatically download and use the specific Node.js version defined in the script, storing it in `~/.bin-env`. This means you don't need to worry about having the correct Node.js version installed on your system, avoiding any "works on my machine" issues.

### Key Features & Benefits

-   **Zero-Dependency Setup**: The script handles its own Node.js and `npm` dependencies automatically.
-   **Docker Abstraction**: Provides simple commands like `up`, `down`, and `logs` that abstract away the underlying `docker compose` calls.
-   **Integrated Tooling**: Run tools like `npm` and `composer` directly inside the appropriate Docker containers with commands like `bin/env npm install`.
-   **Automated Environment Setup**: An optional `install` command configures a custom local domain (e.g., `https://my-project.dev.local`), manages your system's `hosts` file, and generates a trusted SSL certificate.
-   **Consistency**: Ensures every developer on the project uses the same commands and environment setup, regardless of their host OS (macOS, Linux, or WSL on Windows).
-   **Extensibility**: The tool is built with an addon system, making it easy to add new project-specific commands.

## Getting Started: Basic Usage

All commands are run from the root of the project directory. The basic syntax is:

```bash
./bin/env <command> [options]
```

Here are some of the most common commands you'll use daily:

-   `bin/env up`: Starts the Docker containers for the project in detached mode.
-   `bin/env up -f`: Starts the containers and attaches to the logs, just like `docker compose up`.
-   `bin/env down`: Stops and removes the Docker containers, network, and volumes.
-   `bin/env restart`: A convenient shortcut to stop and start the containers.
-   `bin/env logs`: Shows the logs from the main application container. Use `bin/env logs --all` to see logs from all services.
-   `bin/env ssh`: Opens a `bash` or `sh` shell inside the main application container.
-   `bin/env open`: Opens your project's URL in your default browser.
-   `bin/env npm <args...>`: Executes an `npm` command inside the `node` service container.
    -   Example: `bin/env npm install lodash`
-   `bin/env composer <args...>`: Executes a `composer` command inside the PHP service container.
    -   Example: `bin/env composer require laravel/pint`

To see all available commands and their options, you can always run:

```bash
./bin/env --help
```

## The `install` Command

The `bin/env install` command is an **optional but highly recommended** one-time setup process. While `bin/env` and the project will function without it (typically accessible via `http://localhost`), running the `install` command provides a more robust and production-like development environment.

### What `install` Does

When you run `bin/env install`, the script performs several automated setup steps:

1.  **Dependency Check**: It checks if required host-system tools like `mkcert` are installed. If they are missing, it will offer to install them for you using `brew` (on macOS) or `scoop` (on Windows via WSL).
2.  **Unique IP Address**: It reserves a unique loopback IP address for the project (e.g., `127.0.1.1`). This prevents port conflicts when you are running multiple projects simultaneously.
3.  **Local Domain Registration**: It automatically adds an entry to your system's `hosts` file (e.g., `/etc/hosts` or `C:\Windows\System32\drivers\etc\hosts`) to map the new IP to a custom local domain (e.g., `hawki-client-example.dev.local`).
4.  **SSL Certificate Generation**: It uses `mkcert` to generate a locally trusted SSL certificate, allowing you to access your project via HTTPS without browser warnings.
5.  **`.env` Configuration**: It updates your local `.env` file with the newly generated IP address, domain, and SSL settings.

To run the installation, simply execute:

```bash
./bin/env install
```

> **Note:** The installer will need to modify system files (like `/etc/hosts`) and install root certificates. Therefore, it will prompt you for your `sudo` (or administrator) password during the process.

After the installation is complete, you can access your project at a clean, secure URL like `https://hawki-client-example.dev.local`.

## Extending `bin/env`

The `bin/env` program is designed to be extensible through a simple addon system. You can add new commands, integrate new tools, or even customize the UI. The core TypeScript source code for the program is located in the `bin/_env/` directory.

### Adding New Commands

You can add custom commands by creating new TypeScript files in the following directories:

-   `bin/_env/project/`: For commands that are specific to `hawki-client-example`.
-   `bin/_env/addons/`: For more generic commands that could potentially be reused in other projects.

A command is defined in an "addon" file, which must end with the `.addon.ts` suffix. The file must export a function named `addon` that returns the command configuration.

**Example: Creating a `hello` command**

1.  Create a new file: `bin/_env/project/hello.addon.ts`
2.  Add the following content:

    ```typescript
    import type { AddonEntrypoint } from '@/loadAddons.ts';
    import chalk from 'chalk';

    export const addon: AddonEntrypoint = async (context) => ({
      commands: async (program) => {
        program
          .command('hello')
          .description('greets the user')
          .argument('[name]', 'The name to greet', 'World')
          .action((name) => {
            console.log(chalk.blue(`Hello, ${name}!`));
          });
      },
    });
    ```

3.  That's it! Now you can run your new command:

    ```bash
    ./bin/env hello
    ./bin/env hello "Developer"
    ```

### Adding `npm` Dependencies

If your new command requires additional Node.js packages, you can add them to the program's own configuration file: `bin/_env/package.json`.

After you add a dependency to `package.json`, `bin/env` will automatically detect the change on its next run and install the new packages. If you want to manage dependencies manually, you can use the special `--npm` flag, which proxies commands to the `npm` binary used by `bin/env`.

For example, to add the `cowsay` package:

```bash
# This will add the dependency to bin/_env/package.json and install it
./bin/env --npm install cowsay
```

### The Events System

For more advanced integrations, `bin/env` uses an event-driven architecture. Addons can listen for and react to events that occur during the program's lifecycle. This allows for powerful, decoupled extensions.

For example, the `docker` addon emits a `docker:up:before` event just before it runs `docker compose up`. Other addons can hook into this to perform preparatory tasks.

Here's an example of how an addon might listen for this event:

```typescript
// Inside an addon file (e.g., my-custom.addon.ts)
import type { AddonEntrypoint } from '@/loadAddons.ts';

export const addon: AddonEntrypoint = async (context) => ({
  events: async (events) => {
    // Register a listener for the 'docker:up:before' event
    events.on('docker:up:before', async ({ args }) => {
      console.log('Docker is about to start!');
      
      // You can even modify the arguments being passed to the 'up' command
      args.add('--build'); 
    });
  },
});
```

This system enables different parts of `bin/env` to communicate and coordinate, making it a flexible and powerful tool for any project. You can discover available events by inspecting the `d.ts` declaration files within the `bin/_env/addons/` and `bin/_env/core/` directories.

## Building Foundations: From Dev Tools to SPA Elegance

With the powerful `bin/env` system now at your fingertips—empowering you to streamline development workflows through addons, events, and seamless coordination—it's time to shift our focus to the heart of the application: the frontend. Having covered the local development infrastructure that keeps our project humming, the next chapter dives into the Vanilla JS SPA Architecture & Workflow, where pure JavaScript modules come together for a simple yet robust single-page application. Discover how `index.js` kicks off authentication and initialization, how the hash-based `router.js` maps urls to dynamic page functions like `listPage.js`, and how everything renders reactively into the `<div id="app">` while maintaining clean separations of routing, rendering, and business logic.

Ready to explore the frontend's nimble architecture? Head over to [Vanilla JS SPA Architecture & Workflow](vanilla-js-spa-architecture-workflow-444335064.md) for the full dive.

