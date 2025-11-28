document.addEventListener("DOMContentLoaded", () => {
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

  let currentStatus = "pending";

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

    const approveBtn = cardClone.querySelector(".approve-btn");
    const rejectBtn = cardClone.querySelector(".reject-btn");
    const deleteBtn = cardClone.querySelector(".delete-btn");

    // Verifica o perfil do usuário para mostrar os botões de ação
    if (window.currentUser) {
      // Apenas admins veem os botões de aprovar/rejeitar
      if (window.currentUser.perfil === 'admin') {
        if (payment.status !== "pending") {
          approveBtn.remove();
          rejectBtn.remove();
        } else {
          approveBtn.addEventListener("click", () =>
            handleAction(payment.id, "approve", cardElement)
          );
          rejectBtn.addEventListener("click", () =>
            handleAction(payment.id, "reject", cardElement)
          );
        }

        // Botão de exclusão para admins (qualquer envio pendente)
        deleteBtn.addEventListener("click", () =>
          handleDelete(payment.id, payment.status, payment.userId, cardElement)
        );
      } else {
        // Se for vendedor, remove os botões de aprovar/rejeitar e o de exclusão
        approveBtn.remove();
        rejectBtn.remove();
        deleteBtn.remove();
      }
    } else {
      // Se não estiver logado, remove todos os botões de ação
      approveBtn.remove();
      rejectBtn.remove();
      deleteBtn.remove();
    }

    paymentsList.appendChild(cardClone);
  }

  async function handleAction(id, action, cardElement) {
    const button = cardElement.querySelector(`.${action}-btn`);
    button.disabled = true;
    button.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

    try {
      const response = await fetch(`/api/payments/${id}/${action}`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error(`Falha ao ${action}r.`);

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
      button.textContent = action.charAt(0).toUpperCase() + action.slice(1);
    }
  }

  async function handleDelete(id, status, userId, cardElement) {
    // Apenas admins podem excluir
    if (window.currentUser.perfil === 'admin') {
      if (confirm("Tem certeza que deseja excluir este pagamento?")) {
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
      alert("Você não tem permissão para excluir este pagamento.");
    }
  }

  statusTabs.addEventListener("click", (event) => {
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

  // Garante que a sessão (e window.currentUser) foi carregada antes de buscar os pagamentos
  if (window.currentUser) {
    fetchPayments("pending");
  } else {
    // Adiciona um pequeno delay para esperar o navbar.js carregar, se necessário
    setTimeout(() => {
        if(window.currentUser) {
            fetchPayments("pending");
        } else {
            // Se ainda não estiver definido, pode ser um erro ou o usuário não está logado
            window.location.href = '/login';
        }
    }, 200);
  }
});
