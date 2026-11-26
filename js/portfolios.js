(async function () {
    const usuario = exigirLogin();
    if (!usuario) return;
    preencherUsuario(usuario);

    const $ = (id) => document.getElementById(id);
    const select = $("selAluno");
    const aviso = $("aviso");
    const area = $("areaPortfolio");

    function mostrarAviso(texto) {
        aviso.textContent = texto;
        aviso.className = "alert is-error";
        aviso.hidden = false;
    }

    function texto(tag, classe, conteudo) {
        const el = document.createElement(tag);
        if (classe) el.className = classe;
        el.textContent = conteudo;
        return el;
    }

    function desenhar(aluno) {
        area.innerHTML = "";

        const cabecalho = document.createElement("section");
        cabecalho.className = "panel portfolio-header";
        const avatar = texto("div", "avatar avatar-grande", iniciais(aluno.nome));
        const info = document.createElement("div");
        info.append(
            texto("h3", "", aluno.nome),
            texto("p", "", "Matrícula " + aluno.matricula + " · " + aluno.turmaNome),
            texto("p", "", aluno.email)
        );
        const total = aluno.projetos.length;
        cabecalho.append(avatar, info, texto("span", "demo-label", total + (total === 1 ? " projeto" : " projetos")));
        area.append(cabecalho);

        if (!total) {
            area.append(texto("p", "empty panel", "Este aluno ainda não tem projetos."));
            return;
        }

        const grade = document.createElement("section");
        grade.className = "project-grid";
        aluno.projetos.forEach((projeto) => {
            const card = document.createElement("article");
            card.className = "project-card";
            card.append(texto("h3", "", projeto.titulo), texto("p", "", projeto.descricao));

            const rodape = document.createElement("div");
            rodape.className = "project-footer";
            rodape.append(texto("small", "", "Criado em " + formatarData(projeto.dataCriacao)));
            if (projeto.linkRepositorio) {
                const link = texto("a", "link", "Ver repositório →");
                link.href = projeto.linkRepositorio;
                link.target = "_blank";
                link.rel = "noopener";
                rodape.append(link);
            }
            card.append(rodape);
            grade.append(card);
        });
        area.append(grade);
    }

    async function carregar(id) {
        aviso.hidden = true;
        area.innerHTML = "";
        if (!id) return;
        try {
            desenhar(await api("/alunos/" + id));
        } catch (erro) {
            mostrarAviso(erro.message);
        }
    }

    try {
        const alunos = await api("/alunos");
        alunos.forEach((a) => select.add(new Option(a.nome + " — " + a.turmaNome, a.id)));

        if (!alunos.length) {
            mostrarAviso("Nenhum aluno cadastrado ainda. Cadastre alunos e projetos para ver os portfólios.");
            return;
        }

        const idDaUrl = new URLSearchParams(window.location.search).get("id");
        if (idDaUrl) {
            select.value = idDaUrl;
            carregar(select.value);
        }
    } catch (erro) {
        mostrarAviso(erro.message);
    }

    select.addEventListener("change", () => carregar(select.value));
})();
