document.addEventListener('DOMContentLoaded', async () => {
    // Elementos das abas principais
    const sendTab = document.getElementById("send-tab");
    const submissionsTab = document.getElementById("submissions-tab");
    const sendSection = document.getElementById("send-section");
    const submissionsSection = document.getElementById("submissions-section");

    // Elementos da seção de envios
    const statusTabs = document.getElementById("status-tabs");
    const paymentsList = document.getElementById("payments-list");
    const loadingIndicator = document.getElementById("loading");
    const emptyMessage = document.getElementById("empty-message");
    const cardTemplate = document.getElementById("payment-card-template");

    // Elementos do Modal e Carrossel
    const modalTitle = document.querySelector("#imageModalLabel");
    const carouselIndicators = document.querySelector(
        "#imageCarousel .carousel-indicators"
    );
    const carouselInner = document.querySelector(
        "#imageCarousel .carousel-inner"
    );

    // Elementos do formulário de envio
    const form = document.getElementById('paymentForm');
    const orderIdInput = document.getElementById('orderId');
    const messageDiv = document.getElementById('message');
    const submitButton = form.querySelector('button[type="submit"]');
    const spinner = submitButton.querySelector('.spinner-border');

    const pasteZone = document.getElementById('paste-zone');
    const fileInput = document.getElementById('proofImages');
    const previewsContainer = document.getElementById('previews');

    let currentStatus = "pending";
    let stagedFiles = [];

    // Função para alternar entre as abas principais
    function switchTab(tabName) {
        if (tabName === "send") {
            sendTab.classList.add("active");
            submissionsTab.classList.remove("active");
            sendSection.classList.remove("d-none");
            submissionsSection.classList.add("d-none");
        } else if (tabName === "submissions") {
            submissionsTab.classList.add("active");
            sendTab.classList.remove("active");
            submissionsSection.classList.remove("d-none");
            sendSection.classList.add("d-none");
            // Carregar os pagamentos quando a aba for ativada
            fetchPayments(currentStatus);
        }
    }

    // Eventos para alternar entre abas principais
    sendTab?.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab("send");
    });

    submissionsTab?.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab("submissions");
    });

    // Função para buscar pagamentos por status
    async function fetchPayments(status) {
        loadingIndicator.classList.remove("d-none");
        emptyMessage.classList.add("d-none");
        paymentsList.innerHTML = "";

        try {
            const response = await fetch(`/api/payments/${status}`);
            if (!response.ok) throw new Error("Falha ao carregar os dados.");

            const payments = await response.json();

            if (payments.length === 0) {
                emptyMessage.classList.remove("d-none");
            } else {
                payments.forEach(createPaymentCard);
            }
        } catch (error) {
            paymentsList.innerHTML = `<div class="col"><div class="alert alert-danger">${error.message}</div></div>`;
        } finally {
            loadingIndicator.classList.add("d-none");
        }
    }

    function createPaymentCard(payment) {
        const cardClone = cardTemplate.content.cloneNode(true);
        const cardElement = cardClone.querySelector(".payment-card").parentElement; // O elemento a ser removido é a div da coluna

        cardElement.querySelector(".payment-card").dataset.id = payment.id;
        cardElement
            .querySelector(".payment-card")
            .classList.add(`border-start-${payment.status}`);

        cardClone.querySelector(".order-id").textContent = payment.orderId;
        cardClone.querySelector(".timestamp").textContent = new Date(
            payment.createdAt
        ).toLocaleString("pt-BR");

        const viewProofBtn = cardClone.querySelector(".view-proof-btn");
        viewProofBtn.addEventListener("click", () => {
            modalTitle.textContent = `Comprovantes do Pedido #${payment.orderId}`;

            // Limpa o carrossel anterior
            carouselIndicators.innerHTML = "";
            carouselInner.innerHTML = "";

            try {
                const filePaths = JSON.parse(payment.proofImagePath);

                filePaths.forEach((path, index) => {
                    const safePath = path.replace(/\\/g, "/");

                    // Cria o indicador
                    const indicator = document.createElement("button");
                    indicator.type = "button";
                    indicator.dataset.bsTarget = "#imageCarousel";
                    indicator.dataset.bsSlideTo = index;
                    if (index === 0) indicator.classList.add("active");

                    // Cria o item do carrossel
                    const carouselItem = document.createElement("div");
                    carouselItem.className =
                        "carousel-item" + (index === 0 ? " active" : "");

                    let proofElement;
                    if (safePath.toLowerCase().endsWith('.pdf')) {
                        proofElement = document.createElement("object");
                        proofElement.data = safePath;
                        proofElement.type = "application/pdf";
                        proofElement.className = "d-block w-100";
                        proofElement.style.height = "70vh";

                        const fallbackLink = document.createElement('a');
                        fallbackLink.href = safePath;
                        fallbackLink.textContent = 'Não foi possível exibir o PDF. Clique aqui para abrir em uma nova aba.';
                        fallbackLink.target = '_blank';
                        fallbackLink.className = 'btn btn-outline-primary mt-3';
                        proofElement.appendChild(fallbackLink);

                    } else {
                        proofElement = document.createElement("img");
                        proofElement.src = safePath;
                        proofElement.className = "d-block w-100 modal-img";
                        proofElement.alt = `Comprovante ${index + 1}`;
                    }

                    carouselItem.appendChild(proofElement);
                    carouselIndicators.appendChild(indicator);
                    carouselInner.appendChild(carouselItem);
                });
            } catch (e) {
                // Se o JSON for inválido ou for um caminho de imagem antigo (string simples)
                const carouselItem = document.createElement("div");
                carouselItem.className = "carousel-item active";
                const img = document.createElement("img");
                img.src = payment.proofImagePath.replace(/\\/g, "/");
                img.className = "d-block w-100 modal-img";
                img.alt = "Comprovante";
                carouselItem.appendChild(img);
                carouselInner.appendChild(carouselItem);
            }
        });

        const deleteBtn = cardClone.querySelector(".delete-btn");

        // Verifica se o usuário pode excluir o pagamento
        if (window.currentUser) {
            // O botão de exclusão só aparece se for o próprio usuário ou admin
            // e o pagamento estiver pendente
            const canDelete = (window.currentUser.perfil === 'admin' ||
                            (payment.userId === window.currentUser.id && payment.status === "pending"));

            if (!canDelete) {
                deleteBtn.remove();
            } else {
                deleteBtn.addEventListener("click", () =>
                    handleDelete(payment.id, payment.status, payment.userId, cardElement)
                );
            }
        } else {
            deleteBtn.remove();
        }

        paymentsList.appendChild(cardClone);
    }

    async function handleDelete(id, status, userId, cardElement) {
        // Verificar permissão: admin ou vendedor pode excluir se for pendente
        // Vendedores só podem excluir seus próprios pagamentos pendentes
        if (window.currentUser.perfil === 'admin' ||
            (window.currentUser.perfil === 'vendedor' &&
            userId === window.currentUser.id &&
            status === "pending")) {

            if (confirm("Tem certeza que deseja excluir este envio?")) {
                const button = cardElement.querySelector('.delete-btn');
                button.disabled = true;
                button.innerHTML =
                    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

                try {
                    const response = await fetch(`/api/payments/${id}`, {
                        method: "DELETE",
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message);
                    }

                    cardElement.style.transition = "opacity 0.5s ease";
                    cardElement.style.opacity = "0";
                    setTimeout(() => {
                        cardElement.remove();
                        if (paymentsList.childElementCount === 0) {
                            emptyMessage.classList.remove("d-none");
                        }
                    }, 500);
                } catch (error) {
                    alert(error.message);
                    button.disabled = false;
                    button.textContent = "Excluir";
                }
            }
        } else {
            alert("Você não tem permissão para excluir este envio.");
        }
    }

    // Evento para alternar entre abas de status
    statusTabs?.addEventListener("click", (event) => {
        event.preventDefault();
        if (event.target.tagName === 'A') {
            const navLink = event.target;
            const newStatus = navLink.dataset.status;

            if (newStatus && newStatus !== currentStatus) {
                statusTabs.querySelector(".active").classList.remove("active");
                navLink.classList.add("active");
                currentStatus = newStatus;
                fetchPayments(currentStatus);
            }
        }
    });

    // Função para renderizar as pré-visualizações
    function renderPreviews() {
        previewsContainer.innerHTML = '';
        stagedFiles.forEach((file, index) => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'position-relative';

            let previewElement;
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.height = 100;
                img.className = 'rounded border';
                img.onload = () => URL.revokeObjectURL(img.src);
                previewElement = img;
            } else { // Para PDFs e outros tipos
                previewElement = document.createElement('div');
                previewElement.className = 'rounded border p-2 d-flex flex-column justify-content-center align-items-center';
                previewElement.style.height = '100px';
                previewElement.style.width = '100px';

                const pdfIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-danger"><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"></path></svg>`;
                const fileName = document.createElement('span');
                fileName.className = 'text-muted small text-truncate';
                fileName.style.maxWidth = '90px';
                fileName.textContent = file.name;

                previewElement.innerHTML = pdfIcon;
                previewElement.appendChild(fileName);
            }

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn-danger btn-sm position-absolute top-0 start-100 translate-middle rounded-circle p-0 lh-1';
            removeBtn.innerHTML = '&times;';
            removeBtn.style.width = '1.5rem';
            removeBtn.style.height = '1.5rem';
            removeBtn.onclick = () => {
                stagedFiles.splice(index, 1);
                renderPreviews();
            };

            previewWrapper.appendChild(previewElement);
            previewWrapper.appendChild(removeBtn);
            previewsContainer.appendChild(previewWrapper);
        });

        // Atualiza a validação do input de arquivo
        fileInput.required = stagedFiles.length === 0;
    }

    // A funcionalidade de clique é tratada pelo <label for="proofImages"> no HTML.
    // O listener de clique explícito foi removido para evitar a abertura dupla do seletor de arquivos.

    // Adiciona arquivos do seletor
    fileInput.addEventListener('change', () => {
        stagedFiles.push(...fileInput.files);
        renderPreviews();
        fileInput.value = ''; // Limpa o input para permitir selecionar os mesmos arquivos novamente
    });

    // Impede comportamentos padrão de drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        pasteZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    // Destaca a zona ao arrastar arquivos
    ['dragenter', 'dragover'].forEach(eventName => {
        pasteZone.addEventListener(eventName, () => pasteZone.classList.add('bg-primary-subtle'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        pasteZone.addEventListener(eventName, () => pasteZone.classList.remove('bg-primary-subtle'), false);
    });

    // Adiciona arquivos do drop
    pasteZone.addEventListener('drop', (e) => {
        const allowedFiles = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/') || file.type === 'application/pdf'
        );
        stagedFiles.push(...allowedFiles);
        renderPreviews();
    });

    // Adiciona arquivos colados (Ctrl+V)
    pasteZone.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image/') || item.type === 'application/pdf') {
                const file = item.getAsFile();
                if (file) {
                    stagedFiles.push(file);
                }
            }
        }
        renderPreviews();
    });

    // Lógica de envio do formulário
    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        event.stopPropagation();

        // Validação manual
        let isValid = true;
        if (!orderIdInput.value) {
            orderIdInput.classList.add('is-invalid');
            isValid = false;
        } else {
            orderIdInput.classList.remove('is-invalid');
        }

        if (stagedFiles.length === 0) {
            pasteZone.classList.add('border-danger');
            isValid = false;
        } else {
            pasteZone.classList.remove('border-danger');
        }

        if (!isValid) return;

        // Desativa o botão e mostra o spinner
        submitButton.disabled = true;
        spinner.classList.remove('d-none');
        messageDiv.innerHTML = '';
        messageDiv.className = 'mt-4';

        const formData = new FormData();
        formData.append('orderId', orderIdInput.value);
        stagedFiles.forEach(file => {
            formData.append('proofImages', file);
        });

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.className = 'alert alert-success';
                messageDiv.textContent = result.message + ` (ID do Pagamento: ${result.paymentId})`;
                form.reset();
                stagedFiles = [];
                renderPreviews();
                orderIdInput.classList.remove('is-invalid');
                pasteZone.classList.remove('border-danger');
            } else {
                throw new Error(result.message || 'Ocorreu um erro.');
            }
        } catch (error) {
            messageDiv.className = 'alert alert-danger';
            messageDiv.textContent = 'Erro ao enviar: ' + error.message;
        } finally {
            // Reativa o botão e esconde o spinner
            submitButton.disabled = false;
            spinner.classList.add('d-none');
        }
    });

    // Aguardar o carregamento do navbar e inicializar as abas
    let attempts = 0;
    const maxAttempts = 10;
    const waitForUser = () => {
        if (window.currentUser) {
            // Inicializa com a aba "Enviar Comprovante" ativa
            switchTab("send");
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(waitForUser, 200);
        } else {
            console.warn("Não foi possível obter os dados do usuário.");
        }
    };
    waitForUser();
});