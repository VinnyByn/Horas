import { db, collection, addDoc, getDocs } from "./firebase.js";

// Inicializa os arrays de atividades e os limites de horas por categoria
const atividades = []; // Armazena as atividades adicionadas
const limitesCategoria = { // Define os limites de horas por categoria principal
    'Ensino': 90,
    'Extensão': 90,
    'Pesquisa': 90
};
const totaisCategoria = { // Armazena o total de horas aprovadas por categoria principal
    'Ensino': 0,
    'Extensão': 0,
    'Pesquisa': 0
};
const limitesTipoEspecifico = {}; // Armazena o total acumulado para cada tipo específico de atividade

// Inicializa os limites e porcentagens de aproveitamento para atividades específicas
const configuracaoTipoEspecifico = {
    "Projeto de Extensão": { limite: 40, porcentagem: 0.7 },
    "Atividade cultural": { limite: 5, porcentagem: 0.8 },
    "Visitas Técnicas": { limite: 40, porcentagem: 1 },
    "Visitas a Feiras e Exposições": { limite: 5, porcentagem: 0.2 },
    "Cursos de Idiomas": { limite: 20, porcentagem: 0.6 },
    "Palestras, Seminários e Congressos Extensionistas (ouvinte)": { limite: 10, porcentagem: 0.8 },
    "Palestras, Seminários e Congressos Extensionistas (apresentador)": { limite: 15, porcentagem: 1 },
    "Projeto Empresa Júnior": { limite: 20, porcentagem: 0.2 },
    "Estágio Extracurricular": { limite: 40, porcentagem: 0.7 },
    "Monitoria": { limite: 40, porcentagem: 0.7 },
    "Concursos e campeonatos acadêmicos": { limite: 50, porcentagem: 0.7 },
    "Presença comprovada a defesas de TCC do curso de Engenharia de Computação": { limite: 3, porcentagem: 0.5 },
    "Cursos Profissionalizantes específicos na área": { limite: 40, porcentagem: 0.8 },
    "Cursos Profissionalizantes em geral": { limite: 10, porcentagem: 0.2 },
    "Iniciação Científica": { limite: 40, porcentagem: 0.7 },
    "Publicação de artigos em periódicos científicos": { limite: 10, porcentagem: 0.7 },
    "Publicação de artigos completos em anais de congressos": { limite: 7, porcentagem: 1 },
    "Publicação de capítulo de livro": { limite: 7, porcentagem: 1 },
    "Publicação de resumos de artigos em anais": { limite: 5, porcentagem: 1 },
    "Registro de patentes como auto/coautor": { limite: 40, porcentagem: 1 },
    "Premiação resultante de pesquisa científica ": { limite: 10, porcentagem: 1 },
    "Colaborador em atividades como Seminários e Congressos": { limite: 10, porcentagem: 1 },
    "Palestras, Seminários e Congressos de Pesquisa (ouvinte)": { limite: 10, porcentagem: 0.8 },
    "Palestras, Seminários e Congressos de Pesquisa (apresentador)": { limite: 15, porcentagem: 1 }
};

// Define as opções de tipos específicos organizadas por categoria principal
const opcoesTipoEspecifico = {
    'Extensão': [
        "Projeto de Extensão",
        "Atividade cultural",
        "Visitas Técnicas",
        "Visitas a Feiras e Exposições",
        "Cursos de Idiomas",
        "Palestras, Seminários e Congressos Extensionistas (ouvinte)",
        "Palestras, Seminários e Congressos Extensionistas (apresentador)",
        "Projeto Empresa Júnior"
    ],
    'Ensino': [
        "Estágio Extracurricular",
        "Monitoria",
        "Concursos e campeonatos acadêmicos",
        "Presença comprovada a defesas de TCC do curso de Engenharia de Computação",
        "Cursos Profissionalizantes específicos na área",
        "Cursos Profissionalizantes em geral"
    ],
    'Pesquisa': [
        "Iniciação Científica",
        "Publicação de artigos em periódicos científicos",
        "Publicação de artigos completos em anais de congressos",
        "Publicação de capítulo de livro",
        "Publicação de resumos de artigos em anais",
        "Registro de patentes como auto/coautor",
        "Premiação resultante de pesquisa científica",
        "Colaborador em atividades como Seminários e Congressos",
        "Palestras, Seminários e Congressos de Pesquisa (ouvinte)",
        "Palestras, Seminários e Congressos de Pesquisa (apresentador)"
    ]
};

// Inicializa o resumo por atividade específica
const totaisAtividade = {}; // Armazena o total de horas aprovadas para cada tipo específico de atividade

// Atualiza as opções do tipo específico ao mudar a categoria
document.getElementById('categoria').addEventListener('change', function () {
    const categoria = this.value;
    const seletorTipoEspecifico = document.getElementById('tipoEspecifico');
    seletorTipoEspecifico.innerHTML = ''; // Limpa as opções anteriores

    if (opcoesTipoEspecifico[categoria]) {
        opcoesTipoEspecifico[categoria].forEach(opcao => {
            const opt = document.createElement('option');
            opt.value = opcao;
            opt.textContent = opcao;
            seletorTipoEspecifico.appendChild(opt);
        });
    }
});

// Função para adicionar uma nova atividade
// Adiciona evento ao formulário
// Adiciona evento ao formulário
document.getElementById('formAtividade').addEventListener('submit', async function (event) {
    event.preventDefault(); // Evita o reload da página

    // Coleta os dados do formulário
    const descricao = document.getElementById('descricao').value;
    const categoria = document.getElementById('categoria').value;
    const tipoEspecifico = document.getElementById('tipoEspecifico').value;
    const horas = parseInt(document.getElementById('horas').value);

    if (isNaN(horas) || horas <= 0) {
        alert("O campo 'horas' deve ser um número válido e maior que zero.");
        return;
    }

    let horasAprovadas = horas;

    // Verifica se o tipo específico tem configuração de limite e porcentagem
    if (configuracaoTipoEspecifico[tipoEspecifico]) {
        const { limite, porcentagem } = configuracaoTipoEspecifico[tipoEspecifico];

        // Inicializa o total acumulado para o tipo específico, se necessário
        if (!limitesTipoEspecifico[tipoEspecifico]) {
            limitesTipoEspecifico[tipoEspecifico] = 0;
        }

        // Calcula as horas restantes disponíveis para o tipo específico
        const horasRestantesTipo = limite - limitesTipoEspecifico[tipoEspecifico];
        horasAprovadas = Math.min(horas * porcentagem, horasRestantesTipo);
    }

    // Verifica o limite da categoria antes de adicionar
    const horasRestantesCategoria = limitesCategoria[categoria] - totaisCategoria[categoria];
    if (horasAprovadas > horasRestantesCategoria) {
        horasAprovadas = horasRestantesCategoria; // Reduz para o máximo permitido na categoria
    }

    // Atualiza os totais de categoria e tipo específico
    totaisCategoria[categoria] += horasAprovadas;
    if (!totaisAtividade[tipoEspecifico]) {
        totaisAtividade[tipoEspecifico] = 0;
    }
    totaisAtividade[tipoEspecifico] += horasAprovadas;

    // Atualiza os limites acumulados
    limitesTipoEspecifico[tipoEspecifico] += horasAprovadas;

    // Salva no Firestore
    try {
        await addDoc(collection(db, "atividades"), {
            descricao,
            categoria,
            tipoEspecifico,
            horas,
            horasAprovadas
        });

        alert("Atividade adicionada com sucesso!");
        carregarAtividades(); // Atualiza a tabela
        document.getElementById('formAtividade').reset(); // Limpa o formulário
    } catch (error) {
        console.error("Erro ao salvar no Firestore:", error);
        alert("Erro ao salvar a atividade.");
    }
});


function atualizarTabela() {
    const corpoTabela = document.getElementById('tabelaAtividades');
    corpoTabela.innerHTML = ''; // Limpa o conteúdo anterior da tabela

    atividades.forEach(atividade => {
        const linha = document.createElement('tr'); // Cria uma nova linha
        linha.innerHTML =
            `<td>${atividade.descricao}</td>
            <td>${atividade.categoria}</td>
            <td>${atividade.tipoEspecifico}</td>
            <td>${atividade.horas}</td>
            <td>${atividade.horasAprovadas !== undefined && atividade.horasAprovadas !== null ? atividade.horasAprovadas.toFixed(2) : "0.00"}</td>`; 
        corpoTabela.appendChild(linha); // Adiciona a linha na tabela
    });
}

function atualizarResumo() {
    const resumoCategoria = document.getElementById('resumoCategoria');
    resumoCategoria.innerHTML = ''; // Limpa antes de atualizar

    for (const categoria in totaisCategoria) {
        if (limitesCategoria[categoria] !== undefined) {
            const limite = limitesCategoria[categoria];
            const atual = totaisCategoria[categoria];

            let textoResumo = `🔹 ${categoria}: Limite é ${limite}h, Você tem `;
            
            if (atual > limite) {
                textoResumo += `${limite}h (${atual}h registradas no total)`;
            } else {
                textoResumo += `${atual}h`;
            }

            const itemLista = document.createElement('li');
            itemLista.textContent = textoResumo;
            resumoCategoria.appendChild(itemLista);
        }
    }
}


function atualizarResumoAtividade() {
    const listaResumoAtividade = document.getElementById('resumoAtividade');
    listaResumoAtividade.innerHTML = ''; // Limpa o conteúdo anterior do resumo

    for (const [atividade, total] of Object.entries(totaisAtividade)) {
        const limite = configuracaoTipoEspecifico[atividade] ? configuracaoTipoEspecifico[atividade].limite : 0; // Obtém o limite da atividade, ou 0 se não existir

        let textoResumo = `🔹 ${atividade}: Limite é ${limite}h, Você tem `;

        if (total > limite) {
            textoResumo += `${limite}h (${total.toFixed(2)}h registradas no total)`;
        } else {
            textoResumo += `${total.toFixed(2)}h`;
        }

        const itemLista = document.createElement('li');
        itemLista.textContent = textoResumo;
        listaResumoAtividade.appendChild(itemLista);
    }
}



// 🛠️ Função para carregar atividades do Firestore e exibir na tabela
async function carregarAtividades() {
    const corpoTabela = document.getElementById('tabelaAtividades');
    corpoTabela.innerHTML = ''; // Limpa a tabela

    // Zerar os totais antes de recalcular
    for (const categoria in totaisCategoria) {
        totaisCategoria[categoria] = 0;
    }
    for (const atividade in totaisAtividade) {
        totaisAtividade[atividade] = 0;
    }

    try {
        const querySnapshot = await getDocs(collection(db, "atividades"));
        querySnapshot.forEach((doc) => {
            const atividade = doc.data();
            console.log("✅ Atividade carregada do Firestore:", atividade);

            // Atualiza os totais por categoria
            if (totaisCategoria[atividade.categoria] !== undefined) {
                totaisCategoria[atividade.categoria] += atividade.horas;
            }

            // Atualiza os totais por tipo específico
            if (!totaisAtividade[atividade.tipoEspecifico]) {
                totaisAtividade[atividade.tipoEspecifico] = 0;
            }
            totaisAtividade[atividade.tipoEspecifico] += atividade.horas;

            // Adiciona a atividade na tabela
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${atividade.descricao}</td>
                <td>${atividade.categoria}</td>
                <td>${atividade.tipoEspecifico}</td>
                <td>${atividade.horas}</td>
                <td>${atividade.horasAprovadas !== undefined ? atividade.horasAprovadas.toFixed(2) : "0.00"}</td>
            `;
            corpoTabela.appendChild(linha);
        });

        // Após carregar, atualizar os resumos
        atualizarResumo();
        atualizarResumoAtividade();
    } catch (error) {
        console.error("❌ Erro ao carregar atividades:", error);
        alert("Erro ao carregar atividades do banco de dados.");
    }
}


// 🔄 Carrega as atividades ao iniciar
document.addEventListener("DOMContentLoaded", () => {
    carregarAtividades();
});


