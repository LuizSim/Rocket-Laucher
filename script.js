document.addEventListener('DOMContentLoaded', () => {

    // Seleção de todos os elementos do DOM
    const form = document.getElementById('form-lancamento');
    const modal = document.getElementById('modal-resultados');
    const modalAlturaMaximaEl = document.getElementById('modal-altura-maxima');
    const modalAnguloEl = document.getElementById('modal-angulo');
    const modalDistanciaEl = document.getElementById('modal-distancia');
    const modalCanvas = document.getElementById('modal-graficoFoguete');
    const modalBtnDownload = document.getElementById('modal-btnDownload');
    const closeModalButton = document.querySelector('.close-button');
    const modalCtx = modalCanvas.getContext('2d');
    const loadingScreen = document.getElementById('loading-screen');
    const btnHistorico = document.getElementById('btn-historico');
    const historicoContainer = document.getElementById('historico-container');

    let meuGraficoModal;

    // Função assíncrona para salvar o lançamento na API
    async function salvarLancamento(dados) {
        try {
            const response = await fetch('http://localhost:3000/api/launches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados),
            });
            if (!response.ok) {
                throw new Error('Falha ao salvar os dados no servidor.');
            }
            console.log('Lançamento salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Não foi possível salvar o lançamento. Verifique se o servidor backend está rodando.');
        }
    }

    // Event Listener do Formulário Principal
    form.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const angulo = parseFloat(document.getElementById('angulo').value);
        const distancia = parseFloat(document.getElementById('distancia').value);

        if (isNaN(angulo) || isNaN(distancia) || distancia <= 0 || angulo <= 0 || angulo >= 90) {
            alert('Por favor, insira valores válidos para Ângulo e Distância.');
            return;
        }

        mostrarLoading();

        const g = 9.81;
        const anguloRad = angulo * (Math.PI / 180);
        const velocidadeInicial = Math.sqrt((distancia * g) / Math.sin(2 * anguloRad));
        const alturaMaxima = (Math.pow(velocidadeInicial, 2) * Math.pow(Math.sin(anguloRad), 2)) / (2 * g);

        const trajectoryData = [];
        const numeroDePontos = 100;
        const tanAngulo = Math.tan(anguloRad);
        const cosAngulo = Math.cos(anguloRad);
        const parteDaFormula = (g) / (2 * Math.pow(velocidadeInicial, 2) * Math.pow(cosAngulo, 2));

        for (let i = 0; i <= numeroDePontos; i++) {
            const x = (i / numeroDePontos) * distancia;
            const y = (x * tanAngulo) - (parteDaFormula * Math.pow(x, 2));
            if (y >= 0) {
                trajectoryData.push({ x: x, y: y });
            }
        }

        setTimeout(() => {
            modalAlturaMaximaEl.textContent = alturaMaxima.toFixed(2);
            modalAnguloEl.textContent = angulo.toFixed(2);
            modalDistanciaEl.textContent = distancia.toFixed(2);

            if (meuGraficoModal) {
                meuGraficoModal.destroy();
            }

            meuGraficoModal = new Chart(modalCtx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Altura (m)',
                        data: trajectoryData,
                        borderColor: '#1a237e',
                        backgroundColor: 'rgba(26, 35, 126, 0.1)',
                        fill: true,
                        tension: 0.1,
                        borderWidth: 2,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1,
                    plugins: {
                        title: { display: true, text: 'Trajetória do Foguete (Altura vs. Distância)' },
                        tooltip: { events: ['click'] }
                    },
                    scales: {
                        x: { type: 'linear', title: { display: true, text: 'Distância (m)' }, min: 0, max: 200, ticks: { stepSize: 10 } },
                        y: { type: 'linear', title: { display: true, text: 'Altura (m)' }, beginAtZero: true, max: 150, ticks: { stepSize: 25 } }
                    }
                }
            });

            esconderLoading();
            modal.style.display = "block";
            modalCanvas.style.display = 'block';
            modalBtnDownload.style.display = 'block';

            const dadosParaSalvar = {
                angle: angulo,
                distance: distancia,
                max_height: alturaMaxima
            };
            salvarLancamento(dadosParaSalvar);

        }, 2000);
    });

    // Event Listener para o Botão de Histórico
    btnHistorico.addEventListener('click', async () => {
        try {
            const response = await fetch('http://localhost:3000/api/launches');
            if (!response.ok) {
                throw new Error('Falha ao buscar o histórico do servidor.');
            }
            const historico = await response.json();

            historicoContainer.innerHTML = '<h3>Histórico de Lançamentos</h3>';
            if (historico.length === 0) {
                historicoContainer.innerHTML += '<p>Nenhum lançamento encontrado.</p>';
                return;
            }

            const lista = document.createElement('ul');
            historico.forEach(lancamento => {
                const item = document.createElement('li');
                const dataFormatada = new Date(lancamento.created_at).toLocaleString('pt-BR');
                item.textContent = `Data: ${dataFormatada} | Ângulo: ${lancamento.angle}° | Distância: ${lancamento.distance.toFixed(2)}m | Altura Máx.: ${lancamento.max_height.toFixed(2)}m`;
                lista.appendChild(item);
            });
            historicoContainer.appendChild(lista);

        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            alert('Não foi possível buscar o histórico. Verifique se o servidor backend está rodando.');
        }
    });

    // Event Listeners para fechar a modal
    closeModalButton.addEventListener('click', () => {
        modal.style.display = "none";
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });

    // Event Listener para o botão de download
    modalBtnDownload.addEventListener('click', () => {
        if (!meuGraficoModal) return;
        const canvasOriginal = meuGraficoModal.canvas;
        const canvasTemporario = document.createElement('canvas');
        const larguraTotalImagem = 1800;
        const alturaTotalImagem = 900;
        const larguraAreaTexto = 600;
        const espacamentoEntreColunas = 80;
        const padding = 60;
        canvasTemporario.width = larguraTotalImagem;
        canvasTemporario.height = alturaTotalImagem;
        const ctxTemp = canvasTemporario.getContext('2d');
        const gradiente = ctxTemp.createLinearGradient(0, 0, 0, alturaTotalImagem);
        gradiente.addColorStop(0, "#f5f7fa");
        gradiente.addColorStop(1, "#c3cfe2");
        ctxTemp.fillStyle = gradiente;
        ctxTemp.fillRect(0, 0, canvasTemporario.width, canvasTemporario.height);
        const caixaLargura = larguraAreaTexto - 40;
        const caixaAltura = alturaTotalImagem - (padding * 2);
        ctxTemp.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctxTemp.roundRect(padding / 2, padding, caixaLargura, caixaAltura, 20);
        ctxTemp.fill();
        ctxTemp.fillStyle = "#1f1f1f";
        ctxTemp.font = "bold 50px 'Segoe UI', Arial, sans-serif";
        ctxTemp.textAlign = "left";
        ctxTemp.fillText("Trajetória do Foguete", padding + 20, padding + 60);
        ctxTemp.font = "bold 42px 'Segoe UI', Arial, sans-serif";
        ctxTemp.fillStyle = "#333";
        const anguloInput = document.getElementById('angulo').value;
        const distanciaInput = modalDistanciaEl.textContent;
        const alturaMaxInput = modalAlturaMaximaEl.textContent;
        const alturaTextoStr = `Altura Máxima: ${alturaMaxInput} m`;
        const anguloTextoStr = `Angulação: ${anguloInput}°`;
        const distanciaTextoStr = `Distância: ${distanciaInput} m`;
        const linhaAltura = 80;
        let yTexto = padding + 160;
        ctxTemp.fillText(alturaTextoStr, padding + 20, yTexto);
        yTexto += linhaAltura;
        ctxTemp.fillText(anguloTextoStr, padding + 20, yTexto);
        yTexto += linhaAltura;
        ctxTemp.fillText(distanciaTextoStr, padding + 20, yTexto);
        const xGrafico = larguraAreaTexto + espacamentoEntreColunas;
        const yGrafico = padding;
        const larguraGrafico = larguraTotalImagem - xGrafico - padding;
        const alturaGrafico = alturaTotalImagem - (padding * 2);
        ctxTemp.shadowColor = "rgba(0,0,0,0.3)";
        ctxTemp.shadowBlur = 15;
        ctxTemp.shadowOffsetX = 8;
        ctxTemp.shadowOffsetY = 8;
        ctxTemp.drawImage(canvasOriginal, xGrafico, yGrafico, larguraGrafico, alturaGrafico);
        ctxTemp.shadowColor = "transparent";
        const urlImagem = canvasTemporario.toDataURL("image/png");
        const linkFake = document.createElement("a");
        linkFake.href = urlImagem;
        linkFake.download = "grafico_trajetoria_foguete.png";
        linkFake.click();
    });

    // Funções Helper
    function mostrarLoading() {
        loadingScreen.style.display = 'flex';
    }

    function esconderLoading() {
        loadingScreen.style.display = 'none';
    }
});

// Adiciona a função roundRect ao protótipo do Canvas
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
};