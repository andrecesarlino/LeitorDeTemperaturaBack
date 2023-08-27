import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });
const port = new SerialPort({
  path: 'COM5',
  baudRate: 9600,
  autoOpen: true
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.on('open', () => {
  console.log('Serial Port Open');
  parser.on('data', data => {
    // Depure os dados recebidos
    //console.log('Dados recebidos:', data);

    // Separar as linhas de dados
    const values = data.trim().split(' ');

    if (values.length === 3) {
      // Verificar se todos os valores são números válidos
      const areAllValuesValid = values.every(value => !isNaN(parseFloat(value)));

      if (areAllValuesValid) {
        const [ldrValue, umidadeValue, temperaturaValue] = values.map(parseFloat);

        // Exibir os valores
        console.log('Valor lido pelo LDR:', ldrValue);
        console.log('Umidade:', umidadeValue, '%');
        console.log('Temperatura:', temperaturaValue, '°C');

        // Agora você pode salvar esses valores em variáveis ou fazer o que desejar com eles.

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
