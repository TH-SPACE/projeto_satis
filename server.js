require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializa o banco de dados ao iniciar o servidor
initializeDatabase();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração da Sessão
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use cookie seguro em produção
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  }
}));

// Middleware de proteção de rotas de página
app.use((req, res, next) => {
    const isAuthPage = req.path.startsWith('/login') || req.path.startsWith('/api/auth');
    const isStaticAsset = req.path.includes('.') && !req.path.endsWith('.html');

    // Se não estiver logado e tentando acessar uma página protegida
    if (!req.session.user && !isAuthPage && !isStaticAsset) {
        // Redireciona para o login, exceto para a própria página de login e assets
        if (req.path !== '/login.html') {
           return res.redirect('/login');
        }
    }

    // Se logado e tentando acessar a página de login, redireciona para a home
    if (req.session.user && req.path === '/login.html') {
        return res.redirect('/');
    }

    next();
});

// Rota para a página de login
app.get('/login', (req, res) => {
    if (req.session.user) {
        // Se já estiver logado, redirecione para a página inicial apropriada
        return res.redirect(req.session.user.perfil === 'admin' ? '/admin' : '/index');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota raiz redireciona para a página correta se logado
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    // Redireciona para a página principal baseada no perfil
    return res.redirect(req.session.user.perfil === 'admin' ? '/admin' : '/index');
});

// Rota para a página de administração
app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.perfil !== 'admin') {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Rota para a página principal (envio de comprovantes)
app.get('/index', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Servir arquivos estáticos da pasta 'public' (para HTML, CSS, JS do frontend)
app.use(express.static(path.join(__dirname, 'public')));
// Servir arquivos da pasta 'uploads' para que as imagens possam ser visualizadas no frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importa e usa as rotas da API
const paymentRoutes = require('./routes/payment.routes');
const authRoutes = require('./routes/auth.routes');

app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
