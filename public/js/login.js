document.addEventListener('DOMContentLoaded', () => {
    // Verifica se o usuário já está logado
    fetch('/api/auth/session')
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                // Se já estiver logado, redireciona para a página apropriada
                window.location.href = data.user.perfil === 'admin' ? '/admin' : '/index';
            }
        })
        .catch(error => {
            console.error('Erro ao verificar sessão:', error);
        });

    const form = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const submitButton = form.querySelector('button[type="submit"]');
    const spinner = submitButton.querySelector('.spinner-border');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const user = form.elements.user.value;
        const senha = form.elements.senha.value;

        // Limpa mensagens anteriores
        messageDiv.innerHTML = '';
        messageDiv.className = 'mt-3';

        // Validação simples
        if (!user || !senha) {
            messageDiv.className = 'alert alert-warning';
            messageDiv.textContent = 'Por favor, preencha todos os campos.';
            return;
        }

        // Desativa o botão e mostra o spinner
        submitButton.disabled = true;
        spinner.classList.remove('d-none');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user, senha }),
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.className = 'alert alert-success';
                messageDiv.textContent = result.message;

                // Redireciona com base no perfil do usuário
                setTimeout(() => {
                    window.location.href = result.user.perfil === 'admin' ? '/admin' : '/index';
                }, 1500);
            } else {
                throw new Error(result.message || 'Ocorreu um erro.');
            }
        } catch (error) {
            messageDiv.className = 'alert alert-danger';
            messageDiv.textContent = error.message;
        } finally {
            // Reativa o botão e esconde o spinner
            submitButton.disabled = false;
            spinner.classList.add('d-none');
        }
    });
});
