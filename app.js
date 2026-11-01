// URL base de tu API en Node.js y Express (Asegúrate de que coincida con el puerto de tu backend)
const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Verificar si ya hay una sesión activa al cargar la página
    const token = localStorage.getItem('token');
    if (token) {
        showDashboard();
        loadContacts();
        setupUserInfo();
    } else {
        showLogin();
    }

    initEventListeners();
});

/* ==========================================
   1. GESTIÓN DE PANTALLAS Y NAVEGACIÓN SPA
   ================================---------- */
function showLogin() {
    document.getElementById('loginSection').classList.add('active');
    document.getElementById('registerSection').classList.remove('active');
    document.getElementById('dashboardSection').classList.remove('active');
}

function showRegister() {
    document.getElementById('loginSection').classList.remove('active');
    document.getElementById('registerSection').classList.add('active');
    document.getElementById('dashboardSection').classList.remove('active');
}

function showDashboard() {
    document.getElementById('loginSection').classList.remove('active');
    document.getElementById('registerSection').classList.remove('active');
    document.getElementById('dashboardSection').classList.add('active');
}

function setupUserInfo() {
    const userName = localStorage.getItem('userName') || 'Usuario';
    document.getElementById('userName').textContent = userName;
    const initial = userName.charAt(0).toUpperCase();
    document.getElementById('userAvatar').textContent = initial;
}

/* ==========================================
   2. EVENT LISTENERS
   ================================---------- */
let contactToDeleteId = null;

function initEventListeners() {
    // Cambiar entre Login y Registro
    document.getElementById('showRegisterLink').addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });

    document.getElementById('showLoginLink').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });

    // Submit del Formulario de Login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await handleLogin(email, password);
    });

    // Submit del Formulario de Registro
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        await handleRegister(name, email, password);
    });

    // Botón de Cerrar Sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        showLogin();
        showToast('Sesión cerrada correctamente', 'success');
    });

    // Botón Nuevo Contacto (Abre Modal)
    document.getElementById('addContactBtn').addEventListener('click', () => {
        openContactModal();
    });

    // Cerrar Modales
    document.querySelectorAll('.close-modal, #cancelDeleteBtn').forEach(el => {
        el.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // Submit del Formulario de Contacto (Crear / Editar)
    document.getElementById('contactForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSaveContact();
    });

    // Confirmar Eliminación
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        if (contactToDeleteId) {
            await handleDeleteContact(contactToDeleteId);
        }
    });

    // Búsqueda en tiempo real y Filtros
    document.getElementById('searchInput').addEventListener('input', filterAndRenderContacts);
    document.getElementById('categoryFilter').addEventListener('change', filterAndRenderContacts);
}

/* ==========================================
   3. AUTENTICACIÓN (LOGIN Y REGISTRO)
   ================================---------- */
async function handleLogin(email, password) {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');

        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);

        showDashboard();
        setupUserInfo();
        loadContacts();
        showToast('¡Bienvenido de nuevo!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRegister(name, email, password) {
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Error en el registro');

        showToast('¡Registro exitoso! Por favor inicia sesión.', 'success');
        showLogin();
        document.getElementById('registerForm').reset();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

/* ==========================================
   4. GESTIÓN DE CONTACTOS (CRUD)
   ================================---------- */
let allContacts = [];

async function loadContacts() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/contacts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401 || res.status === 403) {
            localStorage.clear();
            showLogin();
            showToast('Sesión expirada. Inicia sesión nuevamente.', 'error');
            return;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al cargar contactos');

        allContacts = data;
        filterAndRenderContacts();
        updateStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSaveContact() {
    const id = document.getElementById('contactId').value;
    const contactData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        phone: document.getElementById('contactPhone').value,
        category: document.getElementById('contactCategory').value,
        status: document.getElementById('contactStatus').value
    };

    const token = localStorage.getItem('token');
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/contacts/${id}` : `${API_URL}/contacts`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(contactData)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al guardar el contacto');

        closeAllModals();
        loadContacts();
        showToast(id ? 'Contacto actualizado con éxito' : 'Contacto creado con éxito', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleDeleteContact(id) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/contacts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al eliminar');

        closeAllModals();
        loadContacts();
        showToast('Contacto eliminado correctamente', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function toggleFavorite(id, currentFavoriteState) {
    const contact = allContacts.find(c => c.id === id);
    if (!contact) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/contacts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                category: contact.category,
                status: contact.status,
                is_favorite: currentFavoriteState ? 0 : 1
            })
        });

        if (!res.ok) throw new Error('Error al actualizar favorito');
        loadContacts();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

/* ==========================================
   5. RENDERIZADO Y FILTRADO EN UI
   ================================---------- */
function filterAndRenderContacts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;

    const filtered = allContacts.filter(contact => {
        const matchesSearch = 
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.email.toLowerCase().includes(searchTerm) ||
            contact.phone.toLowerCase().includes(searchTerm);
        
        const matchesCategory = categoryFilter === 'all' || contact.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    renderTable(filtered);
}

function renderTable(contacts) {
    const tbody = document.getElementById('contactsTableBody');
    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';

    if (contacts.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    contacts.forEach(contact => {
        const initial = contact.name.charAt(0).toUpperCase();
        const isFav = contact.is_favorite === 1;
        const statusClass = contact.status === 'Activo' ? 'badge-active' : 'badge-inactive';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="contact-cell">
                    <button class="btn-star ${isFav ? 'active' : ''}" onclick="toggleFavorite(${contact.id}, ${isFav})">
                        <i data-lucide="star"></i>
                    </button>
                    <div class="contact-avatar">${initial}</div>
                    <div>
                        <div class="contact-name">${contact.name}</div>
                        <div class="contact-email">${contact.email}</div>
                    </div>
                </div>
            </td>
            <td>${contact.phone}</td>
            <td><span class="badge badge-tag">${contact.category}</span></td>
            <td><span class="badge ${statusClass}">${contact.status}</span></td>
            <td class="text-right">
                <div class="actions-cell">
                    <button class="btn btn-icon btn-secondary" onclick="openContactModal(${contact.id})" title="Editar">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn btn-icon btn-danger" onclick="openDeleteModal(${contact.id})" title="Eliminar">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function updateStats() {
    const total = allContacts.length;
    const favorites = allContacts.filter(c => c.is_favorite === 1).length;
    const workOrClients = allContacts.filter(c => c.category === 'Trabajo' || c.category === 'Cliente').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('favCount').textContent = favorites;
    document.getElementById('workCount').textContent = workOrClients;
}

/* ==========================================
   6. CONTROL DE MODALES Y TOASTS
   ================================---------- */
function openContactModal(id = null) {
    const modal = document.getElementById('contactModal');
    const form = document.getElementById('contactForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('contactId').value = '';

    if (id) {
        title.textContent = 'Editar Contacto';
        const contact = allContacts.find(c => c.id === id);
        if (contact) {
            document.getElementById('contactId').value = contact.id;
            document.getElementById('contactName').value = contact.name;
            document.getElementById('contactEmail').value = contact.email;
            document.getElementById('contactPhone').value = contact.phone;
            document.getElementById('contactCategory').value = contact.category;
            document.getElementById('contactStatus').value = contact.status;
        }
    } else {
        title.textContent = 'Nuevo Contacto';
    }

    modal.classList.add('active');
}

function openDeleteModal(id) {
    contactToDeleteId = id;
    document.getElementById('deleteModal').classList.add('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
        modal.classList.remove('active');
    });
    contactToDeleteId = null;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    
    if (type === 'success') {
        toast.style.background = '#0f172a';
    } else {
        toast.style.background = '#dc2626';
    }

    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

