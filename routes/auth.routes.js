const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { isLoggedInApi, isAdmin } = require('../middleware/auth.middleware');

// Rota de Login
router.post('/login', authController.login);

// Rota de Logout
router.post('/logout', authController.logout);

// Rota para alterar a senha do usuário logado
router.post('/change-password', isLoggedInApi, authController.changePassword);

// Rota para verificar o estado da sessão
router.get('/session', authController.getSession);

// Rotas de gerenciamento de usuários (apenas para admin)
router.get('/users', isLoggedInApi, isAdmin, authController.getUsers);
router.post('/create-user', isLoggedInApi, isAdmin, authController.createUser);
router.delete('/user/:id', isLoggedInApi, isAdmin, authController.deleteUser);

module.exports = router;
