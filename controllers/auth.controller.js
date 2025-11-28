const { pool } = require('../database');
const bcrypt = require('bcrypt');

const login = async (req, res) => {
    const { user, senha } = req.body;

    if (!user || !senha) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE user = ?', [user]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const usuario = rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Atualiza o último login
        await pool.query('UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?', [usuario.id]);

        // Armazena dados do usuário na sessão (sem a senha)
        req.session.user = {
            id: usuario.id,
            user: usuario.user,
            perfil: usuario.perfil
        };

        res.status(200).json({ message: 'Login bem-sucedido!', user: req.session.user });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Não foi possível fazer logout.' });
        }
        res.clearCookie('connect.sid'); // Limpa o cookie da sessão
        res.status(200).json({ message: 'Logout bem-sucedido.' });
    });
};

const changePassword = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }

    const { oldPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Senha antiga e nova são obrigatórias.' });
    }

    try {
        const [rows] = await pool.query('SELECT senha FROM usuarios WHERE id = ?', [userId]);
        const usuario = rows[0];

        const senhaAntigaValida = await bcrypt.compare(oldPassword, usuario.senha);
        if (!senhaAntigaValida) {
            return res.status(401).json({ message: 'Senha antiga incorreta.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await pool.query('UPDATE usuarios SET senha = ? WHERE id = ?', [hashedPassword, userId]);

        res.status(200).json({ message: 'Senha alterada com sucesso.' });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const getSession = (req, res) => {
    if (req.session.user) {
        res.status(200).json({ loggedIn: true, user: req.session.user });
    } else {
        res.status(200).json({ loggedIn: false });
    }
};

const getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, user, perfil, ultimo_login, createdAt FROM usuarios ORDER BY user ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const createUser = async (req, res) => {
    const { user, senha, perfil } = req.body;

    if (!user || !senha || !perfil) {
        return res.status(400).json({ message: 'Usuário, senha e perfil são obrigatórios.' });
    }
     if (!['admin', 'vendedor'].includes(perfil)) {
        return res.status(400).json({ message: 'Perfil inválido. Use "admin" ou "vendedor".' });
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(senha, saltRounds);

        const [result] = await pool.query(
            'INSERT INTO usuarios (user, senha, perfil) VALUES (?, ?, ?)',
            [user, hashedPassword, perfil]
        );

        res.status(201).json({ message: 'Usuário criado com sucesso!', userId: result.insertId });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este nome de usuário já existe.' });
        }
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.session.user.id;

    if (parseInt(id, 10) === adminUserId) {
        return res.status(403).json({ message: 'Não é possível excluir o próprio usuário.' });
    }

    try {
        const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    login,
    logout,
    changePassword,
    getSession,
    getUsers,
    createUser,
    deleteUser
};
