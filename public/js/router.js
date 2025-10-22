/**
 * An extremely simple router for a single page application.
 * It persists the current route in the URL hash, and will read it again on page load.
 *
 * Usage:
 *
 * const router = createRouter([
 *   {
 *     name: 'home',
 *     path: '/',
 *     handle: (goTo, params) => {
 *      // Render home page
 *      goTo('chat', {chatId: 123});
 *     },
 *   },
 *   {
 *     name: 'chat',
 *     path: '/chat/:chatId',
 *     handle: (goTo, params) => {
 *      // Render chat page
 *      return () => {
 *          // Cleanup function called when navigating away from this route
 *          // Can also return an array of functions
 *      }
 *     },
 *   },
 * ]);
 *
 * router.route(); // Call this on page load to route to the current URL hash
 *
 * @param {{name: string, path: string, handle: (goTo: (name: string, params: any) => void, params: any, router: any) => void}[]} routes
 * @param {(type: string, message: string) => void} onError Optional handler for unmatched routes
 */
export function createRouter(
    routes,
    onError
) {
    let cleanup = null;

    const compileRoute = (path) => {
        const paramNames = [];
        // Replace :param with capturing groups
        const regexPath = path.replace(/:([^/]+)/g, (match, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });
        const regex = new RegExp(`^${regexPath}$`);
        return {regex, paramNames};
    };

    const compiledRoutes = routes.map(route => ({
        ...route,
        ...compileRoute(route.path)
    }));

    const route = () => {
        const currentPath = window.location.hash.replace(/^#/, '') || '/';

        for (const route of compiledRoutes) {
            const match = currentPath.match(route.regex);
            if (match) {
                const params = {};
                route.paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });

                if (typeof cleanup === 'function') {
                    cleanup();
                    cleanup = null;
                }

                try {
                    const routeCleanup = route.handle(goTo, params);

                    if (routeCleanup && (Array.isArray(routeCleanup) || routeCleanup instanceof Set)) {
                        cleanup = () => {
                            routeCleanup.forEach(fn => {
                                if (typeof fn === 'function') {
                                    fn();
                                }
                            });
                        };
                    } else if (typeof routeCleanup === 'function') {
                        cleanup = routeCleanup;
                    }
                } catch (e) {
                    console.error('Error in route handler', e);
                    onError('error', `Error in route (${route.name}) handler: ${e.message}`);
                }

                return;
            }
        }

        console.warn(`No route matched for path: ${currentPath}`);
        onError('warning', `No route matched for path: ${currentPath}`);
    };

    const goTo = (name, params = {}) => {
        const targetRoute = routes.find(r => r.name === name);
        if (!targetRoute) {
            throw new Error(`Route with name "${name}" not found`);
        }

        let path = targetRoute.path;
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(`:${key}`, String(value));
        });

        window.location.hash = path;
    };

    window.addEventListener('hashchange', route);

    return {
        route,
        goTo
    };
}
