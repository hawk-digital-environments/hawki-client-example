/**
 * Creates an autocomplete input field.
 * @param label The label for the input field
 * @param name The name and id prefix for the input field
 * @param fetchEntries A function that takes the current input value and a cancellation collector,
 *                     and returns a Promise that resolves to an array of suggestion strings.
 *                     The cancellation collector collects callbacks which will be triggered if
 *                     another fetch is initiated before the current one completes.
 * @param onSelect A callback function that is called when a suggestion is selected.
 *                  Receives the selected entry as an argument.
 * @param labelFieldName The field name to use as the label in the suggestions (default: 'label')
 * @return {HTMLDivElement}
 */
export function autocompleteField(
    label,
    name,
    fetchEntries,
    onSelect,
    labelFieldName = 'label'
) {
    const fieldContainer = document.createElement('div');
    fieldContainer.style.marginBottom = '10px';
    fieldContainer.innerHTML = `
                <label for="${name}-input">${label}:</label><br>
                <input type="text" id="${name}-input" name="${name}" style="width: 300px; padding: 5px;" autocomplete="off">
                <div id="${name}-suggestions" style="border: 1px solid #ccc; max-height: 150px; overflow-y: auto; display: none; position: absolute; background: white; z-index: 1000;"></div>
            `;

    const input = fieldContainer.querySelector(`#${name}-input`);
    const suggestionsContainer = fieldContainer.querySelector(`#${name}-suggestions`);

    let debounceTimeout = null;
    let currentFetchId = 0;
    let triggerCancel = () => void 0;

    input.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(async () => {
            const query = input.value.trim();
            if (query.length === 0) {
                suggestionsContainer.style.display = 'none';
                suggestionsContainer.innerHTML = '';
                return;
            }
            const cancelCallbacks = [];
            const onCancelled = (cb) => {
                cancelCallbacks.push(cb);
            };

            triggerCancel();
            triggerCancel = () => {
                cancelCallbacks.forEach(cb => cb());
            };

            const fetchId = ++currentFetchId;
            try {

                const entries = await fetchEntries(query, onCancelled);
                if (fetchId !== currentFetchId) {
                    // A newer fetch is in progress, ignore this result
                    return;
                }
                triggerCancel = () => void 0;

                suggestionsContainer.innerHTML = '';
                if (entries.length === 0) {
                    suggestionsContainer.style.display = 'none';
                    return;
                }

                const valueToLabel = (entry) => {
                    if (typeof entry === 'string') {
                        return entry;
                    } else if (entry && typeof entry === 'object' && labelFieldName in entry) {
                        return entry[labelFieldName];
                    } else {
                        return String(entry);
                    }
                };

                entries.forEach(entry => {
                    const entryDiv = document.createElement('div');
                    entryDiv.style.padding = '5px';
                    entryDiv.style.cursor = 'pointer';
                    entryDiv.textContent = valueToLabel(entry);
                    entryDiv.addEventListener('click', () => {
                        onSelect(entry);
                        input.value = ''; // Clear input after selection
                        suggestionsContainer.style.display = 'none';
                        suggestionsContainer.innerHTML = '';
                    });
                    suggestionsContainer.appendChild(entryDiv);
                });

                suggestionsContainer.style.display = 'block';
            } catch (error) {
                console.error('Error fetching autocomplete entries:', error);
                suggestionsContainer.style.display = 'none';
                suggestionsContainer.innerHTML = '';
            }
        }, 200);
    });

    document.addEventListener('click', (e) => {
        if (!fieldContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
            suggestionsContainer.innerHTML = '';
        }
    });

    return fieldContainer;
}
