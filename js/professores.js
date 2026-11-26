iniciarCrud({
    singular: "professor",
    endpoint: "/professores",
    rotulo: (p) => p.nome,
    tituloNovo: "Novo professor",
    tituloEditar: "Editar professor",
    msgCriado: "Professor cadastrado com sucesso!",
    msgEditado: "Professor atualizado com sucesso!",
    msgExcluido: "Professor excluído com sucesso!",
    campos: [
        { nome: "nome", rotulo: "Nome", tipo: "text", obrigatorio: true },
        { nome: "email", rotulo: "E-mail", tipo: "email", obrigatorio: true },
    ],
    colunas: [
        { titulo: "Nome", valor: (p) => p.nome },
        { titulo: "E-mail", valor: (p) => p.email },
        { titulo: "Turmas", valor: (p) => p.quantidadeTurmas },
    ],
});
