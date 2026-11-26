// Motor de cadastro (listar, criar, editar, excluir) usado por
// professores.html, turmas.html, alunos.html e projetos.html.
// Cada página só descreve seus campos e colunas (veja js/turmas.js, por exemplo).

function iniciarCrud(cfg) {
    const usuario = exigirLogin();
    if (!usuario) return;
    preencherUsuario(usuario);

    const $ = (id) => document.getElementById(id);
    const form = $("crudForm");
    const camposEl = $("campos");
    const painelForm = $("painelForm");
    const tituloForm = $("tituloForm");
    const aviso = $("aviso");
    const lista = $("lista");
    const vazio = $("vazio");
    const btnSalvar = $("btnSalvar");

    let itens = [];
    let editandoId = null;

    function mostrarAviso(texto, tipo) {
        aviso.textContent = texto;
        aviso.className = "alert is-" + tipo;
        aviso.hidden = false;
    }

    function limparAviso() {
        aviso.hidden = true;
        aviso.textContent = "";
    }

    // ---------- Formulário ----------
    function criarCampo(campo) {
        const div = document.createElement("div");
        div.className = "field" + (campo.larga ? " full" : "");

        const label = document.createElement("label");
        label.htmlFor = "campo-" + campo.nome;
        label.textContent = campo.rotulo + (campo.obrigatorio ? " *" : "");

        let input;
        if (campo.tipo === "textarea") {
            input = document.createElement("textarea");
        } else if (campo.tipo === "select") {
            input = document.createElement("select");
        } else {
            input = document.createElement("input");
            input.type = campo.tipo || "text";
        }
        input.id = "campo-" + campo.nome;
        input.name = campo.nome;
        if (campo.placeholder) input.placeholder = campo.placeholder;
        if (campo.min !== undefined) input.min = campo.min;
        if (campo.max !== undefined) input.max = campo.max;

        div.append(label, input);

        if (campo.tipo === "select") {
            const dica = document.createElement("small");
            dica.className = "field-hint";
            dica.id = "dica-" + campo.nome;
            div.append(dica);
        }
        camposEl.append(div);
    }

    // Os <select> buscam as opções na API (ex.: lista de professores para a turma)
    async function carregarOpcoes() {
        for (const campo of cfg.campos.filter((c) => c.tipo === "select")) {
            const select = form.elements[campo.nome];
            const dica = $("dica-" + campo.nome);
            const opcoes = await api(campo.endpoint);

            select.innerHTML = "";
            select.add(new Option("Selecione...", ""));
            opcoes.forEach((o) => select.add(new Option(campo.textoOpcao(o), o.id)));
            dica.textContent = opcoes.length ? "" : campo.vazioMsg;
        }
    }

    async function abrirForm(item) {
        limparAviso();
        editandoId = item ? item.id : null;
        tituloForm.textContent = item ? cfg.tituloEditar : cfg.tituloNovo;

        try {
            await carregarOpcoes();
        } catch (erro) {
            mostrarAviso(erro.message, "error");
            return;
        }

        cfg.campos.forEach((campo) => {
            const valor = item ? item[campo.nome] : campo.padrao ? campo.padrao() : "";
            form.elements[campo.nome].value = valor === null || valor === undefined ? "" : valor;
        });

        painelForm.hidden = false;
        form.elements[cfg.campos[0].nome].focus();
        painelForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function fecharForm() {
        painelForm.hidden = true;
        editandoId = null;
        form.reset();
    }

    function lerFormulario() {
        const dados = {};
        for (const campo of cfg.campos) {
            const bruto = form.elements[campo.nome].value.trim();

            if (!bruto) {
                if (campo.obrigatorio) throw new Error('Preencha o campo "' + campo.rotulo + '".');
                dados[campo.nome] = null;
                continue;
            }

            if (campo.tipo === "number" || campo.tipo === "select") {
                const numero = Number(bruto);
                if (Number.isNaN(numero)) throw new Error('O campo "' + campo.rotulo + '" precisa ser um número.');
                if (campo.min !== undefined && (numero < campo.min || numero > campo.max)) {
                    throw new Error(campo.rotulo + " deve estar entre " + campo.min + " e " + campo.max + ".");
                }
                dados[campo.nome] = numero;
            } else {
                dados[campo.nome] = bruto;
            }
        }
        return dados;
    }

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        limparAviso();

        let dados;
        try {
            dados = lerFormulario();
        } catch (erro) {
            mostrarAviso(erro.message, "error");
            return;
        }

        btnSalvar.disabled = true;
        try {
            if (editandoId === null) {
                await api(cfg.endpoint, { metodo: "POST", corpo: dados });
                mostrarAviso(cfg.msgCriado, "success");
            } else {
                await api(cfg.endpoint + "/" + editandoId, { metodo: "PUT", corpo: dados });
                mostrarAviso(cfg.msgEditado, "success");
            }
            fecharForm();
            await carregarLista();
        } catch (erro) {
            mostrarAviso(erro.message, "error");
        } finally {
            btnSalvar.disabled = false;
        }
    });

    // ---------- Lista ----------
    async function carregarLista() {
        try {
            itens = await api(cfg.endpoint);
        } catch (erro) {
            itens = [];
            mostrarAviso(erro.message, "error");
        }
        desenharLista();
    }

    function criarBotao(texto, classe, aoClicar) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "btn btn-small " + classe;
        botao.textContent = texto;
        botao.addEventListener("click", aoClicar);
        return botao;
    }

    function desenharLista() {
        lista.innerHTML = "";
        vazio.hidden = itens.length > 0;

        itens.forEach((item) => {
            const linha = document.createElement("tr");

            cfg.colunas.forEach((coluna) => {
                const celula = document.createElement("td");
                const texto = coluna.valor(item);
                const href = coluna.href ? coluna.href(item) : null;

                if (coluna.href) {
                    if (href) {
                        const link = document.createElement("a");
                        link.className = "link";
                        link.href = href;
                        link.target = "_blank";
                        link.rel = "noopener";
                        link.textContent = texto;
                        celula.append(link);
                    } else {
                        celula.textContent = "—";
                    }
                } else {
                    celula.textContent = texto === null || texto === undefined || texto === "" ? "—" : texto;
                }
                linha.append(celula);
            });

            const acoes = document.createElement("td");
            acoes.className = "col-acoes";

            (cfg.acoesExtras || []).forEach((extra) => {
                const link = document.createElement("a");
                link.className = "btn btn-small btn-secondary";
                link.href = extra.href(item);
                link.textContent = extra.texto;
                acoes.append(link);
            });

            acoes.append(
                criarBotao("Editar", "btn-secondary", () => abrirForm(item)),
                criarBotao("Excluir", "btn-danger", () => excluir(item))
            );
            linha.append(acoes);
            lista.append(linha);
        });
    }

    async function excluir(item) {
        if (!confirm("Excluir " + cfg.singular + ' "' + cfg.rotulo(item) + '"?')) return;
        limparAviso();
        try {
            await api(cfg.endpoint + "/" + item.id, { metodo: "DELETE" });
            mostrarAviso(cfg.msgExcluido, "success");
            await carregarLista();
        } catch (erro) {
            mostrarAviso(erro.message, "error");
        }
    }

    // ---------- Início ----------
    cfg.campos.forEach(criarCampo);
    $("btnNovo").addEventListener("click", () => abrirForm(null));
    $("btnCancelar").addEventListener("click", fecharForm);
    carregarLista();
}
