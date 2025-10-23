export function setAppContent(el) {
    document.getElementById('app').replaceChildren(el);
}

export function showAlert(type, message) {
    function renderTemplate(
        color,
        icon
    ) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.height = '100vh';
        container.style.textAlign = 'center';
        container.innerHTML = `
            <div style="border: 2px solid ${color}; border-radius: 10px; padding: 20px; max-width: 400px;">
                <div style="font-size: 50px; color: ${color};">${icon}</div>
                <h1 style="color: ${color};">${message}</h1>
                <button id="reload-button" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;">Reload page</button>
            </div>
        `;

        container.querySelector('#reload-button')
            .addEventListener('click', () => {
                window.location.reload();
            });

        return container;
    }

    let tpl;
    if (type === 'error') {
        tpl = renderTemplate('red', '😟');
    } else {
        tpl = renderTemplate('orange', '⚠️');
    }

    setAppContent(tpl);
}
