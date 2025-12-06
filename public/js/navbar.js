document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/session');
        const session = await response.json();

        if (session.loggedIn) {
            window.currentUser = session.user; // Store user data globally
            renderNavbar(session.user);
            addEventListeners(session.user);
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Erro ao buscar sessão:', error);
        window.location.href = '/login';
    }
});

function renderNavbar(user) {
    const adminMenu = user.perfil === 'admin' ? `
        <li><a class="dropdown-item" href="/admin" data-bs-toggle="modal" data-bs-target="#userManagementModal">Gerenciar Usuários</a></li>
    ` : '';

    // Menu principal da navbar
    let navbarMenu = `
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-person-circle me-1" viewBox="0 0 16 16"><path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/><path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/></svg>
                ${user.user}
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                ${adminMenu}
                <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#changePasswordModal">Alterar Senha</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" id="logout-btn" href="#">Logout</a></li>
            </ul>
        </li>
    `;

    // Adiciona o link para a página de envio para administradores
    if (user.perfil === 'admin') {
        navbarMenu = `
            <li class="nav-item">
                <a class="nav-link" href="/index">Página de Envio</a>
            </li>
        ` + navbarMenu;
    }

    const navbarHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
            <div class="container-fluid">
                <a class="navbar-brand fw-bold" href="/">Satismake</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#main-navbar" aria-controls="main-navbar" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="main-navbar">
                    <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                        ${navbarMenu}
                    </ul>
                </div>
            </div>
        </nav>
    `;

    let modalsHTML = `
        <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-labelledby="changePasswordModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="changePasswordModalLabel">Alterar Senha</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="changePasswordForm">
                            <div class="mb-3"><label for="oldPassword" class="form-label">Senha Antiga</label><input type="password" class="form-control" id="oldPassword" autocomplete="off" required></div>
                            <div class="mb-3"><label for="newPassword" class="form-label">Nova Senha</label><input type="password" class="form-control" id="newPassword" autocomplete="off" required></div>
                            <div class="mb-3"><label for="confirmNewPassword" class="form-label">Confirmar Nova Senha</label><input type="password" class="form-control" id="confirmNewPassword" autocomplete="off" required></div>
                            <div id="password-message" class="mt-3"></div>
                            <div class="modal-footer px-0 pb-0"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="submit" class="btn btn-primary">Salvar Alterações</button></div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (user.perfil === 'admin') {
        modalsHTML += `
            <div class="modal fade" id="userManagementModal" tabindex="-1" aria-labelledby="userManagementModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="userManagementModalLabel">Gerenciar Usuários</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="card mb-4">
                                <div class="card-header">Criar Novo Usuário</div>
                                <div class="card-body">
                                    <form id="createUserForm" autocomplete="off">
                                        <div class="row g-2">
                                            <div class="col-md"><input type="text" class="form-control" id="newUserName" placeholder="Nome de usuário" autocomplete="off" required></div>
                                            <div class="col-md"><input type="password" class="form-control" id="newUserPassword" placeholder="Senha" autocomplete="new-password" required></div>
                                            <div class="col-md">
                                                <select class="form-select" id="newUserProfile" autocomplete="off" required>
                                                    <option value="" selected disabled>Selecione o perfil</option>
                                                    <option value="vendedor">Vendedor</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                            <div class="col-md-auto"><button type="submit" class="btn btn-primary">Criar</button></div>
                                        </div>
                                        <div id="createUserMessage" class="mt-2"></div>
                                    </form>
                                </div>
                            </div>
                            <h6 class="mt-4">Usuários Existentes</h6>
                            <div id="user-list" class="list-group"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    document.body.insertAdjacentHTML('afterbegin', navbarHTML + modalsHTML);
}

function addEventListeners(user) {
    // Evento de Logout
    document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    });

    // Evento do formulário de Alteração de Senha
    document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        const messageDiv = document.getElementById('password-message');

        if (newPassword !== confirmNewPassword) {
            messageDiv.className = 'text-danger';
            messageDiv.textContent = 'As senhas novas não coincidem.';
            return;
        }

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const result = await response.json();

            if (response.ok) {
                messageDiv.className = 'text-success';
                messageDiv.textContent = result.message;
                document.getElementById('changePasswordForm').reset();
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                    modal.hide();
                }, 2000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            messageDiv.className = 'text-danger';
            messageDiv.textContent = error.message;
        }
    });

    if (user.perfil === 'admin') {
        const userManagementModal = document.getElementById('userManagementModal');
        const createUserForm = document.getElementById('createUserForm');

        // Carregar usuários quando o modal é aberto
        userManagementModal?.addEventListener('show.bs.modal', async () => {
            const userListDiv = document.getElementById('user-list');
            try {
                const response = await fetch('/api/auth/users');
                if (!response.ok) throw new Error('Falha ao carregar usuários.');
                const users = await response.json();

                userListDiv.innerHTML = '';
                if(users.length > 0) {
                    users.forEach(u => {
                        const userItem = document.createElement('div');
                        userItem.className = 'list-group-item d-flex justify-content-between align-items-center';

                        // Não mostrar botão de exclusão para o próprio usuário admin
                        const isCurrentUser = u.id === window.currentUser.id;
                        const deleteBtn = !isCurrentUser ?
                            `<button class="btn btn-sm btn-outline-danger delete-user-btn ms-2" data-user-id="${u.id}">Excluir</button>` :
                            '<span class="text-muted small">você</span>';

                        userItem.innerHTML = `<span>${u.user} <span class="badge bg-secondary">${u.perfil}</span></span> ${deleteBtn}`;
                        userListDiv.appendChild(userItem);
                    });

                    // Adicionar evento de clique para os botões de exclusão
                    document.querySelectorAll('.delete-user-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const userId = e.target.getAttribute('data-user-id');
                            const userName = e.target.closest('.list-group-item').querySelector('span').textContent.split(' ')[0];

                            if(confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
                                try {
                                    const response = await fetch(`/api/auth/user/${userId}`, {
                                        method: 'DELETE'
                                    });
                                    const result = await response.json();

                                    if(response.ok) {
                                        alert(result.message);
                                        // Recarregar a lista de usuários
                                        userManagementModal.dispatchEvent(new Event('show.bs.modal'));
                                    } else {
                                        alert(`Erro: ${result.message}`);
                                    }
                                } catch (error) {
                                    alert(`Erro na requisição: ${error.message}`);
                                }
                            }
                        });
                    });
                } else {
                    userListDiv.innerHTML = '<p class="text-muted">Nenhum usuário encontrado.</p>';
                }
            } catch (error) {
                userListDiv.innerHTML = `<p class="text-danger">${error.message}</p>`;
            }
        });

        // Evento de criação de usuário
        createUserForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUserName = document.getElementById('newUserName').value;
            const newUserPassword = document.getElementById('newUserPassword').value;
            const newUserProfile = document.getElementById('newUserProfile').value;
            const messageDiv = document.getElementById('createUserMessage');

            try {
                const response = await fetch('/api/auth/create-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: newUserName, senha: newUserPassword, perfil: newUserProfile })
                });
                const result = await response.json();

                if (response.ok) {
                    messageDiv.className = 'text-success small';
                    messageDiv.textContent = result.message;
                    createUserForm.reset();
                    // Dispara o evento de show para recarregar a lista
                    userManagementModal.dispatchEvent(new Event('show.bs.modal'));
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                messageDiv.className = 'text-danger small';
                messageDiv.textContent = error.message;
            }
        });
    }
}