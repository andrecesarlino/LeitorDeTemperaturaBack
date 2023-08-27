import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import WebSocket from 'ws';
import fastify from 'fastify';
import fastifyCors from '@fastify/cors';

const app = fastify();
const wss = new WebSocket.Server({ noServer: true });
const port = new SerialPort({
  path: 'COM5',
  baudRate: 9600,
  autoOpen: true
});

let ldrValue, umidadeValue, temperaturaValue; // Declaração das variáveis globais

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

app.register(fastifyCors, {
  origin: 'http://localhost:3000', // Configure a origem permitida (seu frontend)
});

port.on('open', () => {
  console.log('Serial Port Open');
  parser.on('data', data => {
    // Separar as linhas de dados
    const values = data.trim().split(' ');

    if (values.length === 3) {
      // Verificar se todos os valores são números válidos
      const areAllValuesValid = values.every(value => !isNaN(parseFloat(value)));

      if (areAllValuesValid) {
        [ldrValue, umidadeValue, temperaturaValue] = values.map(parseFloat); // Atribuição das variáveis globais

        // Exibir os valores
        console.log('Valor lido pelo LDR:', ldrValue);
        console.log('Umidade:', umidadeValue, '%');
        console.log('Temperatura:', temperaturaValue, '°C');

        // Enviar os valores para os clientes WebSocket
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(data);
          }
        });
      } else {
        console.log('Valores inválidos recebidos.');
      }
    } else {
      console.log('Dados inválidos recebidos.');
    }
  });
});

wss.on('connection', ws => {
  console.log('WebSocket connection opened');
});

// Rota para enviar os valores
app.get('/dados', (request, reply) => {
  if (port.isOpen) {
    const dataToSend = {
      ldrValue,
      umidadeValue,
      temperaturaValue
    };

    reply.send(dataToSend);
  } else {
    reply.code(500).send({ error: 'A porta serial não está aberta.' });
  }
});

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('HTTP Server Running!')
  })