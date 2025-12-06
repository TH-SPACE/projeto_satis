# Documento de Venda - Sistema Satismake

## Descrição Geral

O Sistema Satismake é uma solução web completa para verificação e gerenciamento de pagamentos e comprovantes de pagamento. O sistema permite que vendedores enviem comprovantes de pagamento, que são analisados por administradores que podem aprovar ou rejeitar os comprovantes.

## Funcionalidades Principais

### Gerais
- Autenticação e autorização de usuários
- Sistema de sessões seguras com criptografia de senhas
- Interface responsiva para desktop e mobile
- Upload por colagem de imagens ou PDF da área de transferência
- Busca de pedidos
- Sistema de permissões diferenciado por perfil de usuário
- Qualquer usuário pode alterar sua própria senha

### Para Vendedores
- Envio de comprovantes de pagamento
- Visualização de status dos pedidos enviados
- Exclusão de pedidos pendentes
- Filtro dinâmico por número do pedido
- Visualização de comprovantes em carrossel

### Para Administradores
- Verificação de comprovantes pendentes
- Aprovação ou rejeição de comprovantes
- Visualização de todos os pedidos
- Criação de novos usuários (vendedores)
- Dashboard com estatísticas completas
- Filtro dinâmico por número do pedido
- Exclusão de comprovantes

## Tecnologia Utilizada

- **Backend**: Node.js com Express
- **Banco de Dados**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Framework CSS**: Bootstrap 5
- **Bibliotecas**: bcrypt (criptografia), multer (upload), express-session (sessões)
- **Segurança**: Criptografia de senhas com bcrypt, sessões seguras, middleware de autenticação

## Arquitetura do Sistema

### Estrutura de Pastas
- `/controllers` - Lógica de negócio e manipulação de requisições
- `/middleware` - Funções de autenticação e autorização
- `/public` - Arquivos estáticos (HTML, CSS, JS, imagens)
- `/routes` - Definição de rotas da API
- `/uploads` - Armazenamento de comprovantes enviados

### Banco de Dados
- Tabela `payments` para armazenar comprovantes com campos:
  - id, orderId, proofImagePath, status (pending/approved/rejected)
  - userId (chave estrangeira para usuários)
  - createdAt (timestamp)
- Tabela `usuarios` para autenticação com campos:
  - id, user, senha (criptografada), perfil (admin/vendedor)
  - ultimo_login, createdAt

## Tela de Login
- Formulário de autenticação seguro
- Validação de credenciais
- Redirecionamento automático após login

## Interface de Vendedor
- Envio de comprovantes com múltiplas imagens ou PDFs
- Visualização dos próprios envios por status
- Interface intuitiva e amigável
- Upload via arrastar e soltar ou colagem da área de transferência

## Interface Administrativa
- Dashboard com estatísticas (total, pendentes, aprovados, rejeitados)
- Aprovação/rejeição de comprovantes
- Gestão de usuários
- Visualização de todos os comprovantes
- Exclusão de comprovantes

## Segurança
- Senhas armazenadas com criptografia bcrypt
- Sessões seguras com expiração
- Middleware de autenticação
- Validação de permissões por perfil de usuário
- Proteção contra acesso não autorizado

## Instalação e Configuração

O sistema inclui arquivos de configuração para:
- Conexão com banco de dados MySQL
- Configurações de sessão
- Variáveis de ambiente (.env)

## Benefícios Comerciais

1. **Automação de Processos**: Elimina a necessidade de verificação manual de comprovantes
2. **Controle e Auditoria**: Todos os pagamentos e ações são registrados
3. **Escala**: Sistema permite múltiplos vendedores sob supervisão de administradores
4. **Eficiência**: Processo de aprovação/rejeição rápido e eficiente
5. **Segurança**: Sistema seguro com autenticação e criptografia

## Casos de Uso

- E-commerce que precisa verificar pagamentos
- Serviços que recebem pagamentos por transferência
- Plataformas de marketplace
- Negócios com múltiplos vendedores
- Empresas que recebem comprovantes bancários

## Suporte Incluído

- Documentação básica do código
- Instruções de instalação e configuração
- Estrutura de código bem organizada e comentada
- Potencial para expansão de funcionalidades

## Preço de Venda

**Valor: R$ 1.200,00** (à vista ou parcelado)

Este valor inclui:
- Código-fonte completo
- Scripts de banco de dados
- Documentação de instalação
- Direito de uso comercial
- Possibilidade de customização

## Conclusão

O Sistema Satismake é uma solução profissional pronta para uso, ideal para qualquer negócio que precise verificar e aprovar comprovantes de pagamento de forma eficiente e segura. Com um design moderno, segurança adequada e funcionalidades completas, ele representa um investimento valioso para automatizar processos de verificação de pagamentos.

O preço acessível de R$ 1.200,00 reflete o valor real do sistema, considerando o tempo de desenvolvimento, qualidade do código e funcionalidades implementadas, oferecendo excelente custo-benefício para qualquer negócio que necessite desta solução.