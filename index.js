import express from 'express';
import wppconnect from '@wppconnect-team/wppconnect';

const app = express();
app.use(express.json());

wppconnect.create({
  session: 'bot-session',
  puppeteerOptions: {
    args: ['--no-sandbox'],
  }
})
.then((client) => start(client))
.catch((e) => console.log(e));

function start(client) {
  client.onMessage(async (message) => {
    if (!message.isGroupMsg) {
      
      if (message.body.toLowerCase() === 'menu') {
        await client.sendText(
          message.from,
          'Olá! Escolha uma opção:\n1 – Horários\n2 – Endereço\n3 – Falar com atendente'
        );
      }

      if (message.body === '1') {
        await client.sendText(message.from, 'Horários: Seg a Sex – 14h às 20h');
      }

      if (message.body === '2') {
        await client.sendText(message.from, 'Endereço: Rua X, 123 – BH');
      }

      if (message.body === '3') {
        await client.sendText(message.from, 'Um atendente irá te responder em breve.');
      }
    }
  });

  console.log('Bot iniciado!');
}

app.get('/', (req, res) => {
  res.send('Bot WhatsApp rodando!');
});

app.listen(3000, () => console.log('Servidor Express ON'));
