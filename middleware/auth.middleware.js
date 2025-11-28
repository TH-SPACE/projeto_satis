// Middleware para verificar se o usuário está logado (para rotas de API)
const isLoggedInApi = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Acesso não autorizado. Por favor, faça login.' });
    }
    next();
};

// Middleware para verificar se o usuário é um administrador
const isAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.perfil !== 'admin') {
        return res.status(403).json({ message: 'Acesso proibido. Requer perfil de administrador.' });
    }
    next();
};

module.exports = {
    isLoggedInApi,
    isAdmin
};
