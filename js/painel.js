(async function () {
    const usuario = exigirLogin();
    preencherUsuario(usuario);

    const $ = (id) => document.getElementById(id);
    const status = $("apiStatus");
    const statusTexto = $("apiStatusTexto");
    const statusIcone = $("apiStatusIcone");
    const rotas = ["professores", "turmas", "alunos", "projetos"];

    try {
        const listas = await Promise.all(rotas.map((rota) => api("/" + rota)));
        const [professores, turmas, alunos, projetos] = listas;
        const contar = (n, singular, plural) => n + " " + (n === 1 ? singular : plural);
        $("cntProfessores").textContent = contar(professores.length, "cadastrado", "cadastrados");
        $("cntTurmas").textContent = contar(turmas.length, "cadastrada", "cadastradas");
        $("cntAlunos").textContent = contar(alunos.length, "cadastrado", "cadastrados");
        $("cntProjetos").textContent = contar(projetos.length, "cadastrado", "cadastrados");
        $("cntPortfolios").textContent = contar(alunos.length, "aluno", "alunos");

        status.classList.remove("is-error");
        statusIcone.textContent = "✓";
        statusTexto.textContent = USAR_API
            ? "Sistema conectado à API configurada."
            : "Modo demonstração ativo. Os cadastros ficam salvos neste navegador.";
    } catch (erro) {
        status.classList.add("is-error");
        statusIcone.textContent = "!";
        statusTexto.textContent = erro.message;
    }
})();
