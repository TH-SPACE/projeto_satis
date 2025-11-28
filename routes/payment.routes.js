const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const paymentController = require('../controllers/payment.controller');
const { isLoggedInApi, isAdmin } = require('../middleware/auth.middleware');

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Definindo as rotas e associando aos controllers
// Todas as rotas de pagamento agora exigem que o usuário esteja logado
router.post('/', isLoggedInApi, upload.array('proofImages', 10), paymentController.createPayment);
router.get('/:status', isLoggedInApi, paymentController.getPaymentsByStatus);

// Apenas administradores podem aprovar ou rejeitar pagamentos
router.put('/:id/approve', isLoggedInApi, isAdmin, paymentController.approvePayment);
router.put('/:id/reject', isLoggedInApi, isAdmin, paymentController.rejectPayment);

// Rota para exclusão de pagamentos pendentes (vendedor pode excluir os próprios pendentes)
router.delete('/:id', isLoggedInApi, paymentController.deletePayment);

module.exports = router;
