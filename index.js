import express from 'express';
import wppconnect from '@wppconnect-team/wppconnect';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// guarda o último QR para você abrir em /qr
let latestQR = null;

wppconnect.create({
  session: 'bot-session',
  // salva o QR em base64 para exibirmos via HTTP
  catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
    latestQR = base64Qr;
    console.log('QR atualizado. Acesse /qr para escanear.');
  },
  puppeteerOptions: {
    // flags necessárias em PaaS
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  // recomendações úteis em produção
  // logQR: false, // já estamos tratando o QR via catchQR
  disableWelcome: true
})
.then((client) => start(client))
.catch((e) => console.error('Erro ao criar sessão WPP:', e));

function start(client) {
  console.log('Bot iniciado e aguardando mensagens…');

  client.onMessage(async (message) => {
    if (message.isGroupMsg) return;

    const body = (message.body || '').trim().toLowerCase();

    if (body === 'menu' || body === 'oi' || body === 'olá' || body === 'ola') {
      await client.sendText(
        message.from,
        'Olá! Escolha uma opção:\n1 – Horários\n2 – Endereço\n3 – Falar com atendente'
      );
      return;
    }

    if (body === '1') {
      await client.sendText(message.from, 'Horários: Seg a Sex – 14h às 20h');
      return;
    }

    if (body === '2') {
      await client.sendText(message.from, 'Endereço: Rua X, 123 – BH');
      return;
    }

    if (body === '3') {
      await client.sendText(message.from, 'Um atendente irá te responder em breve.');
      return;
    }
  });
}

// rota de saúde
app.get('/', (req, res) => {
  res.send('Bot WhatsApp rodando. Vá em /qr para conectar.');
});

// exibe o QR atual (base64) para você escanear
app.get('/qr', (req, res) => {
  if (!latestQR) {
    return res
      .status(200)
      .send('<p>QR ainda não gerado. Aguarde alguns segundos e atualize.</p>');
  }
  res
    .status(200)
    .send(
      `<div style="font-family: system-ui; text-align:center">
         <h1>Escaneie no WhatsApp → Aparelhos conectados</h1>
         <img src="data:image/png;base64,${latestQR}" style="max-width:320px; width:100%; image-rendering: pixelated;" />
         <p>Se expirar, recarregue a página.</p>
       </div>`
    );
});

app.listen(PORT, () => {
  console.log(`Servidor Express ON na porta ${PORT}`);
});
