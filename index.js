import express from 'express';
import wppconnect from '@wppconnect-team/wppconnect';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// guarda o último QR para você abrir em /qr
let latestQR = null;

// ... seu wppconnect.create({ catchQR: (base64Qr) => { latestQR = base64Qr; console.log('QR atualizado. Acesse /qr'); }, ... })

// ROTA QUE ENTREGA A IMAGEM COMO PNG (sem riscos de prefixo/linhas)
app.get('/qr.png', (req, res) => {
  if (!latestQR) {
    return res.status(204).end(); // sem conteúdo (ainda)
  }
  // remove prefixo, se existir, e transforma em binário
  const b64 = latestQR.replace(/^data:image\/png;base64,/, '');
  const buf = Buffer.from(b64, 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.send(buf);
});

// PÁGINA HTML QUE APONTA PARA /qr.png
app.get('/qr', (req, res) => {
  res.status(200).send(`
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <div style="font-family: system-ui; text-align:center; padding:24px">
      <h1>Escaneie no WhatsApp → Aparelhos conectados</h1>
      <p>Se a imagem não aparecer de primeira, aguarde alguns segundos. Ela atualiza sozinha.</p>
      <img id="qri" alt="QR Code" style="max-width:320px; width:100%; image-rendering: pixelated; border:1px solid #eee;"/>
      <p id="status" style="opacity:.7"></p>
    </div>
    <script>
      const img = document.getElementById('qri');
      const st  = document.getElementById('status');
      function loadQR() {
        // cache-busting
        img.src = '/qr.png?ts=' + Date.now();
      }
      img.onerror = () => { st.textContent = 'Aguardando geração do QR…'; };
      img.onload  = () => { st.textContent = 'QR pronto. Abra o WhatsApp > Aparelhos conectados > Conectar.'; };
      loadQR();
      // revalida a cada 5s (se expirar, se renova)
      setInterval(loadQR, 5000);
    </script>
  `);
});

wppconnect.create({
  session: 'bot-session',
  // salva o QR em base64 para exibirmos via HTTP
  session: 'bot-session',
  catchQR: (base64Qr) => { latestQR = base64Qr; console.log('QR atualizado. Acesse /qr'); },
  puppeteerOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  },
  disableWelcome: true,
  autoClose: 0
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
