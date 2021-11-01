const express = require('express');
const { listarContas, criarConta, atualizarConta, deletarConta, fazerDeposito, fazerSaque, fazerTranferencia, consultarSaldo, consultarExtrato } = require('./controladores/banco');

const roteador = express();

roteador.get('/contas', listarContas);
roteador.post('/contas', criarConta);
roteador.put('/contas/:numeroConta/usuario', atualizarConta);
roteador.delete('/contas/:numeroConta', deletarConta);
roteador.post('/transacoes/depositar', fazerDeposito);
roteador.post('/transacoes/sacar', fazerSaque);
roteador.post('/transacoes/transferir', fazerTranferencia);
roteador.get('/contas/saldo', consultarSaldo);
roteador.get('/contas/extrato', consultarExtrato);

module.exports = roteador;