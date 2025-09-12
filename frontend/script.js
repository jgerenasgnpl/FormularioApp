document.addEventListener('DOMContentLoaded', () => {

    // --- REFERENCIAS AL DOM ---
    const authPage = document.getElementById('auth-page');
    const mainApp = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const adminControlsDiv = document.getElementById('admin-controls');
    const createUserModal = document.getElementById('create-user-modal');
    const createUserForm = document.getElementById('create-user-form');
    const closeUserModalBtn = createUserModal.querySelector('.close-button');
    const configPage = document.getElementById('config-page');
    const formPage = document.getElementById('form-page');
    const configLink = document.getElementById('config-link');
    const formLink = document.getElementById('form-link');
    const mainTitle = document.getElementById('main-title');
    const alertModal = document.getElementById('alert-modal');
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');
    const alertOkButton = document.getElementById('alert-ok-button');
    const alertCloseButton = alertModal.querySelector('.close-button');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const formConfigSection = document.getElementById('form-config-section');
    const moduleConfigSection = document.getElementById('module-config-section');
    const questionConfig = document.getElementById('question-config');
    const formularioListDiv = document.getElementById('formulario-list');
    const moduleListDiv = document.getElementById('module-list');
    const questionListDiv = document.getElementById('question-list');
    const addFormularioBtn = document.getElementById('add-formulario-btn');
    const addModuleBtn = document.getElementById('add-module-btn');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const backToFormsBtn = document.getElementById('back-to-forms-btn');
    const currentFormularioNameSpan = document.getElementById('current-formulario-name');
    const currentModuleNameSpan = document.getElementById('current-module-name');
    const formsListContainer = document.getElementById('forms-list-container');
    const formsRenderContainer = document.getElementById('forms-render-container');
    const questionModal = document.getElementById('question-modal');
    const questionForm = document.getElementById('question-form');
    const questionTextInput = document.getElementById('question-text');
    const questionTypeSelect = document.getElementById('question-type');
    const optionsGroupDiv = document.getElementById('options-group');
    const questionOptionsInput = document.getElementById('question-options');
    const patternGroupDiv = document.getElementById('pattern-group');
    const questionPatternInput = document.getElementById('question-pattern');
    const dependentGroupDiv = document.getElementById('dependent-group');
    const dependentParentFieldInput = document.getElementById('dependent-parent-field');
    const dependentChildFieldInput = document.getElementById('dependent-child-field');
    const repartidorFieldsGroupDiv = document.getElementById('repartidor-fields-group');
    const repartidorSubQuestionsListDiv = document.getElementById('repartidor-sub-questions-list');
    const addRepartidorSubQuestionBtn = document.getElementById('add-repartidor-sub-question-btn');
    const closeQuestionModalBtn = questionModal.querySelector('.close-button');

    const enableQuantityGroupDiv = document.getElementById('enable-quantity-group');
    const enableQuantityCheckbox = document.getElementById('enable-quantity-checkbox');
    const quantityGroupDiv = document.getElementById('quantity-group');
    const quantityMinInput = document.getElementById('quantity-min');
    const quantityMaxInput = document.getElementById('quantity-max');

    const makeConditionalCheckbox = document.getElementById('make-conditional-checkbox');
    const conditionalGroupDiv = document.getElementById('conditional-group');
    const conditionalTriggerQuestionSelect = document.getElementById('conditional-trigger-question');
    const conditionalTriggerValueInput = document.getElementById('conditional-trigger-value');

    const resultsPage = document.getElementById('results-page');
    const resultsLink = document.getElementById('results-link');
    const submissionsListDiv = document.getElementById('submissions-list');
    const submissionDetailsDiv = document.getElementById('submission-details');

    // --- ESTADO GLOBAL ---
    let currentUser = null;
    let currentFormularioId = null;
    let currentModuleId = null;
    let editingQuestionId = null;
    let cachedForms = [];
    const API_BASE_URL = 'https://formularioapp.onrender.com';

    // --- API WRAPPER ---
    const api = {
        login: (email, password) => fetchApi('/auth/login', { method: 'POST', body: { email, password } }),
        register: (email, password, rol) => fetchApi('/auth/register', { method: 'POST', body: { email, password, rol } }),
        getFormularios: () => fetchApi('/formularios'),
        getSubmissions: () => fetchApi('/submissions'),
        createFormulario: (name, created_by) => fetchApi('/formularios', { method: 'POST', body: { name, created_by } }),
        createModule: (formId, name) => fetchApi(`/formularios/${formId}/modulos`, { method: 'POST', body: { name } }),
        updateModule: (id, name) => fetchApi(`/modulos/${id}`, { method: 'PUT', body: { name } }),
        deleteModule: (id) => fetchApi(`/modulos/${id}`, { method: 'DELETE' }),
        createQuestion: (modId, data) => fetchApi(`/modulos/${modId}/preguntas`, { method: 'POST', body: data }),
        updateQuestion: (id, data) => fetchApi(`/preguntas/${id}`, { method: 'PUT', body: data }),
        deleteQuestion: (id) => fetchApi(`/preguntas/${id}`, { method: 'DELETE' }),
        reorder: (table, ids) => fetchApi('/reorder', { method: 'POST', body: { table, ids } }),
        submitForm: (formId, usuario_id, respuestas) => fetchApi(`/formularios/${formId}/envios`, { method: 'POST', body: { usuario_id, respuestas } }),
        getDepartamentos: () => fetchApi('/geodata/departamentos'),
        getMunicipios: (departamento) => fetchApi(`/geodata/municipios/${departamento}`)
    };

    async function fetchApi(endpoint, options = {}) {
        try {
            const config = { 
                method: options.method || 'GET', 
                headers: { 'Content-Type': 'application/json' } 
            };

            if (currentUser && currentUser.id) {
                config.headers['X-User-ID'] = currentUser.id;
            }

            if (options.body) config.body = JSON.stringify(options.body);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

            if (response.status === 204) {
                console.log(`API Success (204 No Content): ${endpoint}`);
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                let errorMessage = data.error || 'Error desconocido.';
                if (data.details) {
                    errorMessage += `\n\nDetalles: ${data.details}`;
                }
                if (data.stack) {
                    errorMessage += `\n\nStack: ${data.stack}`;
                }
                throw new Error(errorMessage);
            }

            console.log(`API Success: ${endpoint}`, data);
            return data;
        } catch (error) {
            console.error(`API Error: ${endpoint}`, error);
            showAlert('Error de API', error.message);
            throw error;
        }
    }

    // --- LÓGICA DE VISTAS Y NAVEGACIÓN ---
    function showAuthPage() { authPage.style.display = 'block'; mainApp.style.display = 'none'; currentUser = null; sessionStorage.removeItem('currentUser'); }
    function showApp(user) { currentUser = user; sessionStorage.setItem('currentUser', JSON.stringify(user)); authPage.style.display = 'none'; mainApp.style.display = 'block'; renderAdminControls(user); initializeApp(); }
    function renderAdminControls(user) {
        adminControlsDiv.innerHTML = '';
        if (user.rol === 'admin') {
            const createUserBtn = document.createElement('button');
            createUserBtn.className = 'btn btn-primary';
            createUserBtn.textContent = 'Crear Usuario';
            createUserBtn.addEventListener('click', () => {
                createUserModal.style.display = 'flex';
            });
            adminControlsDiv.appendChild(createUserBtn);
        }
    }
    function showAppPage(pageToShow) {
        configPage.style.display = 'none';
        formPage.style.display = 'none';
        resultsPage.style.display = 'none';
        pageToShow.style.display = 'block';
    }

    function updateUIAccess(role) {
        try {
            const configLink = document.getElementById('config-link');
            const resultsLink = document.getElementById('results-link');
            const addFormularioBtn = document.getElementById('add-formulario-btn');
            const addModuleBtn = document.getElementById('add-module-btn');
            const addQuestionBtn = document.getElementById('add-question-btn');
            const exportCsvBtn = document.getElementById('export-csv-btn');
            const createUserModal = document.getElementById('create-user-modal');
            const configPage = document.getElementById('config-page');
            const resultsPage = document.getElementById('results-page');
            const formLink = document.getElementById('form-link');

            if (configLink) configLink.style.display = 'none';
            if (resultsLink) resultsLink.style.display = 'none';
            if (addFormularioBtn) addFormularioBtn.style.display = 'none';
            if (addModuleBtn) addModuleBtn.style.display = 'none';
            if (addQuestionBtn) addQuestionBtn.style.display = 'none';
            if (exportCsvBtn) exportCsvBtn.style.display = 'none';
            if (createUserModal) createUserModal.style.display = 'none';

            if (role === 'admin') {
                if (configLink) configLink.style.display = 'flex';
                if (resultsLink) resultsLink.style.display = 'flex';
                if (addFormularioBtn) addFormularioBtn.style.display = 'inline-block';
                if (addModuleBtn) addModuleBtn.style.display = 'inline-block';
                if (addQuestionBtn) addQuestionBtn.style.display = 'inline-block';
                if (exportCsvBtn) exportCsvBtn.style.display = 'inline-block';
            } else {
                if (configPage && resultsPage && (configPage.style.display === 'block' || resultsPage.style.display === 'block')) {
                    if (formLink) formLink.click();
                }
            }
        } catch (error) {
            console.error('Error in updateUIAccess:', error);
        }
    }

    // --- MANEJADORES DE EVENTOS ---
    loginForm.addEventListener('submit', async e => { e.preventDefault(); try { const res = await api.login(loginForm.elements['login-email'].value, loginForm.elements['login-password'].value); showApp(res.user); } catch (err) {} });
    logoutBtn.addEventListener('click', e => { e.preventDefault(); showAuthPage(); });
    closeUserModalBtn.addEventListener('click', () => createUserModal.style.display = 'none');
    createUserForm.addEventListener('submit', async e => { e.preventDefault(); const email = createUserForm.elements['create-email'].value; const password = createUserForm.elements['create-password'].value; const rol = createUserForm.elements['create-rol'].value; try { await api.register(email, password, rol); showAlert('Éxito', `Usuario "${email}" creado.`); createUserModal.style.display = 'none'; createUserForm.reset(); } catch (error) {} });

    // --- LÓGICA DE LA PÁGINA DE RESULTADOS ---
    let cachedSubmissions = [];

    async function loadSubmissions() {
        submissionDetailsDiv.innerHTML = '<p>Selecciona un envío de la lista para ver sus respuestas.</p>';
        try {
            cachedSubmissions = await api.getSubmissions();
            submissionsListDiv.innerHTML = '';
            if (cachedSubmissions.length === 0) {
                submissionsListDiv.innerHTML = '<p>No hay envíos para mostrar.</p>';
                return;
            }

            cachedSubmissions.forEach(sub => {
                const item = document.createElement('div');
                item.className = 'submission-item';
                item.dataset.id = sub.id;
                const formName = sub.formularios ? sub.formularios.name : 'Formulario Desconocido';
                const userEmail = sub.usuarios ? sub.usuarios.email : 'Usuario Desconocido';
                const submissionDate = new Date(sub.created_at).toLocaleString();

                item.innerHTML = `
                    <h4>${formName}</h4>
                    <p>Enviado por: <strong>${userEmail}</strong></p>
                    <p>Fecha: ${submissionDate}</p>
                `;
                submissionsListDiv.appendChild(item);
            });
        } catch (error) {
            showAlert('Error', 'No se pudieron cargar los resultados de los envíos.');
        }
    }

    function renderSubmissionDetails(submissionId) {
        document.querySelectorAll('.submission-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === submissionId);
        });

        const submission = cachedSubmissions.find(s => s.id === submissionId);
        if (!submission) {
            submissionDetailsDiv.innerHTML = '<p>Error: No se encontró el envío.</p>';
            return;
        }

        let tableHtml = `
            <h3>Detalles del Envío</h3>
            <p><strong>Formulario:</strong> ${submission.formularios ? submission.formularios.name : 'N/A'}</p>
            <p><strong>Enviado por:</strong> ${submission.usuarios ? submission.usuarios.email : 'N/A'}</p>
            <p><strong>Fecha:</strong> ${new Date(submission.created_at).toLocaleString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>Pregunta</th>
                        <th>Respuesta</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const respuestas = submission.respuestas || {};
        for (const [pregunta, respuesta] of Object.entries(respuestas)) {
            let formattedRespuesta;

            if (Array.isArray(respuesta) && respuesta.every(item => typeof item === 'object')) {
                formattedRespuesta = '<table><thead><tr>';
                if (respuesta.length > 0) {
                    Object.keys(respuesta[0]).forEach(key => {
                        formattedRespuesta += `<th>${key}</th>`;
                    });
                    formattedRespuesta += '</tr></thead><tbody>';
                    respuesta.forEach(item => {
                        formattedRespuesta += '<tr>';
                        Object.values(item).forEach(value => {
                            formattedRespuesta += `<td>${value}</td>`;
                        });
                        formattedRespuesta += '</tr>';
                    });
                    formattedRespuesta += '</tbody>';
                }
                formattedRespuesta += '</table>';
            } else if (typeof respuesta === 'object' && respuesta !== null) {
                formattedRespuesta = `<pre>${JSON.stringify(respuesta, null, 2)}</pre>`;
            } else {
                formattedRespuesta = respuesta ? respuesta.toString() : '';
            }

            tableHtml += `
                <tr>
                    <td>${pregunta}</td>
                    <td>${formattedRespuesta}</td>
                </tr>
            `;
        }

        tableHtml += '</tbody></table>';
        submissionDetailsDiv.innerHTML = tableHtml;
    }

    // --- LÓGICA PRINCIPAL DE LA APP ---
    async function initializeApp() {
        updateUIAccess(currentUser.rol);
        configLink.addEventListener('click', async e => { 
            e.preventDefault(); 
            showAppPage(configPage); 
            document.querySelectorAll('.top-nav a').forEach(a => a.classList.remove('active'));
            configLink.classList.add('active');
            await loadFormulariosConfig(); 
        });
        formLink.addEventListener('click', async e => { 
            e.preventDefault(); 
            showAppPage(formPage); 
            document.querySelectorAll('.top-nav a').forEach(a => a.classList.remove('active'));
            formLink.classList.add('active');
            await loadFormulariosForFilling(); 
        });
        resultsLink.addEventListener('click', async e => {
            e.preventDefault();
            showAppPage(resultsPage);
            document.querySelectorAll('.top-nav a').forEach(a => a.classList.remove('active'));
            resultsLink.classList.add('active');
            await loadSubmissions();
        });

        submissionsListDiv.addEventListener('click', e => {
            const item = e.target.closest('.submission-item');
            if (item) {
                renderSubmissionDetails(item.dataset.id);
            }
        });

        if(exportCsvBtn) exportCsvBtn.addEventListener('click', exportToCsv);

        formLink.click();
    }

    // --- LÓGICA DE CONFIGURACIÓN ---
    async function refreshFormsCache() { cachedForms = await api.getFormularios(); }

    async function loadFormulariosConfig() {
        formConfigSection.style.display = 'block';
        moduleConfigSection.style.display = 'none';
        questionConfig.style.display = 'none';
        await refreshFormsCache();
        formularioListDiv.innerHTML = '';
        cachedForms.forEach(f => {
            const item = document.createElement('div');
            item.className = 'config-item';
            item.innerHTML = `<span>${f.name}</span><button class="view-modules-btn" data-id="${f.id}" data-name="${f.name}">Ver Módulos</button>`;
            formularioListDiv.appendChild(item);
        });
    }

    function loadModulesConfig(formId, formName) {
        currentFormularioId = formId;
        currentFormularioNameSpan.textContent = formName;
        formConfigSection.style.display = 'none';
        moduleConfigSection.style.display = 'block';
        questionConfig.style.display = 'none';
        const form = cachedForms.find(f => f.id === formId);
        moduleListDiv.innerHTML = '';
        (form.modulos || []).forEach((m, index, arr) => {
            const item = document.createElement('div');
            item.className = 'config-item';
            const upArrow = index === 0 ? '' : `<button class="move-module-btn" data-id="${m.id}" data-direction="up">↑</button>`;
            const downArrow = index === arr.length - 1 ? '' : `<button class="move-module-btn" data-id="${m.id}" data-direction="down">↓</button>`;
            item.innerHTML = `<span>${m.name}</span><div class="item-controls">${upArrow}${downArrow}<button class="view-questions-btn" data-id="${m.id}" data-name="${m.name}">Ver</button><button class="edit-module-btn" data-id="${m.id}" data-name="${m.name}">Editar</button><button class="delete-module-btn" data-id="${m.id}">X</button></div>`;
            moduleListDiv.appendChild(item);
        });
    }

    async function loadQuestionsConfig(modId, modName) {
        currentModuleId = modId;
        currentModuleNameSpan.textContent = modName;
        questionConfig.style.display = 'block';
        let questions = [];
        for (const form of cachedForms) {
            const mod = (form.modulos || []).find(m => m.id === modId);
            if (mod) { questions = mod.preguntas || []; break; }
        }
        questionListDiv.innerHTML = '';
        questions.forEach((q, index, arr) => {
            const item = document.createElement('div');
            item.className = 'config-item';
            const upArrow = index === 0 ? '' : `<button class="move-question-btn" data-id="${q.id}" data-direction="up">↑</button>`;
            const downArrow = index === arr.length - 1 ? '' : `<button class="move-question-btn" data-id="${q.id}" data-direction="down">↓</button>`;
            item.innerHTML = `<span>${q.text} (${q.type})</span><div class="item-controls">${upArrow}${downArrow}<button class="edit-question-btn" data-id="${q.id}">Editar</button><button class="delete-question-btn" data-id="${q.id}">X</button></div>`;
            questionListDiv.appendChild(item);
        });
    }

    document.getElementById('main-app').addEventListener('click', async e => {
        const target = e.target;
        if (target.matches('.view-modules-btn')) loadModulesConfig(target.dataset.id, target.dataset.name);
        if (target.matches('.view-questions-btn')) loadQuestionsConfig(target.dataset.id, target.dataset.name);
        if (target.matches('.delete-module-btn')) {
            const id = target.dataset.id;
            if (confirm('¿Seguro que quieres eliminar este módulo? Se borrarán todas sus preguntas.')) {
                await api.deleteModule(id);
                await refreshFormsCache();
                loadModulesConfig(currentFormularioId, currentFormularioNameSpan.textContent);
            }
        }
        if (target.matches('.delete-question-btn')) {
            const id = target.dataset.id;
            if (confirm('¿Seguro que quieres eliminar esta pregunta?')) {
                try {
                    await api.deleteQuestion(id);
                    showAlert('Éxito', 'Pregunta eliminada correctamente.');
                } catch (error) {
                    showAlert('Error', 'No se pudo eliminar la pregunta.');
                }
                await refreshFormsCache();
                loadQuestionsConfig(currentModuleId, currentModuleNameSpan.textContent);
            }
        }
        if (target.matches('.edit-module-btn')) {
            const id = target.dataset.id;
            const currentName = target.dataset.name;
            const newName = prompt('Introduce el nuevo nombre para el módulo:', currentName);
            if (newName && newName !== currentName) {
                await api.updateModule(id, newName);
                await refreshFormsCache();
                loadModulesConfig(currentFormularioId, currentFormularioNameSpan.textContent);
            }
        }
        if (target.matches('.edit-question-btn')) openQuestionModal(target.dataset.id);
        if (target.matches('.move-module-btn') || target.matches('.move-question-btn')) {
            const isModule = target.matches('.move-module-btn');
            const table = isModule ? 'modulos' : 'preguntas';
            const id = target.dataset.id;
            const direction = target.dataset.direction;
            let items = [];
            if (isModule) {
                const form = cachedForms.find(f => f.id === currentFormularioId);
                items = form.modulos || [];
            } else {
                for (const form of cachedForms) {
                    const mod = (form.modulos || []).find(m => m.id === currentModuleId);
                    if (mod) { items = mod.preguntas || []; break; }
                }
            }
            const index = items.findIndex(item => item.id === id);
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex >= 0 && newIndex < items.length) {
                [items[index], items[newIndex]] = [items[newIndex], items[index]];
                const newIds = items.map(item => item.id);
                await api.reorder(table, newIds);
                await refreshFormsCache();
                if (isModule) loadModulesConfig(currentFormularioId, currentFormularioNameSpan.textContent);
                else loadQuestionsConfig(currentModuleId, currentModuleNameSpan.textContent);
            }
        }
    });

    addFormularioBtn.addEventListener('click', async () => { const name = prompt('Nombre del nuevo formulario:'); if (name) { await api.createFormulario(name, currentUser.id); await loadFormulariosConfig(); } });
    addModuleBtn.addEventListener('click', async () => { const name = prompt('Nombre del nuevo módulo:'); if (name && currentFormularioId) { await api.createModule(currentFormularioId, name); await refreshFormsCache(); loadModulesConfig(currentFormularioId, currentFormularioNameSpan.textContent); } });
    addQuestionBtn.addEventListener('click', () => openQuestionModal());
    backToFormsBtn.addEventListener('click', loadFormulariosConfig);

    // --- LÓGICA DEL MODAL DE PREGUNTAS ---
    async function openQuestionModal(questionId = null) {
        questionForm.reset();
        repartidorSubQuestionsListDiv.innerHTML = '';
        optionsGroupDiv.style.display = 'none';
        patternGroupDiv.style.display = 'none';
        dependentGroupDiv.style.display = 'none';
        repartidorFieldsGroupDiv.style.display = 'none';
        enableQuantityGroupDiv.style.display = 'none';
        quantityGroupDiv.style.display = 'none';
        enableQuantityCheckbox.checked = false;
        quantityMinInput.value = '1';
        quantityMaxInput.value = '10';

        conditionalGroupDiv.style.display = 'none';
        makeConditionalCheckbox.checked = false;
        conditionalTriggerValueInput.value = '';

        editingQuestionId = questionId;

        conditionalTriggerQuestionSelect.innerHTML = '<option value="">Selecciona una pregunta...</option>';
        if (currentModuleId) {
            let module;
            for (const form of cachedForms) {
                const foundModule = (form.modulos || []).find(m => m.id == currentModuleId); 
                if (foundModule) {
                    module = foundModule;
                    break;
                }
            }

            if (module) {
                const allQuestions = module.preguntas || [];
                const currentIndex = editingQuestionId ? allQuestions.findIndex(q => q.id == editingQuestionId) : allQuestions.length;
                const precedingQuestions = allQuestions.slice(0, currentIndex);
                
                precedingQuestions.forEach(q => {
                    const validTriggerTypes = ['texto', 'numero', 'fecha', 'booleano', 'seleccion_unica'];
                    if (validTriggerTypes.includes(q.type)) {
                        const option = document.createElement('option');
                        option.value = q.text;
                        option.textContent = q.text;
                        conditionalTriggerQuestionSelect.appendChild(option);
                    }
                });
            }
        }

        if (questionId) {
            questionModal.querySelector('h3').textContent = 'Editar Pregunta';
            let question;
            for (const form of cachedForms) {
                for (const mod of (form.modulos || [])) {
                    const q = (mod.preguntas || []).find(p => p.id == questionId);
                    if (q) { question = q; break; }
                }
                if (question) break;
            }
            if (!question) return showAlert('Error', 'Pregunta no encontrada');

            questionTextInput.value = question.text;
            questionTypeSelect.value = question.type;
            questionTypeSelect.dispatchEvent(new Event('change'));

            const rules = question.rules ? JSON.parse(question.rules) : {};
            if (rules.options) {
                questionOptionsInput.value = rules.options.join(', ');
            }
            if (rules.pattern) {
                questionPatternInput.value = rules.pattern;
            }
            if (rules.dependent) {
                dependentParentFieldInput.value = rules.dependent.parentField;
                dependentChildFieldInput.value = rules.dependent.childField;
            }
            if (rules.subQuestions) {
                rules.subQuestions.forEach(subQ => addRepartidorSubQuestion(subQ));
            }
            if (rules.conditional) {
                makeConditionalCheckbox.checked = true;
                conditionalGroupDiv.style.display = 'block';
                conditionalTriggerQuestionSelect.value = rules.conditional.triggerQuestionText;
                conditionalTriggerValueInput.value = rules.conditional.triggerValue;
            }
            if (rules.quantity) {
                enableQuantityCheckbox.checked = true;
                quantityGroupDiv.style.display = 'block';
                quantityMinInput.value = rules.quantity.min;
                quantityMaxInput.value = rules.quantity.max;
            }
        } else {
            questionModal.querySelector('h3').textContent = 'Añadir Nueva Pregunta';
        }
        questionModal.style.display = 'flex';
    }

    function addRepartidorSubQuestion(subQ = null) {
        const item = document.createElement('div');
        item.className = 'repartidor-sub-question-item';
        const subQuestionTypes = ['texto', 'numero', 'fecha', 'booleano', 'seleccion_unica', 'seleccion_multiple', 'seleccion_dependiente', 'listado_definido'];
        const typeOptions = subQuestionTypes.map(t => `<option value="${t}" ${subQ && subQ.type === t ? 'selected' : ''}>${t.replace(/_/g, ' ')}</option>`).join('');
        
        const isFirstOnly = subQ && subQ.firstItemOnly ? 'checked' : '';
        const subQRules = subQ && subQ.rules ? (typeof subQ.rules === 'string' ? JSON.parse(subQ.rules) : subQ.rules) : {};
        const hasQuantity = subQRules.quantity ? true : false;
        const quantityMin = hasQuantity ? subQRules.quantity.min : 1;
        const quantityMax = hasQuantity ? subQRules.quantity.max : 10;
        const subQOptionsTypes = ['seleccion_unica', 'seleccion_multiple', 'listado_definido'];

        item.innerHTML = `
            <div class="form-group"><label>Nombre:</label><input type="text" class="repartidor-sub-q-name" value="${subQ ? subQ.name : ''}" required></div>
            <div class="form-group"><label>Tipo:</label><select class="repartidor-sub-q-type">${typeOptions}</select></div>
            <div class="form-group">
                <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" class="repartidor-sub-q-first-only" ${isFirstOnly}>
                    ¿Solo para el primer elemento?
                </label>
            </div>
            <div class="form-group repartidor-sub-q-pattern" style="display: ${subQ && subQ.type === 'texto' ? 'block' : 'none'};"><label>Patrón:</label><input type="text" class="repartidor-sub-q-pattern-input" value="${subQRules.pattern || ''}"></div>
            <div class="form-group repartidor-sub-q-options" style="display: ${subQ && subQOptionsTypes.includes(subQ.type) ? 'block' : 'none'};"><label>Opciones (coma):</label><input type="text" class="repartidor-sub-q-options-input" value="${subQRules.options ? subQRules.options.join(', ') : ''}"></div>
            <div class="form-group repartidor-sub-q-dependent" style="display: ${subQ && subQ.type === 'seleccion_dependiente' ? 'block' : 'none'};"><label>Padre:</label><input type="text" class="repartidor-sub-q-dependent-parent" value="${subQRules.dependent ? subQRules.dependent.parentField : ''}"><label>Hijo:</label><input type="text" class="repartidor-sub-q-dependent-child" value="${subQRules.dependent ? subQRules.dependent.childField : ''}"></div>
            <div class="form-group"><label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" class="repartidor-sub-q-enable-quantity" ${hasQuantity ? 'checked' : ''}> Habilitar Cantidad</label></div>
            <div class="form-group repartidor-sub-q-quantity-group" style="display: ${hasQuantity ? 'block' : 'none'};"><label>Min:</label><input type="number" class="repartidor-sub-q-quantity-min" value="${quantityMin}" min="1"><label>Max:</label><input type="number" class="repartidor-sub-q-quantity-max" value="${quantityMax}" min="1"></div>
            <button type="button" class="remove-sub-q-btn">X</button>
        `;
        repartidorSubQuestionsListDiv.appendChild(item);
        item.querySelector('.remove-sub-q-btn').addEventListener('click', () => item.remove());
    }

    closeQuestionModalBtn.addEventListener('click', () => questionModal.style.display = 'none');
    questionTypeSelect.addEventListener('change', () => {
        const type = questionTypeSelect.value;
        const selectionTypes = ['seleccion_unica', 'seleccion_multiple'];
        const optionsTypes = ['seleccion_unica', 'seleccion_multiple', 'listado_definido'];

        optionsGroupDiv.style.display = optionsTypes.includes(type) ? 'block' : 'none';
        patternGroupDiv.style.display = type === 'texto' ? 'block' : 'none';
        dependentGroupDiv.style.display = type === 'seleccion_dependiente' ? 'block' : 'none';
        repartidorFieldsGroupDiv.style.display = type === 'repartidor' ? 'block' : 'none';

        enableQuantityGroupDiv.style.display = selectionTypes.includes(type) ? 'block' : 'none';
        if (!selectionTypes.includes(type)) {
            enableQuantityCheckbox.checked = false;
            quantityGroupDiv.style.display = 'none';
        }
    });
    addRepartidorSubQuestionBtn.addEventListener('click', () => addRepartidorSubQuestion());

    makeConditionalCheckbox.addEventListener('change', () => {
        conditionalGroupDiv.style.display = makeConditionalCheckbox.checked ? 'block' : 'none';
    });

    enableQuantityCheckbox.addEventListener('change', () => {
        quantityGroupDiv.style.display = enableQuantityCheckbox.checked ? 'block' : 'none';
    });

    repartidorSubQuestionsListDiv.addEventListener('change', e => {
        const item = e.target.closest('.repartidor-sub-question-item');
        if (!item) return;

        if (e.target.classList.contains('repartidor-sub-q-type')) {
            const optionsDiv = item.querySelector('.repartidor-sub-q-options');
            const patternDiv = item.querySelector('.repartidor-sub-q-pattern');
            const dependentDiv = item.querySelector('.repartidor-sub-q-dependent');
            const subQOptionsTypes = ['seleccion_unica', 'seleccion_multiple', 'listado_definido'];
            optionsDiv.style.display = subQOptionsTypes.includes(e.target.value) ? 'block' : 'none';
            patternDiv.style.display = e.target.value === 'texto' ? 'block' : 'none';
            dependentDiv.style.display = e.target.value === 'seleccion_dependiente' ? 'block' : 'none';
        }

        if (e.target.classList.contains('repartidor-sub-q-enable-quantity')) {
            const quantityGroup = item.querySelector('.repartidor-sub-q-quantity-group');
            if (quantityGroup) {
                quantityGroup.style.display = e.target.checked ? 'block' : 'none';
            }
        }
    });

    questionForm.addEventListener('submit', async e => {
        e.preventDefault();
        const text = questionTextInput.value.trim();
        const type = questionTypeSelect.value;
        if (!text || !type) return showAlert('Error', 'Texto y tipo son obligatorios.');
        
        let rules = {};
        const optionsTypes = ['seleccion_unica', 'seleccion_multiple', 'listado_definido'];
        if (type === 'texto') {
            const pattern = questionPatternInput.value.trim();
            if (pattern) rules.pattern = pattern;
        } else if (optionsTypes.includes(type)) {
            const opts = questionOptionsInput.value.trim();
            if (!opts) return showAlert('Error', 'Las opciones son obligatorias.');
            rules.options = opts.split(',').map(o => o.trim());
        } else if (type === 'seleccion_dependiente') {
            const parentField = dependentParentFieldInput.value.trim();
            const childField = dependentChildFieldInput.value.trim();
            if (!parentField || !childField) return showAlert('Error', 'Los campos padre e hijo son obligatorios para selección dependiente.');
            rules.dependent = { parentField, childField, table: 'geografia_colombia' };
        } else if (type === 'repartidor') {
            const subQuestions = [];
            const items = repartidorSubQuestionsListDiv.querySelectorAll('.repartidor-sub-question-item');
            for (const item of items) {
                const name = item.querySelector('.repartidor-sub-q-name').value.trim();
                const subType = item.querySelector('.repartidor-sub-q-type').value;
                if (!name || !subType) return showAlert('Error', 'Todas las sub-preguntas deben tener nombre y tipo.');
                const subQ = { name, type: subType, rules: {} };
                const subQOptionsTypes = ['seleccion_unica', 'seleccion_multiple', 'listado_definido'];

                if (subType === 'texto') {
                    const pattern = item.querySelector('.repartidor-sub-q-pattern-input').value.trim();
                    if (pattern) subQ.rules.pattern = pattern;
                } else if (subQOptionsTypes.includes(subType)) {
                    const opts = item.querySelector('.repartidor-sub-q-options-input').value.trim();
                    if (!opts) return showAlert('Error', `Las opciones para "${name}" son obligatorias.`);
                    subQ.rules.options = opts.split(',').map(o => o.trim());
                } else if (subType === 'seleccion_dependiente') {
                    const parentField = item.querySelector('.repartidor-sub-q-dependent-parent').value.trim();
                    const childField = item.querySelector('.repartidor-sub-q-dependent-child').value.trim();
                    if (!parentField || !childField) return showAlert('Error', `Los campos padre e hijo para "${name}" son obligatorios.`);
                    subQ.rules.dependent = { parentField, childField, table: 'geografia_colombia' };
                }

                const enableSubQQuantity = item.querySelector('.repartidor-sub-q-enable-quantity').checked;
                if (enableSubQQuantity) {
                    const min = parseInt(item.querySelector('.repartidor-sub-q-quantity-min').value, 10);
                    const max = parseInt(item.querySelector('.repartidor-sub-q-quantity-max').value, 10);
                    if (isNaN(min) || isNaN(max) || min < 1 || max < min) {
                        return showAlert('Error', `Los valores de cantidad para la sub-pregunta "${name}" no son válidos.`);
                    }
                    subQ.rules.quantity = { min, max };
                }

                const firstOnlyCheckbox = item.querySelector('.repartidor-sub-q-first-only');
                if (firstOnlyCheckbox && firstOnlyCheckbox.checked) {
                    subQ.firstItemOnly = true;
                }

                subQuestions.push(subQ);
            }
            if (subQuestions.length === 0) return showAlert('Error', 'El repartidor necesita al menos una sub-pregunta.');
            rules.subQuestions = subQuestions;
        }

        if (type !== 'repartidor' && enableQuantityCheckbox.checked) {
            const min = parseInt(quantityMinInput.value, 10);
            const max = parseInt(quantityMaxInput.value, 10);
            if (isNaN(min) || isNaN(max) || min < 1 || max < min) {
                return showAlert('Error', 'Los valores de cantidad mínima y máxima no son válidos.');
            }
            rules.quantity = { min, max };
        }

        if (makeConditionalCheckbox.checked) {
            const triggerQuestionText = conditionalTriggerQuestionSelect.value;
            const triggerValue = conditionalTriggerValueInput.value.trim();
            if (!triggerQuestionText || !triggerValue) {
                return showAlert('Error', 'Para una pregunta condicional, debes seleccionar la pregunta y el valor que la activan.');
            }
            rules.conditional = {
                triggerQuestionText,
                triggerValue,
                operator: 'equals'
            };
        }

        const questionData = { text, type, rules: JSON.stringify(rules) };

        try {
            if (editingQuestionId) {
                await api.updateQuestion(editingQuestionId, questionData);
                showAlert('Éxito', 'Pregunta actualizada correctamente.');
            } else {
                await api.createQuestion(currentModuleId, questionData);
                showAlert('Éxito', 'Pregunta creada correctamente.');
            }
            
            questionModal.style.display = 'none';
            await refreshFormsCache();
            loadQuestionsConfig(currentModuleId, currentModuleNameSpan.textContent);
        } catch (error) {
            showAlert('Error', 'No se pudo guardar la pregunta.');
        }
    });

    // --- LÓGICA PARA RELLENAR FORMULARIOS ---
    async function loadFormulariosForFilling() {
        formsRenderContainer.innerHTML = '';
        const forms = await api.getFormularios();
        formsListContainer.innerHTML = '';
        forms.forEach(f => { const btn = document.createElement('button'); btn.className = 'btn btn-secondary'; btn.textContent = f.name; btn.addEventListener('click', () => renderFormToFill(f, api)); formsListContainer.appendChild(btn); });
    }

    function renderFormToFill(form, api) {
        formsRenderContainer.innerHTML = `<h2>${form.name}</h2>`;
        const formEl = document.createElement('form');
        formEl.id = `form-to-fill-${form.id}`;
        const questions = [];
        (form.modulos || []).forEach(m => {
            const fieldset = document.createElement('fieldset');
            fieldset.innerHTML = `<legend>${m.name}</legend>`;
            (m.preguntas || []).forEach(q => { questions.push(q); fieldset.appendChild(createQuestionElement(q, false, 0, api)); });
            formEl.appendChild(fieldset);
        });
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-primary';
        submitBtn.textContent = 'Enviar Formulario';
        formEl.appendChild(submitBtn);
        formEl.addEventListener('submit', e => handleFormSubmit(e, form.id, questions));
        formsRenderContainer.appendChild(formEl);

        setupConditionalListeners(formEl);
    }

    function setupConditionalListeners(formEl) {
        const triggers = new Set();
        formEl.querySelectorAll('[data-conditional-trigger]').forEach(el => {
            triggers.add(el.dataset.conditionalTrigger);
        });

        triggers.forEach(triggerName => {
            const triggerWrapper = formEl.querySelector(`[data-question-name="${triggerName}"]`);
            if (triggerWrapper) {
                const input = triggerWrapper.querySelector('input, select');
                if (input) {
                    input.addEventListener('change', () => evaluateConditions(formEl));
                }
            }
        });
        evaluateConditions(formEl);
    }

    function evaluateConditions(formEl) {
        const currentValues = {};
        formEl.querySelectorAll('[data-question-name]').forEach(qWrapper => {
            const qName = qWrapper.dataset.questionName;
            const input = qWrapper.querySelector('input, select');
            if (input) {
                if (input.type === 'checkbox') {
                    currentValues[qName] = input.checked ? 'true' : 'false';
                } else {
                    currentValues[qName] = input.value;
                }
            }
        });

        formEl.querySelectorAll('[data-conditional-trigger]').forEach(el => {
            const triggerName = el.dataset.conditionalTrigger;
            const expectedValueString = el.dataset.conditionalValue;
            const actualValue = currentValues[triggerName];

            const possibleValues = expectedValueString.split(',').map(v => v.trim());

            if (possibleValues.includes(actualValue)) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });
    }

    function createQuestionElement(q, isSubQuestion = false, itemIndex = 0, api) {
        const questionName = q.text || q.name;
        const questionId = isSubQuestion ? `sub-q-${itemIndex}-${questionName.replace(/\s+/g, '-')}` : `q-${q.id}`;
        const rules = q.rules ? (typeof q.rules === 'string' ? JSON.parse(q.rules) : q.rules) : {};

        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.setAttribute('data-question-name', questionName);

        if (rules.conditional) {
            wrapper.style.display = 'none';
            wrapper.setAttribute('data-conditional-trigger', rules.conditional.triggerQuestionText);
            wrapper.setAttribute('data-conditional-value', rules.conditional.triggerValue);
        }

        if (q.type === 'repartidor') {
            wrapper.innerHTML = `<h4>${questionName}</h4>`;
            const container = document.createElement('div');
            container.id = `repartidor-container-${q.id}`;
            container.className = 'repartidor-main-container';
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'btn';
            addBtn.textContent = `Añadir a ${questionName}`;
            let repartidorItemCounter = 0;
            addBtn.addEventListener('click', () => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'repartidor-item';
                itemDiv.setAttribute('data-item-index', repartidorItemCounter);
                (rules.subQuestions || []).forEach(subQ => {
                    if (subQ.firstItemOnly && repartidorItemCounter > 0) {
                        return;
                    }
                    itemDiv.appendChild(createQuestionElement(subQ, true, repartidorItemCounter, api));
                });
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-danger btn-sm';
                removeBtn.textContent = 'Eliminar Item';
                removeBtn.addEventListener('click', () => itemDiv.remove());
                itemDiv.appendChild(removeBtn);
                container.appendChild(itemDiv);
                repartidorItemCounter++;
            });
            wrapper.appendChild(container);
            wrapper.appendChild(addBtn);
        } else {
            const label = document.createElement('label');
            label.setAttribute('for', questionId);
            label.textContent = questionName;
            
            const field = createField(q.type, questionId, rules, api);
            
            if (q.type === 'booleano' || q.type === 'terminos') {
                wrapper.appendChild(field);
                wrapper.appendChild(label);
            } else {
                wrapper.appendChild(label);
                wrapper.appendChild(field);
            }
        }
        return wrapper;
    }

    function createField(type, id, rules, api) {
        let inputEl;
        switch (type) {
            case 'numero': inputEl = document.createElement('input'); inputEl.type = 'number'; break;
            case 'fecha': inputEl = document.createElement('input'); inputEl.type = 'date'; break;
            case 'booleano': case 'terminos': inputEl = document.createElement('input'); inputEl.type = 'checkbox'; break;
            case 'listado_definido':
                inputEl = document.createElement('div');
                inputEl.className = 'defined-list-group';
                inputEl.id = id;
                (rules.options || []).forEach(opt => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'defined-list-item';
                    
                    const itemLabel = document.createElement('label');
                    itemLabel.textContent = opt;
                    itemLabel.style.marginRight = '10px';

                    const numInput = document.createElement('input');
                    numInput.type = 'number';
                    numInput.min = '0';
                    numInput.value = '0';
                    numInput.dataset.optionName = opt;
                    numInput.className = 'defined-list-input';

                    itemDiv.appendChild(itemLabel);
                    itemDiv.appendChild(numInput);
                    inputEl.appendChild(itemDiv);
                });
                break;
            case 'seleccion_unica':
                if (rules.quantity) {
                    inputEl = document.createElement('div');
                    inputEl.className = 'quantity-options-group';
                    (rules.options || []).forEach((opt, index) => {
                        const optionId = `${id}-${index}`;
                        const optionDiv = document.createElement('div');
                        optionDiv.className = 'quantity-option-item';
                        
                        const radioInput = document.createElement('input');
                        radioInput.type = 'radio';
                        radioInput.id = optionId;
                        radioInput.name = id;
                        radioInput.value = opt;

                        const radioLabel = document.createElement('label');
                        radioLabel.setAttribute('for', optionId);
                        radioLabel.textContent = opt;

                        const quantitySelect = document.createElement('select');
                        quantitySelect.id = `${optionId}-quantity`;
                        quantitySelect.className = 'quantity-selector';
                        quantitySelect.style.display = 'none';
                        for (let i = rules.quantity.min; i <= rules.quantity.max; i++) {
                            const qOpt = document.createElement('option');
                            qOpt.value = i;
                            qOpt.textContent = i;
                            quantitySelect.appendChild(qOpt);
                        }
                        
                        radioInput.addEventListener('change', () => {
                            inputEl.querySelectorAll('.quantity-selector').forEach(sel => sel.style.display = 'none');
                            if(radioInput.checked) {
                                quantitySelect.style.display = 'inline-block';
                            }
                        });

                        optionDiv.appendChild(radioInput);
                        optionDiv.appendChild(radioLabel);
                        optionDiv.appendChild(quantitySelect);
                        inputEl.appendChild(optionDiv);
                    });
                } else {
                    inputEl = document.createElement('select');
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Selecciona una opción';
                    defaultOption.disabled = true;
                    defaultOption.selected = true;
                    inputEl.appendChild(defaultOption);
                    (rules.options || []).forEach(opt => { const o = document.createElement('option'); o.value = opt; o.textContent = opt; inputEl.appendChild(o); });
                }
                break;
            case 'seleccion_multiple':
                inputEl = document.createElement('div');
                inputEl.className = 'checkbox-group';
                (rules.options || []).forEach((opt, index) => {
                    const checkDiv = document.createElement('div');
                    checkDiv.className = 'quantity-option-item';
                    const checkId = `${id}-${index}`;
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = checkId;
                    checkbox.name = id;
                    checkbox.value = opt;

                    const label = document.createElement('label');
                    label.setAttribute('for', checkId);
                    label.className = 'checkbox-label';
                    label.textContent = opt;
                    
                    checkDiv.appendChild(checkbox);
                    checkDiv.appendChild(label);

                    if (rules.quantity) {
                        const quantitySelect = document.createElement('select');
                        quantitySelect.id = `${checkId}-quantity`;
                        quantitySelect.className = 'quantity-selector';
                        quantitySelect.style.display = 'none';
                        for (let i = rules.quantity.min; i <= rules.quantity.max; i++) {
                            const qOpt = document.createElement('option');
                            qOpt.value = i;
                            qOpt.textContent = i;
                            quantitySelect.appendChild(qOpt);
                        }
                        checkbox.addEventListener('change', () => {
                            quantitySelect.style.display = checkbox.checked ? 'inline-block' : 'none';
                        });
                        checkDiv.appendChild(quantitySelect);
                    }
                    inputEl.appendChild(checkDiv);
                });
                break;
            case 'seleccion_dependiente':
                inputEl = document.createElement('div');
                inputEl.className = 'dependent-select-group';
                const parentSelect = document.createElement('select');
                parentSelect.id = `${id}-parent`;
                parentSelect.name = `${id}-parent`;
                parentSelect.innerHTML = '<option value="" disabled selected>Selecciona un Departamento</option>';
                api.getDepartamentos().then(departamentos => {
                    parentSelect.innerHTML = '<option value="" disabled selected>Selecciona un Departamento</option>';
                    (departamentos || []).forEach(dept => {
                        const opt = document.createElement('option');
                        opt.value = dept;
                        opt.textContent = dept;
                        parentSelect.appendChild(opt);
                    });
                }).catch(err => { console.error('Error cargando departamentos:', err); parentSelect.innerHTML = '<option value="" disabled selected>Error al cargar</option>'; });

                const childSelect = document.createElement('select');
                childSelect.id = `${id}-child`;
                childSelect.name = `${id}-child`;
                childSelect.innerHTML = '<option value="" disabled selected>Selecciona un Municipio</option>';

                parentSelect.addEventListener('change', async () => {
                    childSelect.innerHTML = '<option value="" disabled selected>Cargando Municipios...</option>';
                    const selectedDept = parentSelect.value;
                    if (selectedDept) {
                        try {
                            const municipios = await api.getMunicipios(selectedDept);
                            childSelect.innerHTML = '<option value="" disabled selected>Selecciona un Municipio</option>';
                            (municipios || []).forEach(mun => {
                                const opt = document.createElement('option');
                                opt.value = mun;
                                opt.textContent = mun;
                                childSelect.appendChild(opt);
                            });
                        } catch (err) { console.error('Error cargando municipios:', err); childSelect.innerHTML = '<option value="" disabled selected>Error al cargar</option>'; }
                    } else {
                        childSelect.innerHTML = '<option value="" disabled selected>Selecciona un Municipio</option>';
                    }
                });
                inputEl.appendChild(parentSelect);
                inputEl.appendChild(childSelect);
                break;
            default: inputEl = document.createElement('input'); inputEl.type = 'text'; break;
        }
        if (type !== 'seleccion_multiple' && type !== 'seleccion_dependiente' && !(type === 'seleccion_unica' && rules.quantity) && type !== 'listado_definido') { inputEl.id = id; inputEl.name = id; }
        if (type === 'texto' && rules.pattern) { inputEl.pattern = rules.pattern; inputEl.title = `Debe seguir el formato: ${rules.pattern}`}
        return inputEl;
    }

    async function handleFormSubmit(event, formId, questions) {
        event.preventDefault();
        const formEl = event.target;
        const respuestas = {};

        for (const q of questions) {
            const wrapper = formEl.querySelector(`[data-question-name="${q.text}"]`);
            if (wrapper && wrapper.style.display === 'none') {
                continue;
            }

            const questionName = q.text;
            const id = `q-${q.id}`;
            let questionValue;

            const rules = q.rules ? (typeof q.rules === 'string' ? JSON.parse(q.rules) : q.rules) : {};

            if (q.type === 'repartidor') {
                const repartidorItems = [];
                const container = formEl.querySelector(`#repartidor-container-${q.id}`);
                if (container) {
                    container.querySelectorAll('.repartidor-item').forEach(item => {
                        const itemData = {};
                        const subQuestions = rules.subQuestions || [];
                        subQuestions.forEach(subQ => {
                            const subId = `sub-q-${item.dataset.itemIndex}-${subQ.name.replace(/\s+/g, '-')}`;
                            const subInputWrapper = item.querySelector(`[data-question-name="${subQ.name}"]`);
                            const subQRules = subQ.rules || {};
                            let subValue;

                            if (subInputWrapper) {
                                if (subQ.type === 'seleccion_multiple') {
                                    const selected = [];
                                    subInputWrapper.querySelectorAll(`input[name="${subId}"]:checked`).forEach(input => {
                                        if (subQRules.quantity) {
                                            const quantitySelect = subInputWrapper.querySelector(`#${input.id}-quantity`);
                                            selected.push({ option: input.value, quantity: parseInt(quantitySelect.value, 10) || 0 });
                                        } else {
                                            selected.push(input.value);
                                        }
                                    });
                                    subValue = selected;
                                } else if (subQ.type === 'seleccion_unica') {
                                    const input = subInputWrapper.querySelector(`input[name="${subId}"]:checked`);
                                    if (input) {
                                        if (subQRules.quantity) {
                                            const quantitySelect = subInputWrapper.querySelector(`#${input.id}-quantity`);
                                            subValue = { option: input.value, quantity: parseInt(quantitySelect.value, 10) || 0 };
                                        } else {
                                            subValue = input.value;
                                        }
                                    } else {
                                        const selectInput = subInputWrapper.querySelector(`select[name="${subId}"]`);
                                        if(selectInput) subValue = selectInput.value;
                                    }
                                } else if (subQ.type === 'listado_definido') {
                                    const listData = {};
                                    const listContainer = subInputWrapper.querySelector(`#${subId}`);
                                    if (listContainer) {
                                        listContainer.querySelectorAll('.defined-list-input').forEach(input => {
                                            const optionName = input.dataset.optionName;
                                            const numValue = parseInt(input.value, 10);
                                            if (optionName && !isNaN(numValue)) {
                                                listData[optionName] = numValue;
                                            }
                                        });
                                    }
                                    subValue = listData;
                                } else if (subQ.type === 'seleccion_dependiente') {
                                    const parentVal = subInputWrapper.querySelector(`select[name="${subId}-parent"]`).value;
                                    const childVal = subInputWrapper.querySelector(`select[name="${subId}-child"]`).value;
                                    subValue = { parent: parentVal, child: childVal };
                                } else {
                                    const subInput = subInputWrapper.querySelector(`input[name="${subId}"], select[name="${subId}"], textarea[name="${subId}"]`);
                                    if (subInput) {
                                        subValue = (subInput.type === 'checkbox') ? subInput.checked : subInput.value;
                                    }
                                }
                            }
                            if (subValue !== undefined) {
                                itemData[subQ.name] = subValue;
                            }
                        });
                        repartidorItems.push(itemData);
                    });
                }
                questionValue = repartidorItems;
            } else if (q.type === 'listado_definido') {
                const listData = {};
                const container = formEl.querySelector(`#q-${q.id}`);
                if (container) {
                    container.querySelectorAll('.defined-list-input').forEach(input => {
                        const optionName = input.dataset.optionName;
                        const numValue = parseInt(input.value, 10);
                        if (optionName && !isNaN(numValue)) {
                            listData[optionName] = numValue;
                        }
                    });
                }
                questionValue = listData;
            } else if (q.type === 'seleccion_multiple') {
                const selected = [];
                formEl.querySelectorAll(`input[name="${id}"]:checked`).forEach(input => {
                    if (rules.quantity) {
                        const quantitySelect = formEl.querySelector(`#${input.id}-quantity`);
                        selected.push({ option: input.value, quantity: parseInt(quantitySelect.value, 10) });
                    } else {
                        selected.push(input.value);
                    }
                });
                questionValue = selected;
            } else if (q.type === 'seleccion_unica') {
                const input = formEl.querySelector(`input[name="${id}"]:checked`);
                if (input) {
                    if (rules.quantity) {
                        const quantitySelect = formEl.querySelector(`#${input.id}-quantity`);
                        questionValue = { option: input.value, quantity: parseInt(quantitySelect.value, 10) };
                    }
                } else {
                    const selectInput = formEl.querySelector(`select[name="${id}"]`);
                    if(selectInput) questionValue = selectInput.value;
                }
            } else if (q.type === 'seleccion_dependiente') {
                const parentVal = formEl.querySelector(`select[name="${id}-parent"]`).value;
                const childVal = formEl.querySelector(`select[name="${id}-child"]`).value;
                questionValue = { parent: parentVal, child: childVal };
            } else {
                const input = formEl.querySelector(`[name="${id}"]`);
                if (input) {
                    questionValue = (input.type === 'checkbox') ? input.checked : input.value;
                }
            }
            
            if (questionValue !== undefined && questionValue !== null && (questionValue.length === undefined || questionValue.length !== 0) ) {
                 respuestas[questionName] = questionValue;
            }
        }

        try {
            if (!currentUser || !currentUser.id) {
                return showAlert('Error de Autenticación', 'No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.');
            }
            await api.submitForm(formId, currentUser.id, respuestas);
            showAlert('Éxito', 'Formulario enviado correctamente.');
            loadFormulariosForFilling();
        } catch (error) {
            console.error('Error al enviar formulario:', error);
            showAlert('Error', 'No se pudo enviar el formulario. Detalles: ' + error.message);
        }
    }

    // --- LÓGICA DE MODAL DE ALERTA ---
    function showAlert(title, message) { alertTitle.textContent = title; alertMessage.textContent = message; alertModal.style.display = 'flex'; }
    alertOkButton.addEventListener('click', () => alertModal.style.display = 'none');
    alertCloseButton.addEventListener('click', () => alertModal.style.display = 'none');

    // --- LÓGICA DE EXPORTACIÓN A CSV ---
    function escapeCsvCell(cell) {
        if (cell === null || cell === undefined) {
            return '';
        }
        if (typeof cell === 'object') {
            cell = JSON.stringify(cell);
        }
        let str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            str = str.replace(/"/g, '""');
            return `"${str}"`;
        }
        return str;
    }

    function exportToCsv() {
        if (cachedSubmissions.length === 0) {
            return showAlert('Info', 'No hay datos para exportar.');
        }

        const headers = new Set(['ID de Envío', 'Fecha', 'Formulario', 'Usuario']);

        const flattenedData = cachedSubmissions.map(sub => {
            const flatRow = {
                'ID de Envío': sub.id,
                'Fecha': new Date(sub.created_at).toLocaleString(),
                'Formulario': sub.formularios ? sub.formularios.name : 'N/A',
                'Usuario': sub.usuarios ? sub.usuarios.email : 'N/A'
            };

            if (sub.respuestas) {
                for (const [key, value] of Object.entries(sub.respuestas)) {
                    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                        value.forEach(item => {
                            for (const [subKey, subValue] of Object.entries(item)) {
                                const headerName = `${key}.${subKey}`;
                                headers.add(headerName);
                            }
                        });
                    } else if (typeof value === 'object' && value !== null) {
                        for (const [subKey, subValue] of Object.entries(value)) {
                            const headerName = `${key}.${subKey}`;
                            headers.add(headerName);
                        }
                    } else {
                        headers.add(key);
                    }
                }
            }
            return flatRow;
        });

        const headerArray = [...headers];
        let csvContent = headerArray.map(escapeCsvCell).join(',') + '\r\n';

        cachedSubmissions.forEach(sub => {
            const baseRow = {
                'ID de Envío': sub.id,
                'Fecha': new Date(sub.created_at).toLocaleString(),
                'Formulario': sub.formularios ? sub.formularios.name : 'N/A',
                'Usuario': sub.usuarios ? sub.usuarios.email : 'N/A'
            };

            let hasRepartidor = false;
            const repartidorRows = [];

            if(sub.respuestas) {
                for (const [key, value] of Object.entries(sub.respuestas)) {
                    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                        hasRepartidor = true;
                        value.forEach(repartidorItem => {
                            const newRow = {...baseRow};
                            for(const h of headerArray) {
                                if(sub.respuestas[h]) newRow[h] = sub.respuestas[h];
                                if(repartidorItem[h.split('.')[1]]) newRow[h] = repartidorItem[h.split('.')[1]];
                            }
                            repartidorRows.push(headerArray.map(header => newRow[header] || '').map(escapeCsvCell).join(','));
                        });
                        break; 
                    }
                }
            }

            if (hasRepartidor) {
                csvContent += repartidorRows.join('\r\n') + '\r\n';
            } else {
                const rowValues = headerArray.map(header => {
                    let val = baseRow[header];
                    if(sub.respuestas && sub.respuestas[header]) {
                         val = sub.respuestas[header];
                    }
                    if (typeof val === 'object' && val !== null) {
                        val = JSON.stringify(val);
                    }
                    return escapeCsvCell(val);
                });
                csvContent += rowValues.join(',') + '\r\n';
            }
        });

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `export_formularios_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- INICIALIZACIÓN ---
    function init() { const user = sessionStorage.getItem('currentUser'); if (user) showApp(JSON.parse(user)); else showAuthPage(); }
    init();
});