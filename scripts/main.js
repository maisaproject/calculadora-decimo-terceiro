document.addEventListener('DOMContentLoaded', function() {
    const salarioInput = document.getElementById('salarioBruto');
    const mesesInput = document.getElementById('mesesTrabalhados');
    const dependentesInput = document.getElementById('numeroDependentes');
    const parcelasSelect = document.getElementById('numeroParcelas');
    const btnCalcular = document.getElementById('calcular');
    const btnLimpar = document.getElementById('limpar');
    const resultadoContainer = document.getElementById('resultado-container');
    const resultadoPrimeira = document.getElementById('resultado-primeira-parcela');
    const resultadoSegunda = document.getElementById('resultado-segunda-parcela');
    const resultadoBruto = document.getElementById('resultado-total-bruto');
    const resultadoLiquido = document.getElementById('resultado-total-liquido');
    const resultadoInss = document.getElementById('resultado-inss');
    const resultadoIrrf = document.getElementById('resultado-irrf');
    const loadingElement = document.querySelector('.loading');
    const parcela1Item = document.getElementById('parcela-1-item');
    const parcela2Item = document.getElementById('parcela-2-item');

    // Formatação de moeda
    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    // Validar entrada
    function validarEntrada() {
        if (!salarioInput.value || parseFloat(salarioInput.value) <= 0) {
            alert('Por favor, informe um salário bruto válido.');
            salarioInput.focus();
            return false;
        }

        const meses = parseInt(mesesInput.value);
        if (isNaN(meses) || meses < 1 || meses > 12) {
            alert('Por favor, informe meses trabalhados entre 1 e 12.');
            mesesInput.focus();
            return false;
        }

        return true;
    }

    // Mostrar loading
    function mostrarLoading() {
        loadingElement.style.display = 'block';
        resultadoContainer.style.display = 'none';
    }

    // Esconder loading
    function esconderLoading() {
        loadingElement.style.display = 'none';
    }

    // CÁLCULO DE INSS
    function calcularINSS(base) {
        // === TABELA INSS 2025
        const faixasINSS = [
            { limite: 1518.00, aliquota: 0.075 },
            { limite: 2793.88, aliquota: 0.09 },
            { limite: 4190.83, aliquota: 0.12 },
            { limite: 8157.41, aliquota: 0.14 }
        ];

        let restante = base;
        let totalINSS = 0;
        let anterior = 0;

        for (let i = 0; i < faixasINSS.length && restante > 0; i++) {
            const faixa = faixasINSS[i];
            const faixaValor = Math.min(faixa.limite - anterior, restante);
            totalINSS += faixaValor * faixa.aliquota;
            restante -= faixaValor;
            anterior = faixa.limite;
        }

        return totalINSS;
    }

    // CÁLCULO DE IRRF
    function calcularIRRF(baseIRRF, dependentes = 0) {
        // Dedução por dependente
        const deducaoDependentes = dependentes * 189.59;
        
        // Base de cálculo do IRRF
        const baseCalculo = Math.max(0, baseIRRF - deducaoDependentes);

        // === TABELA IRRF 13º - 2025 ===
        const faixasIRRF = [
            { min: 0, max: 2428.80, aliquota: 0, deducao: 0 },
            { min: 2428.80, max: 2826.65, aliquota: 0.075, deducao: 182.16 },
            { min: 2826.66, max: 3751.05, aliquota: 0.15, deducao: 394.16 },
            { min: 3751.06, max: 4664.68, aliquota: 0.225, deducao: 675.49 },
            { min: 4664.69, max: Infinity, aliquota: 0.275, deducao: 908.73 }
        ];

        let irrf = 0;
        for (const faixa of faixasIRRF) {
            if (baseCalculo >= faixa.min && baseCalculo <= faixa.max) {
                irrf = (baseCalculo * faixa.aliquota) - faixa.deducao;
                irrf = Math.max(0, irrf); // Garante que IRRF não fique negativo
                break;
            }
        }

        return irrf;
    }

    // Calcular décimo terceiro
    function calcularDecimoTerceiro() {
        if (!validarEntrada()) {
            return;
        }

        mostrarLoading();

        // Usar setTimeout para dar tempo de mostrar a animação de loading
        setTimeout(() => {
            const salario = parseFloat(salarioInput.value);
            const meses = parseInt(mesesInput.value);
            const dependentes = parseInt(dependentesInput.value);
            const parcelas = parseInt(parcelasSelect.value);

            // Cálculo do 13º proporcional (conforme exemplo)
            const decimoTerceiroBruto = (salario * meses) / 12;

            // Cálculo do INSS sobre o 13º bruto
            const inssDesconto = calcularINSS(decimoTerceiroBruto);

            // Base de cálculo do IRRF (após INSS)
            const baseIRRF = decimoTerceiroBruto - inssDesconto;

            // Cálculo do IRRF
            const irrfDesconto = calcularIRRF(baseIRRF, dependentes);

            // Calcular valor líquido
            const decimoTerceiroLiquido = decimoTerceiroBruto - inssDesconto - irrfDesconto;

            // Exibir resultados principais
            resultadoBruto.textContent = formatarMoeda(decimoTerceiroBruto);
            resultadoInss.textContent = formatarMoeda(inssDesconto);
            resultadoIrrf.textContent = formatarMoeda(irrfDesconto);

            if (parcelas === 2) {
                const primeiraParcela = decimoTerceiroBruto / 2;
                const segundaParcela = decimoTerceiroLiquido - primeiraParcela;
                
                resultadoPrimeira.textContent = formatarMoeda(primeiraParcela);
                resultadoSegunda.textContent = formatarMoeda(segundaParcela);
                resultadoLiquido.textContent = formatarMoeda(decimoTerceiroLiquido);
                
                parcela1Item.style.display = 'flex';
                parcela2Item.style.display = 'flex';
            } else {
                resultadoLiquido.textContent = formatarMoeda(decimoTerceiroLiquido);
                parcela1Item.style.display = 'none';
                parcela2Item.style.display = 'none';
            }

            resultadoContainer.style.display = 'block';
            esconderLoading();

            // Rolar suavemente para o resultado
            resultadoContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 800);
    }

    // Limpar formulário
    function limparFormulario() {
        salarioInput.value = '';
        mesesInput.value = '12';
        dependentesInput.value = '0';
        parcelasSelect.value = '1';
        resultadoContainer.style.display = 'none';
        salarioInput.focus();
    }

    // Event Listeners
    btnCalcular.addEventListener('click', calcularDecimoTerceiro);
    btnLimpar.addEventListener('click', limparFormulario);

    // Permitir calcular com Enter
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calcularDecimoTerceiro();
        }
    });

    // Melhorar a experiência em dispositivos móveis
    if ('ontouchstart' in document.documentElement) {
        document.querySelectorAll('input, select').forEach(element => {
            element.addEventListener('focus', function() {
                setTimeout(() => {
                    this.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 300);
            });
        });
    }
});