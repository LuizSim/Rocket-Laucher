document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('form-lancamento');
    const modalResultados = document.getElementById('modal-resultados');
    const modalHistorico = document.getElementById('modal-historico');

    const modalAlturaMaximaEl = document.getElementById('modal-altura-maxima');
    const modalAnguloEl = document.getElementById('modal-angulo');
    const modalDistanciaEl = document.getElementById('modal-distancia');
    const modalVelocidadeEl = document.getElementById('modal-velocidade');
    const modalForcaEl = document.getElementById('modal-forca');
    const modalAceleracaoEl = document.getElementById('modal-aceleracao');

    const modalCanvas = document.getElementById('modal-graficoFoguete');
    const modalBtnDownload = document.getElementById('modal-btnDownload');
    const closeModalButtons = document.querySelectorAll('.close-button');
    const modalCtx = modalCanvas.getContext('2d');
    const loadingScreen = document.getElementById('loading-screen');
    const btnHistorico = document.getElementById('btn-historico');
    const historicoContainer = document.getElementById('lista-historico-container');
    const dbStatusContainer = document.getElementById('db-status-container');
    const popup = document.getElementById('custom-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupButtons = document.getElementById('popup-buttons');

    let meuGraficoModal;

    function abrirModal(modalElement) {
        modalElement.style.display = 'flex';
        setTimeout(() => modalElement.classList.add('active'), 10);
    }

    function fecharModal(modalElement) {
        modalElement.classList.remove('active');
        setTimeout(() => {
            modalElement.style.display = 'none';
            if (modalElement === modalResultados) {
                modalCanvas.style.display = 'none';
                modalBtnDownload.style.display = 'none';
            }
        }, 300);
    }

    function customAlert(title, message) {
        popupTitle.textContent = title;
        popupMessage.textContent = message;
        popupButtons.innerHTML = '';
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.className = 'popup-btn-confirm';
        okButton.onclick = () => fecharModal(popup);
        popupButtons.appendChild(okButton);
        abrirModal(popup);
    }

    function customConfirm(title, message) {
        return new Promise((resolve) => {
            popupTitle.textContent = title;
            popupMessage.textContent = message;
            popupButtons.innerHTML = '';
            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Confirmar';
            confirmButton.className = 'popup-btn-confirm';
            confirmButton.onclick = () => {
                fecharModal(popup);
                resolve(true);
            };
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancelar';
            cancelButton.className = 'popup-btn-cancel';
            cancelButton.onclick = () => {
                fecharModal(popup);
                resolve(false);
            };
            popupButtons.appendChild(cancelButton);
            popupButtons.appendChild(confirmButton);
            abrirModal(popup);
        });
    }

    async function salvarLancamento(dados) {
        try {
            const response = await fetch('https://rocket-laucher-backend.onrender.com/api/launches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
            });
            if (!response.ok) throw new Error('Falha ao salvar os dados no servidor.');
            console.log('Lançamento salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            customAlert('Erro de Conexão', 'Não foi possível salvar o lançamento. Verifique com o desenvolvedor se o servidor está rodando.');
        }
    }

    function exibirResultados(angulo, distancia, alturaMaxima, velocidadeSaida, forca, aceleracao) {
        modalAlturaMaximaEl.textContent = alturaMaxima.toFixed(2);
        modalAnguloEl.textContent = angulo.toFixed(0);
        modalDistanciaEl.textContent = distancia.toFixed(2);
        modalVelocidadeEl.textContent = velocidadeSaida.toFixed(2);
        modalForcaEl.textContent = forca.toFixed(2);
        modalAceleracaoEl.textContent = aceleracao.toFixed(2);

        const trajectoryData = [];
        const anguloRad = angulo * (Math.PI / 180);
        const tanAngulo = Math.tan(anguloRad);
        const cosAngulo = Math.cos(anguloRad);
        const g = 9.81;
        const velocidadeInicialCalc = Math.sqrt((distancia * g) / Math.sin(2 * anguloRad));
        const parteDaFormula = (g) / (2 * Math.pow(velocidadeInicialCalc, 2) * Math.pow(cosAngulo, 2));

        const calcularAltura = (x) => {
            const y = (x * tanAngulo) - (parteDaFormula * Math.pow(x, 2));
            return y >= 0 ? y : 0;
        };

        trajectoryData.push(
            { x: 0, y: 0 },
            { x: distancia * 0.25, y: calcularAltura(distancia * 0.25) },
            { x: distancia * 0.50, y: alturaMaxima },
            { x: distancia * 0.75, y: calcularAltura(distancia * 0.75) },
            { x: distancia, y: 0 }
        );

        if (meuGraficoModal) meuGraficoModal.destroy();

        meuGraficoModal = new Chart(modalCtx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Altura (m)',
                    data: trajectoryData,
                    borderColor: '#333',
                    backgroundColor: 'rgba(51, 51, 51, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#333'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1,
                plugins: {
                    title: { display: true, text: 'Trajetória do Foguete (Altura vs. Distância)', color: '#3f3f3f', font: { size: 16, weight: 'bold' } },
                    legend: { labels: { color: '#3f3f3f', font: { weight: 'bold' } } },
                    tooltip: { events: ['click'] }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Distância (m)', color: '#3f3f3f', font: { weight: 'bold' } },
                        min: 0,
                        max: 200,
                        ticks: { stepSize: 20, color: '#000000ff', font: { weight: 'bold' } },
                        grid: { lineWidth: 1, color: '#000000ff' }
                    },
                    y: {
                        type: 'linear',
                        title: { display: true, text: 'Altura (m)', color: '#3f3f3f', font: { weight: 'bold' } },
                        beginAtZero: true,
                        max: 150,
                        ticks: { stepSize: 25, color: '#000000ff', font: { weight: 'bold' } },
                        grid: { lineWidth: 1, color: '#000000ff' }
                    }
                }
            }
        });
        esconderLoading();
        abrirModal(modalResultados);
        modalCanvas.style.display = 'block';
        modalBtnDownload.style.display = 'block';
    }

    form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const pressaoPSI = parseFloat(document.getElementById('pressao').value);
        const massaTotalG = parseFloat(document.getElementById('massaTotal').value);
        const angulo = parseFloat(document.getElementById('angulo').value);
        const distancia = parseFloat(document.getElementById('distancia').value);

        if (isNaN(angulo) || isNaN(distancia)) {
            customAlert('Dados Inválidos', 'Por favor, insira valores válidos para Ângulo e Distância.');
            return;
        }
        if (isNaN(pressaoPSI) || isNaN(massaTotalG)) {
            customAlert('Dados Inválidos', 'Por favor, preencha também a Pressão e a Massa para os cálculos teóricos.');
            return;
        }

        mostrarLoading();

        setTimeout(() => {
            const g = 9.81;
            const anguloRad = angulo * (Math.PI / 180);
            const velocidadeSaida = Math.sqrt((distancia * g) / Math.sin(2 * anguloRad));
            const alturaMaxima = (Math.pow(velocidadeSaida, 2) * Math.pow(Math.sin(anguloRad), 2)) / (2 * g);
            const pressaoPa = pressaoPSI * 6894.76;
            const massaTotalKg = massaTotalG / 1000;
            const diametroBocalM = 0.021;
            const raioBocalM = diametroBocalM / 2;
            const areaBocal = Math.PI * Math.pow(raioBocalM, 2);
            const forca = pressaoPa * areaBocal;
            const aceleracao = massaTotalKg > 0 ? forca / massaTotalKg : 0;

            exibirResultados(angulo, distancia, alturaMaxima, velocidadeSaida, forca, aceleracao);

            const dadosParaSalvar = {
                angle: angulo,
                distance: distancia,
                max_height: alturaMaxima,
                velocity: velocidadeSaida,
                force: forca,
                acceleration: aceleracao,
                pressure: pressaoPSI,
                mass: massaTotalG
            };
            salvarLancamento(dadosParaSalvar);

        }, 2000);
    });

    btnHistorico.addEventListener('click', async () => {
        try {
            mostrarLoading();
            const statusResponse = await fetch('https://rocket-laucher-backend.onrender.com/api/database/status');
            const statusData = await statusResponse.json();
            dbStatusContainer.innerHTML = '';
            if (statusData.status === 'quase cheio') {
                dbStatusContainer.innerHTML = `<div class="db-status-warning">Atenção: O armazenamento de dados está quase cheio (${statusData.usage_percentage}% utilizado).</div>`;
            }
            const response = await fetch('https://rocket-laucher-backend.onrender.com/api/launches');
            if (!response.ok) throw new Error('Falha ao buscar o histórico.');
            const historico = await response.json();

            historicoContainer.innerHTML = '';
            if (historico.length === 0) {
                historicoContainer.innerHTML = '<p>Nenhum lançamento encontrado.</p>';
            } else {
                const lista = document.createElement('ul');
                historico.forEach(lancamento => {
                    const item = document.createElement('li');
                    item.classList.add('historico-item');
                    const infoSpan = document.createElement('span');
                    const dataFormatada = new Date(lancamento.created_at).toLocaleString('pt-BR');
                    infoSpan.textContent = `Data: ${dataFormatada} | Pressão: ${lancamento.pressure} PSI | Massa: ${lancamento.mass}g | Ângulo: ${lancamento.angle}°`;
                    infoSpan.style.cursor = 'pointer';

                    Object.keys(lancamento).forEach(key => {
                        infoSpan.dataset[key] = lancamento[key];
                    });

                    infoSpan.addEventListener('click', () => {
                        fecharModal(modalHistorico);
                        mostrarLoading();
                        setTimeout(() => {
                            exibirResultados(
                                parseFloat(infoSpan.dataset.angle),
                                parseFloat(infoSpan.dataset.distance),
                                parseFloat(infoSpan.dataset.max_height),
                                parseFloat(infoSpan.dataset.velocity),
                                parseFloat(infoSpan.dataset.force),
                                parseFloat(infoSpan.dataset.acceleration)
                            );
                        }, 500);
                    });
                    const btnApagar = document.createElement('button');
                    btnApagar.classList.add('btn-apagar');
                    btnApagar.textContent = 'X';
                    btnApagar.dataset.id = lancamento.id;
                    btnApagar.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const confirmado = await customConfirm('Apagar Lançamento', 'Tem certeza que deseja apagar este lançamento? Esta ação não pode ser desfeita.');
                        if (confirmado) {
                            const id = e.target.dataset.id;
                            try {
                                const deleteResponse = await fetch(`https://rocket-laucher-backend.onrender.com/api/launches/${id}`, {
                                    method: 'DELETE',
                                });
                                if (!deleteResponse.ok) throw new Error('Falha ao apagar.');
                                e.target.parentElement.remove();
                            } catch (err) {
                                customAlert('Erro', 'Não foi possível apagar o lançamento.');
                            }
                        }
                    });
                    item.appendChild(infoSpan);
                    item.appendChild(btnApagar);
                    lista.appendChild(item);
                });
                historicoContainer.appendChild(lista);
            }
            esconderLoading();
            abrirModal(modalHistorico);
        } catch (error) {
            esconderLoading();
            console.error('Erro:', error);
            customAlert('Erro de Conexão', 'Não foi possível buscar o histórico. Verifique com o desenvolvedor se o servidor está rodando.');
        }
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            fecharModal(modalResultados);
            fecharModal(modalHistorico);
            fecharModal(popup);
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target == modalResultados || event.target == modalHistorico || event.target == popup) {
            fecharModal(modalResultados);
            fecharModal(modalHistorico);
            fecharModal(popup);
        }
    });

    modalBtnDownload.addEventListener('click', () => {
        if (!meuGraficoModal) return;
        const canvasOriginal = meuGraficoModal.canvas;
        const canvasTemporario = document.createElement('canvas');
        const larguraTotalImagem = 1500;
        const alturaTotalImagem = 900;
        const larguraAreaTexto = 600;
        const espacamentoEntreColunas = 80;
        const padding = 60;
        canvasTemporario.width = larguraTotalImagem;
        canvasTemporario.height = alturaTotalImagem;
        const ctxTemp = canvasTemporario.getContext('2d');
        const gradiente = ctxTemp.createLinearGradient(0, 0, 0, alturaTotalImagem);
        gradiente.addColorStop(0, "#dadadaff");
        gradiente.addColorStop(1, "#c5c6c7ff");
        ctxTemp.fillStyle = gradiente;
        ctxTemp.fillRect(0, 0, canvasTemporario.width, canvasTemporario.height);
        const caixaLargura = larguraAreaTexto - 10;
        const caixaAltura = alturaTotalImagem - (padding * 2);
        ctxTemp.fillStyle = "#ffffffe6";
        ctxTemp.roundRect(padding / 2, padding, caixaLargura, caixaAltura, 20);
        ctxTemp.fill();
        ctxTemp.fillStyle = "#1f1f1f";
        ctxTemp.font = "bold 50px 'Segoe UI', Arial, sans-serif";
        ctxTemp.textAlign = "left";
        ctxTemp.fillText("Trajetória do Foguete", padding + 20, padding + 60);
        ctxTemp.font = "bold 36px 'Segoe UI', Arial, sans-serif";
        ctxTemp.fillStyle = "#333";

        const alturaTextoStr = `Altura Máxima: ${modalAlturaMaximaEl.textContent} m`;
        const anguloTextoStr = `Angulação: ${modalAnguloEl.textContent}°`;
        const distanciaTextoStr = `Distância: ${modalDistanciaEl.textContent} m`;
        const velocidadeTextoStr = `Velocidade de Saída: ${modalVelocidadeEl.textContent} m/s`;
        const forcaTextoStr = `Força Teórica: ${modalForcaEl.textContent} N`;
        const aceleracaoTextoStr = `Aceleração Teórica: ${modalAceleracaoEl.textContent} m/s²`;

        const linhaAltura = 65;
        let yTexto = padding + 140;

        ctxTemp.fillText(alturaTextoStr, padding + 20, yTexto);
        yTexto += linhaAltura;
        ctxTemp.fillText(distanciaTextoStr, padding + 20, yTexto);
        yTexto += linhaAltura;
        ctxTemp.fillText(anguloTextoStr, padding + 20, yTexto);
        yTexto += linhaAltura;
        ctxTemp.fillText(velocidadeTextoStr, padding + 20, yTexto);
        yTexto += linhaAltura;
        ctxTemp.fillText(forcaTextoStr, padding + 20, yTexto);
        yTexto += linhaAltura;
        ctxTemp.fillText(aceleracaoTextoStr, padding + 20, yTexto);

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

    function mostrarLoading() {
        loadingScreen.style.display = 'flex';
    }

    function esconderLoading() {
        loadingScreen.style.display = 'none';
    }
});

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