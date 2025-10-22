<?php
declare(strict_types=1);

/* ================================================
 * HEY THERE! 👋
 * This is MAYBE the first file you clicked at to understand how this example works.
 * In this case I would suggest looking at `public/index.php` first,
 * as that is the actual entry point for the backend example.
 * This file just contains a simple routing mechanism to make the example work.
 * ================================================
 */

define('SERVER_URL', $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST']);
const VENDOR_AUTOLOAD_PATH = __DIR__ . '/vendor/autoload.php';

final class Example
{
    private static array $routes = [];
    private static string|null $currentPagePath = null;
    private static string|null $currentRoute = null;

    /**
     * Register a new route that will be served by a file.
     *
     * @param string|array $method The HTTP method to listen to. E.g. "GET", "POST", "PUT", "DELETE". If you want to listen to multiple methods, pass an array.
     * @param string $route The route to listen to. E.g. "/login", "/logout", "/callback".
     * @param string $routeFile The absolute path to the file that will be included when the route is hit.
     * @return void
     */
    public static function routeFile(string|array $method, string $route, string $routeFile): void
    {
        self::route($method, $route, function () use ($routeFile) {
            require_once $routeFile;
        });
    }

    /**
     * Register a new route.
     * In a real world scenario your framework will do this for you.
     *
     * @param string|array $method The HTTP method to listen to. E.g. "GET", "POST", "PUT", "DELETE". If you want to listen to multiple methods, pass an array.
     * @param string $route The route to listen to. E.g. "/login", "/logout", "/callback".
     * @param callable $callback The function to execute when the route is hit.
     * @return void
     */
    public static function route(string|array $method, string $route, callable $callback): void
    {
        $method = is_array($method) ? $method : [$method];
        foreach ($method as $m) {
            self::$routes[$m][ltrim($route, ' /')] = $callback;
        }
    }

    /**
     * Returns the URL of the currently loaded example.
     * This is always the BASE url of the current example, without any query parameters and without a trailing slash.
     * e.g. "http://localhost:8080/stateful-auth"
     * @return string
     */
    public static function getPageUrl(): string
    {
        return SERVER_URL . '/' . self::$currentPagePath;
    }

    /**
     * Similar to {@see getPageUrl}, but includes the current route.
     * e.g "http://localhost:8080/stateful-auth/login"
     * @return string
     */
    public static function getRouteUrl(): string
    {
        $route = self::$currentRoute;

        if (empty($route)) {
            return self::getPageUrl();
        }

        return self::getPageUrl() . '/' . $route;
    }

    /**
     * This function is used to include the composer autoload file.
     * @return void
     */
    public static function includeComposerAutoload(): void
    {
        require_once VENDOR_AUTOLOAD_PATH;
    }

    /**
     * NO TOUCHY! This function is the main entry point for the examples.
     * @return void
     */
    public static function handle(): void
    {
        $route = empty($_GET['route']) ? '' : $_GET['route'];
        $route = ltrim($route, ' /');
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        if (isset(self::$routes[$method][$route])) {
            self::$currentRoute = $route;
            $routeArgs = [];

            self::$routes[$method][$route](...$routeArgs);
            exit();
        }

        self::show404();
    }

    private static function show404(): never
    {
        header('HTTP/1.0 404 Not Found');
        echo '<h1>404 Not Found</h1>';
        echo '<p>The requested route was not found.</p>';
        echo '<a href="/">Back to index</a>';
        exit();
    }
}
