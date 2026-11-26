// Camada de dados do Portfólio Acadêmico.
// Por padrão, os cadastros ficam salvos no navegador (localStorage).
// Para conectar ao backend ASP.NET, altere USAR_API para true em config.js.

const CHAVE_SESSAO = "usuario";
const CHAVE_BANCO = "portfolioAcademicoDB_v1";

function bancoVazio() {
    return { professores: [], turmas: [], alunos: [], projetos: [], proximoId: 1 };
}

function obterBanco() {
    try {
        const texto = localStorage.getItem(CHAVE_BANCO);
        if (!texto) return bancoVazio();
        const banco = JSON.parse(texto);
        return {
            professores: Array.isArray(banco.professores) ? banco.professores : [],
            turmas: Array.isArray(banco.turmas) ? banco.turmas : [],
            alunos: Array.isArray(banco.alunos) ? banco.alunos : [],
            projetos: Array.isArray(banco.projetos) ? banco.projetos : [],
            proximoId: Number(banco.proximoId) || 1,
        };
    } catch {
        return bancoVazio();
    }
}

function salvarBanco(banco) {
    localStorage.setItem(CHAVE_BANCO, JSON.stringify(banco));
}

function enriquecerBanco(banco) {
    const professores = banco.professores.map((p) => ({
        ...p,
        quantidadeTurmas: banco.turmas.filter((t) => Number(t.professorId) === Number(p.id)).length,
    }));

    const turmas = banco.turmas.map((t) => {
        const professor = banco.professores.find((p) => Number(p.id) === Number(t.professorId));
        return {
            ...t,
            professorNome: professor ? professor.nome : "Não informado",
            quantidadeAlunos: banco.alunos.filter((a) => Number(a.turmaId) === Number(t.id)).length,
        };
    });

    const projetos = banco.projetos.map((p) => {
        const aluno = banco.alunos.find((a) => Number(a.id) === Number(p.alunoId));
        return { ...p, alunoNome: aluno ? aluno.nome : "Não informado" };
    });

    const alunos = banco.alunos.map((a) => {
        const turma = banco.turmas.find((t) => Number(t.id) === Number(a.turmaId));
        const projetosDoAluno = projetos.filter((p) => Number(p.alunoId) === Number(a.id));
        return {
            ...a,
            turmaNome: turma ? turma.nome : "Não informada",
            quantidadeProjetos: projetosDoAluno.length,
            projetos: projetosDoAluno,
        };
    });

    return { professores, turmas, alunos, projetos };
}

function apiLocal(caminho, opcoes = {}) {
    const metodo = (opcoes.metodo || "GET").toUpperCase();
    const partes = caminho.split("?")[0].split("/").filter(Boolean);
    const recurso = partes[0];
    const id = partes.length > 1 ? Number(partes[1]) : null;
    const recursosPermitidos = ["professores", "turmas", "alunos", "projetos"];

    if (!recursosPermitidos.includes(recurso)) {
        throw new Error("Recurso não disponível no modo local: " + caminho);
    }

    const banco = obterBanco();
    const listas = enriquecerBanco(banco);

    if (metodo === "GET") {
        if (id === null) return listas[recurso];
        const item = listas[recurso].find((registro) => Number(registro.id) === id);
        if (!item) throw new Error("Registro não encontrado.");
        return item;
    }

    if (metodo === "POST") {
        const dados = opcoes.corpo || {};
        const novo = { ...dados, id: banco.proximoId++ };
        if (recurso === "projetos") novo.dataCriacao = new Date().toISOString();
        banco[recurso].push(novo);
        salvarBanco(banco);
        return novo;
    }

    if (metodo === "PUT") {
        const indice = banco[recurso].findIndex((registro) => Number(registro.id) === id);
        if (indice < 0) throw new Error("Registro não encontrado para edição.");
        banco[recurso][indice] = { ...banco[recurso][indice], ...(opcoes.corpo || {}), id };
        salvarBanco(banco);
        return banco[recurso][indice];
    }

    if (metodo === "DELETE") {
        const indice = banco[recurso].findIndex((registro) => Number(registro.id) === id);
        if (indice < 0) throw new Error("Registro não encontrado para exclusão.");

        // Impede excluir registros que ainda estão vinculados a outros dados.
        if (recurso === "professores" && banco.turmas.some((t) => Number(t.professorId) === id)) {
            throw new Error("Este professor está vinculado a uma turma. Altere ou exclua a turma antes.");
        }
        if (recurso === "turmas" && banco.alunos.some((a) => Number(a.turmaId) === id)) {
            throw new Error("Esta turma possui alunos vinculados. Transfira os alunos antes de excluir.");
        }
        if (recurso === "alunos" && banco.projetos.some((p) => Number(p.alunoId) === id)) {
            throw new Error("Este aluno possui projetos cadastrados. Exclua os projetos antes.");
        }

        banco[recurso].splice(indice, 1);
        salvarBanco(banco);
        return { sucesso: true };
    }

    throw new Error("Operação não reconhecida.");
}

async function api(caminho, opcoes = {}) {
    if (!USAR_API) return apiLocal(caminho, opcoes);

    let resposta;
    try {
        resposta = await fetch(API_URL + caminho, {
            method: opcoes.metodo || "GET",
            headers: opcoes.corpo ? { "Content-Type": "application/json" } : undefined,
            body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
        });
    } catch {
        let orientacao = " Verifique se a API está em execução, se a porta está correta e se não há bloqueio de rede/CORS.";
        try {
            const endereco = new URL(API_URL);
            const swagger = API_URL.replace(/\/api\/?$/i, "/swagger");
            orientacao += " Teste também " + swagger + ".";
            if (endereco.hostname === "localhost" || endereco.hostname === "127.0.0.1") {
                orientacao += " Em outro dispositivo, como um celular, localhost aponta para o próprio dispositivo; nesse caso use o IP do computador no js/config.js e permita o acesso pela rede local.";
            }
        } catch {
            orientacao += " Confira o endereço definido em js/config.js.";
        }
        throw new Error("Não foi possível acessar a API (" + API_URL + ")." + orientacao);
    }

    const texto = await resposta.text();
    let dados = texto;
    try { dados = texto ? JSON.parse(texto) : null; } catch { /* resposta em texto simples */ }
    if (!resposta.ok) throw new Error(mensagemDeErro(dados, resposta.status));
    return dados;
}

function mensagemDeErro(dados, status) {
    if (typeof dados === "string" && dados.trim()) return dados;
    if (dados && dados.errors) {
        const mensagens = Object.values(dados.errors).flat();
        if (mensagens.length) return mensagens.join(" ");
    }
    if (dados && dados.title) return dados.title;
    return "Erro " + status + " ao falar com a API.";
}

// O login é apenas visual nesta versão: o painel fica aberto sem autenticação.
function salvarSessao(usuario, lembrar) {
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario || { id: 0, nome: "Orlando Leite" }));
}

function obterSessao() {
    return { id: 0, nome: "Orlando Leite" };
}

function sair() {
    sessionStorage.removeItem(CHAVE_SESSAO);
    localStorage.removeItem(CHAVE_SESSAO);
    window.location.href = "index.html";
}

function exigirLogin() {
    return obterSessao();
}

function iniciais(nome) {
    const partes = (nome || "").trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return "PA";
    const letras = partes.length === 1 ? partes[0].slice(0, 2) : partes[0][0] + partes[partes.length - 1][0];
    return letras.toUpperCase();
}

function preencherUsuario(usuario) {
    const nome = document.getElementById("userName");
    const avatar = document.getElementById("userAvatar");
    if (nome) nome.textContent = usuario.nome || "Orlando Leite";
    if (avatar) avatar.textContent = iniciais(usuario.nome || "Orlando Leite");
}

function formatarData(iso) {
    if (!iso) return "";
    const data = new Date(iso);
    return isNaN(data) ? "" : data.toLocaleDateString("pt-BR");
}

document.addEventListener("click", (evento) => {
    const alvo = evento.target.closest("[data-sair]");
    if (alvo) {
        evento.preventDefault();
        sair();
    }
});
