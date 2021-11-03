const bancodedados = require('../src/bancodedados');
const { format } = require('date-fns');
const { contas, saques, depositos, transferencias, banco } = bancodedados;

function verificaNumeroConta(contas, numeroConta) {
  let numerosDeContas = [];

  if (isNaN(numeroConta)) {
    return 'Informe um número de conta válido!';
  }

  for (let x of contas) {
    numerosDeContas.push(x.numero);
  }

  if (!numerosDeContas.includes(numeroConta)) {
    return 'Numero da conta não encontrado!';
  }
}

function verificarCpf(cpf) {
  cpf = cpf.toString();
  if (cpf.length !== 11 || isNaN(cpf)) {
    return 'O Cpf deve possuir 11 números e apenas números!';
  }

  const caracteresIguais = cpf.split('').every(x => x === cpf[0]);
  if (caracteresIguais) {
    return 'Cpf invalido!';
  }
  let soma = 0, indice = 0;

  for (let x = 10; x >= 2; x--) {
    soma += cpf[indice] * x;
    indice++;
  }

  let resto = (soma * 10) % 11;
  if (resto > 9) resto = 0;
  if (resto !== Number(cpf[9])) return 'Cpf invalido!';

  soma = 0, indice = 0;

  for (let x = 11; x >= 2; x--) {
    soma += cpf[indice] * x;
    indice++;
  }

  resto = (soma * 10) % 11;
  if (resto > 9) resto = 0;
  if (resto !== Number(cpf[10])) return 'Cpf invalido!';
}

function encontrarIndice(contas, numeroConta) {
  let indice = 0;
  for (let x of contas) {
    if (x.numero === numeroConta) {
      indice = contas.indexOf(x);
      return indice;
    }
  }
}

function verificaSenha(contas, indice, senha) {
  if (contas[indice].usuario.senha !== senha) {
    return 'A senha informada está incorreta!';
  }
}

const listarContas = (req, res) => {
  const senhaBanco = req.query.senha_banco;

  if (!senhaBanco) {
    return res.status(401).json({ mensagem: 'Informe a senha do banco!' });
  }

  if (senhaBanco !== banco.senha) {
    return res.status(401).json({ mensagem: 'A senha do banco informada é inválida!' });
  } else {
    return res.status(200).json(contas);
  }
}

let idConta = contas.length + 1;

const criarConta = (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;
  const erroCpf = verificarCpf(cpf);

  if (erroCpf) return res.status(400).json({ mensagem: erroCpf });

  if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
    return res.status(400).json({ mensagem: 'Preencha todos os campos corretamente!' });
  }

  const novoUsuario = {
    numero: idConta,
    saldo: 0,
    usuario: {
      nome,
      cpf,
      data_nascimento,
      telefone,
      email,
      senha
    }
  }

  if (!contas.length) {
    contas.push(novoUsuario);
    idConta++;
    return res.status(204).json();
  } else {
    for (let x of contas) {
      if (x.usuario.cpf === cpf) {
        return res.status(400).json({ mensagem: 'O cpf informado já pertence a outra conta!' });
      }
      if (x.usuario.email === email) {
        return res.status(400).json({ mensagem: 'O email informado já pertence a outra conta!' });
      }
    }
    contas.push(novoUsuario);
    idConta++;
    return res.status(204).json();
  }
}

const atualizarConta = (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;
  const numeroConta = Number(req.params.numeroConta);
  const erroNumeroConta = verificaNumeroConta(contas, numeroConta);
  const erroCpf = verificarCpf(cpf);

  if (erroNumeroConta) {
    return res.status(404).json({ mensagem: erroNumeroConta });
  }

  if (erroCpf) return res.status(400).json({ mensagem: erroCpf });

  if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
    return res.status(400).json({ mensagem: 'Preencha todos os campos corretamente!' });
  }

  for (let x of contas) {
    if (x.usuario.cpf === cpf) {
      if (x.numero !== numeroConta) {
        return res.status(400).json({ mensagem: 'O cpf informado já pertence a outra conta!' });
      }
    }
    if (x.usuario.email === email) {
      if (x.numero !== numeroConta) {
        return res.status(400).json({ mensagem: 'O email informado já pertence a outra conta!' });
      }
    }
  }
  for (let x of contas) {
    if (x.numero === numeroConta) {
      x.usuario = {
        nome,
        cpf,
        data_nascimento,
        telefone,
        email,
        senha
      }
    }
  }
  return res.status(204).json();
}

const deletarConta = (req, res) => {
  const numeroConta = Number(req.params.numeroConta);

  const erroNumeroConta = verificaNumeroConta(contas, numeroConta);
  if (erroNumeroConta) {
    return res.status(404).json({ mensagem: erroNumeroConta });
  }

  for (let x of contas) {
    if (x.numero === numeroConta) {
      if (x.saldo !== 0) {
        res.status(400).json({ mensagem: 'Não é possível deletar uma conta com saldo diferente de 0!' });
      } else {
        const indice = contas.indexOf(x);
        contas.splice(indice, 1);
        return res.status(204).json();
      }
    }
  }
}

const fazerDeposito = (req, res) => {
  const { numero_conta, valor } = req.body;

  if (!numero_conta || !valor) {
    return res.status(400).json({ mensagem: 'Preencha o numero da conta e o valor corretamente!' });
  } else {
    if (typeof numero_conta !== 'number' || typeof valor !== 'number') {
      res.status(400).json({ mensagem: 'Preencha os campos numero da conta e valor somente com números!' });
    }
  }

  const erroNumeroConta = verificaNumeroConta(contas, numero_conta);
  if (erroNumeroConta) {
    return res.status(404).json({ mensagem: erroNumeroConta });
  }

  let indice = encontrarIndice(contas, numero_conta);

  if (valor <= 0) {
    return res.status(400).json({ mensagem: 'O valor de depósito deve ser maior que 0!' });
  }

  const novoDeposito = {
    data: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    numero_conta,
    valor
  }

  depositos.push(novoDeposito);
  contas[indice].saldo += valor;
  return res.status(204).json();
}

const fazerSaque = (req, res) => {
  const { numero_conta, valor, senha } = req.body;

  if (!numero_conta || !valor || !senha) {
    res.status(400).json({ mensagem: 'Preencha o numero da conta, valor e senha corretamente!' });
  }

  if (typeof numero_conta !== 'number' || typeof valor !== 'number') {
    res.status(400).json({ mensagem: 'Preencha os campos numero da conta e valor somente com números!' });
  }

  const erroNumeroConta = verificaNumeroConta(contas, numero_conta);
  if (erroNumeroConta) {
    return res.status(404).json({ mensagem: erroNumeroConta });
  }

  let indice = encontrarIndice(contas, numero_conta);

  const erroSenha = verificaSenha(contas, indice, senha);
  if (erroSenha) {
    return res.status(400).json({ mensagem: erroSenha });
  }

  if (valor <= 0) {
    return res.status(400).json({ mensagem: 'O valor de saque deve ser maior que 0!' });
  }

  if (contas[indice].saldo < valor) {
    return res.status(400).json({ mensagem: 'Saldo menor que o valor do saque!' });
  }

  const novoSaque = {
    data: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    numero_conta,
    valor
  }

  saques.push(novoSaque);
  contas[indice].saldo -= valor;
  return res.status(204).json();
}

const fazerTranferencia = (req, res) => {
  const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;

  if (!numero_conta_origem || !numero_conta_destino || !valor || !senha) {
    res.status(400).json({ mensagem: 'Preencha o numero da conta origem, conta destino, valor e senha corretamente!' });
  }

  if (typeof numero_conta_origem !== 'number' || typeof numero_conta_destino !== 'number' || typeof valor !== 'number') {
    res.status(400).json({ mensagem: 'Preencha os campos numero da conta origem, conta destino e valor somente com números!' });
  }

  let indiceOrigem = encontrarIndice(contas, numero_conta_origem);
  let indiceDestino = encontrarIndice(contas, numero_conta_destino);

  if (numero_conta_origem === numero_conta_destino) {
    return res.status(400).json({ mensagem: 'Os números da conta origem e conta destino não podem ser iguais!' });
  }

  const erroNumeroContaOrigem = verificaNumeroConta(contas, numero_conta_origem);
  if (erroNumeroContaOrigem) {
    return res.status(404).json({ mensagem: `Erro na conta de origem. ${erroNumeroContaOrigem}` });
  }

  const erroNumeroContaDestino = verificaNumeroConta(contas, numero_conta_destino);
  if (erroNumeroContaDestino) {
    return res.status(404).json({ mensagem: `Erro na conta de destino. ${erroNumeroContaDestino}` });
  }

  const erroSenha = verificaSenha(contas, indiceOrigem, senha);
  if (erroSenha) {
    return res.status(400).json({ mensagem: erroSenha });
  }

  if (valor <= 0) {
    return res.status(400).json({ mensagem: 'O valor da transferência deve ser maior que 0!' });
  }

  if (contas[indiceOrigem].saldo < valor) {
    return res.status(400).json({ mensagem: 'Saldo menor que o valor da transferência!' });
  }

  const novaTransf = {
    data: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    numero_conta_origem,
    numero_conta_destino,
    valor
  }

  transferencias.push(novaTransf);
  contas[indiceOrigem].saldo -= valor;
  contas[indiceDestino].saldo += valor;
  return res.status(204).json();
}

const consultarSaldo = (req, res) => {
  const { senha } = req.query;
  let { numero_conta } = req.query;
  numero_conta = Number(numero_conta);

  if (!numero_conta || !senha) {
    return res.status(400).json({ mensagem: 'Os parâmetros numero da conta e senha são obrigatórios!' });
  }

  const erroNumeroConta = verificaNumeroConta(contas, numero_conta);
  if (erroNumeroConta) {
    return res.status(404).json({ mensagem: erroNumeroConta });
  }

  let indice = encontrarIndice(contas, numero_conta);

  const erroSenha = verificaSenha(contas, indice, senha);
  if (erroSenha) {
    return res.status(400).json({ mensagem: erroSenha });
  }

  res.status(200).json({ saldo: contas[indice].saldo });
}

const consultarExtrato = (req, res) => {
  const { senha } = req.query;
  let { numero_conta } = req.query;
  numero_conta = Number(numero_conta);

  if (!numero_conta || !senha) {
    return res.json({ mensagem: 'Os parâmetros numero da conta e senha são obrigatórios!' });
  }

  const erroNumeroConta = verificaNumeroConta(contas, numero_conta);
  if (erroNumeroConta) {
    return res.status(404).json({ mensagem: erroNumeroConta });
  }

  let indice = encontrarIndice(contas, numero_conta);

  const erroSenha = verificaSenha(contas, indice, senha);
  if (erroSenha) {
    return res.status(400).json({ mensagem: erroSenha });
  }

  const seusDepositos = [];
  for (let x of depositos) {
    if (x.numero_conta === numero_conta) {
      seusDepositos.push(x);
    }
  }

  const seusSaques = [];
  for (let x of saques) {
    if (x.numero_conta === numero_conta) {
      seusSaques.push(x);
    }
  }

  const transferenciasRecebidas = [];
  for (let x of transferencias) {
    if (x.numero_conta_destino === numero_conta) {
      transferenciasRecebidas.push(x);
    }
  }

  const transferenciasEnviadas = [];
  for (let x of transferencias) {
    if (x.numero_conta_origem === numero_conta) {
      transferenciasEnviadas.push(x);
    }
  }

  res.status(200).json({
    depositos: seusDepositos,
    saques: seusSaques,
    transferenciasEnviadas,
    transferenciasRecebidas
  });
}

module.exports = {
  listarContas,
  criarConta,
  atualizarConta,
  deletarConta,
  fazerDeposito,
  fazerSaque,
  fazerTranferencia,
  consultarSaldo,
  consultarExtrato
}