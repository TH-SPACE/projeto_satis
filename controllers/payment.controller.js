const { pool } = require('../database');

const createPayment = async (req, res) => {
    const { orderId } = req.body;
    const files = req.files;

    if (!orderId || !files || files.length === 0) {
        return res.status(400).json({ message: 'Número do pedido e ao menos um comprovante são obrigatórios.' });
    }

    try {
        const proofImagePaths = files.map(file => file.path);
        const proofImagePathsJson = JSON.stringify(proofImagePaths);

        const [result] = await pool.query(
            'INSERT INTO payments (orderId, proofImagePath, userId) VALUES (?, ?, ?)',
            [orderId, proofImagePathsJson, req.session.user.id]
        );
        res.status(201).json({ message: 'Pagamento enviado com sucesso!', paymentId: result.insertId });
    } catch (error) {
        console.error('Erro ao salvar pagamento:', error);
        res.status(500).json({ message: 'Erro no servidor ao salvar o pagamento.' });
    }
};

const getPaymentsByStatus = async (req, res) => {
    const { status } = req.params;
    const validStatuses = ['pending', 'approved', 'rejected'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Status inválido.' });
    }

    try {
        // Admins veem todos os pagamentos, vendedores também verão todos
        const [rows] = await pool.query('SELECT * FROM payments WHERE status = ? ORDER BY createdAt DESC', [status]);
        res.json(rows);
    } catch (error) {
        console.error(`[ERRO] Erro ao buscar pagamentos com status ${status}:`, error);
        res.status(500).json({ message: 'Erro no servidor ao buscar pagamentos.' });
    }
};

const approvePayment = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE payments SET status = ? WHERE id = ?', ['approved', id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pagamento não encontrado.' });
        }
        res.json({ message: 'Pagamento aprovado com sucesso!' });
    } catch (error) {
        console.error(`Erro ao aprovar pagamento ${id}:`, error);
        res.status(500).json({ message: 'Erro no servidor ao aprovar pagamento.' });
    }
};

const rejectPayment = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE payments SET status = ? WHERE id = ?', ['rejected', id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pagamento não encontrado.' });
        }
        res.json({ message: 'Pagamento rejeitado com sucesso!' });
    } catch (error) {
        console.error(`Erro ao rejeitar pagamento ${id}:`, error);
        res.status(500).json({ message: 'Erro no servidor ao rejeitar pagamento.' });
    }
};

const deletePayment = async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar se o pagamento existe
        const [existingPayment] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
        if (existingPayment.length === 0) {
            return res.status(404).json({ message: 'Pagamento não encontrado.' });
        }

        const payment = existingPayment[0];

        // Verificar se o usuário é admin ou se é o próprio vendedor que está tentando deletar
        // E se o pagamento está pendente
        const isAdmin = req.session.user.perfil === 'admin';
        const isOwner = payment.userId === req.session.user.id;
        const isPending = payment.status === 'pending';

        if ((isAdmin || (isOwner && isPending)) && isPending) {
            const [result] = await pool.query('DELETE FROM payments WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Pagamento não encontrado.' });
            }
            res.json({ message: 'Pagamento excluído com sucesso!' });
        } else {
            return res.status(403).json({ message: 'Você não tem permissão para excluir este pagamento.' });
        }
    } catch (error) {
        console.error(`Erro ao excluir pagamento ${id}:`, error);
        res.status(500).json({ message: 'Erro no servidor ao excluir pagamento.' });
    }
};

const getDashboardData = async (req, res) => {
    try {
        // Contar o total de pagamentos
        const [totalPaymentsResult] = await pool.query('SELECT COUNT(*) as total FROM payments');
        const totalPayments = totalPaymentsResult[0].total;

        // Contar pagamentos por status
        const [pendingResult] = await pool.query('SELECT COUNT(*) as count FROM payments WHERE status = ?', ['pending']);
        const pendingCount = pendingResult[0].count;

        const [approvedResult] = await pool.query('SELECT COUNT(*) as count FROM payments WHERE status = ?', ['approved']);
        const approvedCount = approvedResult[0].count;

        const [rejectedResult] = await pool.query('SELECT COUNT(*) as count FROM payments WHERE status = ?', ['rejected']);
        const rejectedCount = rejectedResult[0].count;

        res.json({
            totalPayments: totalPayments,
            pendingCount: pendingCount,
            approvedCount: approvedCount,
            rejectedCount: rejectedCount
        });
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar dados do dashboard.' });
    }
};

module.exports = {
    createPayment,
    getPaymentsByStatus,
    approvePayment,
    rejectPayment,
    deletePayment,
    getDashboardData,
};
