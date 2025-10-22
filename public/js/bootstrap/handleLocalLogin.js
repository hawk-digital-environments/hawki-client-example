export async function handleLocalLogin(goTo) {
    async function isLoggedIn() {
        const response = await fetch('/login-status');
        return response.ok && await response.text();
    }

    if (await isLoggedIn()) {
        return true;
    }

    function renderLoginForm() {
        const container = document.createElement('div');
        container.innerHTML = `
            <form id="login-form" action="/login" method="POST">
                <div>
                    <h3>Login Options</h3>
                    <ul>
                        <li>Username: tester, admin, user, guest, test, test2, test3, test4, test5, test6</li>
                        <li>Password: always <code>password</code></li>
                    </ul>
                </div>
                <input type="text" name="username" placeholder="Username" required/>
                <input type="password" name="password" placeholder="Password" required/>
                <input type="submit" value="Login"/>
            </form>
        `;
        return container;
    }

    const app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(renderLoginForm());

    return new Promise((resolve) => void 0); // Await indefinitely (login handled by form submission)
}
