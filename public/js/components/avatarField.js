/**
 * @param {HawkiClient} client
 * @param {StorageFile|undefined} avatarFile
 * @param {(file: File) => {done: Promise<any>}} doUpload
 * @return {HTMLDivElement}
 */
export function avatarField(
    client,
    avatarFile,
    doUpload
) {

    const avatarLimits = client.files.avatarLimits();
    const maxAvatarSize = avatarLimits.maxSize;
    const allowedMimeTypes = avatarLimits.mimeTypes.join(', ');

    const fieldContainer = document.createElement('div');
    fieldContainer.style.marginBottom = '10px';
    fieldContainer.innerHTML = `
                <label>Avatar:</label>
                <div style="margin-top: 5px;" id="avatar-image-container">
                </div>
                <input type="file" id="avatar-input" accept="${allowedMimeTypes}" style="margin-top: 5px;">
                <div style="font-size: 12px; color: gray; margin-top: 5px;">
                    Allowed types: ${allowedMimeTypes}. Max size: ${Math.round(maxAvatarSize / 1024)} KB.
                </div>
            `;

    const avatarInput = fieldContainer.querySelector('#avatar-input');
    const avatarImageContainer = fieldContainer.querySelector('#avatar-image-container');

    Promise.resolve(avatarFile ? client.files.getImgElement(avatarFile) : null).then(imgEl => {
        if (imgEl) {
            imgEl.style.width = '100px';
            imgEl.style.height = '100px';
            imgEl.style.objectFit = 'cover';
            imgEl.style.borderRadius = '50%';
            avatarImageContainer.replaceChildren(imgEl);
        } else {
            const placeholder = document.createElement('div');
            placeholder.style.width = '100px';
            placeholder.style.height = '100px';
            placeholder.style.borderRadius = '50%';
            placeholder.style.backgroundColor = '#ccc';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.color = '#666';
            placeholder.textContent = 'No Avatar';
            avatarImageContainer.replaceChildren(placeholder);
        }
    });

    avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        try {
            await doUpload(file).done;
            alert('Avatar updated successfully.');
        } catch (error) {
            alert(`Error updating avatar: ${error.message}`);
            console.error('Error updating avatar:', error);
            avatarInput.value = '';
        }
    });

    return fieldContainer;
}
