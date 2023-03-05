const documento = process.argv[2];
const instalacao = process.argv[3];
const path = process.argv[4];

//Parametros Login ------------------------------------------
// var documento = "17428731000569";
// var instalacao = "3001017419";
//var path = "C:\\Guiando\\Downloads\\Bot_WhatsApp\\";
//Enviar QrCode-----------------------------------------------
const numeroWhatsAppCemig = "+553135061160"; //BotCemig
//const numeroWhatsAppCemig = "+14155238886"; //TesteTwilio
const numeroWhatsAppEnviarQrCode = "+5522981389753";
const numeroWhatsAppTwilio = "+14155238886";
const accountSidTwilio = 'AC76464311c5f04f1b6ec87ab204ba2a96';
const authTokenTwilio = '04fc228a3022638485aa27b531be4647';

//Run----------------------------------------------------------
const fs = require('fs');
const pathBiblioteca = require("path");
const qrcode = require('qrcode-terminal');
start = false;

const { Client, LocalAuth } = require('whatsapp-web.js');//path completo
const client = new Client({
    //puppeteer: { headless: false }, 
    //authStrategy: new LocalAuth()
    authStrategy: new LocalAuth({ clientId: "TesteProducao1" })
    //authStrategy: new LocalAuth({ clientId: "TesteProducao1", dataPath:"D:\\Services\\Node\\WhatsAppNode\\.wwebjs_auth\\"})//SERVIDOR
    //authStrategy: new LocalAuth({ clientId: "TesteProducao1", dataPath:"C:\\Guiando\\Crawlers\\Cemig_Node\\.wwebjs_auth\\"})//LOCAL
    //authStrategy: new NoAuth()
});
console.log(client);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const clientTwilio = require('twilio')(accountSidTwilio, authTokenTwilio);

client.on('qr', qr => {// Qr code + twilio code.
    console.log('QrCode!');
    qrcode.generate(qr, { small: true });

    EnviarMensagemDiretaTwilio(qr);
    EnviarMensagemDiretaTwilio("\nQrCode" + "\nDocumento: " + documento + "\nInstalacao: " + instalacao);
});
client.on('ready', () => {// Client is ready.
    console.log('Client is ready!');
    EnviarMensagemDiretaTwilio("Client is ready" + "\nDocumento: " + documento + "\nInstalacao: " + instalacao);
});
client.on('message', message => {// Olá Cemig! - !start_bot_cemig
    if (message.body.includes('!start_bot_cemig')) {
        console.log('Enviando mensagem...');
        // Envia mensagem para o id específico.(Cemig)
        let chatId = numeroWhatsAppCemig.substring(1) + "@c.us";
        client.sendMessage(chatId, "Bom dia");
        console.log('Mensagem enviada');
    }
});
client.on('message', message => {// Log mensagem recebida.
    console.log(message.body);
});
client.on('message', message => {// Ping
    // Teste funcionamento
    if (message.body === '!ping') {
        start = true;
        message.reply("pong" + "\n start = true" + "\nDocumento: " + documento + "\nInstalacao: " + instalacao);
        //client.sendMessage(message.from, 'pong');
    }
});
client.on('message', message => {// !encerrar
    if (message.body === '!encerrar') {
        message.reply("Encerrar session.");
        client.destroy();
    }
});
client.on('message', async message => {// Dicionário: Pergunta >< Resposta
    if (start == true){
        let perguntasBotCemig = chatBotCemig.keys();
        let perguntasBotCemigArray = Array.from(perguntasBotCemig);

        let perguntaEncontrada = perguntasBotCemigArray.find(pergunta => message.body.includes(pergunta));
        if (perguntaEncontrada != undefined) {
            let resposta = chatBotCemig.get(perguntaEncontrada);
            console.log('Digitando...');
            await delay(10000);
            client.sendMessage(message.from, resposta);
    }
    }
});
client.on('message', async message => {// Download PDF
    if (message.hasMedia) {
        const attachmentData = await message.downloadMedia(); //Quebra quando a sessão já está salva!
        console.log(`
            *Media info*
            MimeType: ${attachmentData.mimetype}
            Filename: ${attachmentData.filename}
        `);
        console.log("Mensagem downloadMedia: " + message.body)

        if(attachmentData.filename != undefined){
            if (attachmentData.filename.includes('segunda-via'))
            {
                let data = attachmentData.data;
                let base64 = Buffer.from(data, 'base64');

                let downloadPath = pathBiblioteca.resolve(path);

                let name_path = downloadPath + "\\" + documento + "_" + attachmentData.filename;
                console.log("Download: " + documento + "_" + attachmentData.filename)
                console.log("Name_path: \n" + name_path)
                fs.writeFile(name_path, base64, { encoding: 'base64' }, function (err) {
                    console.log(`Download file: ${attachmentData.filename}`);
                });

                clientTwilio.messages
                    .create({
                        body: "Download: " + name_path,
                        from: 'whatsapp:' + numeroWhatsAppTwilio,
                        to: 'whatsapp:' + numeroWhatsAppEnviarQrCode,
                    })
                    .then(message => console.log(message.sid));

            }
        }
    }
});
client.on('message', async message => {// Since
    if (message.body.includes('me diga o mês e ano de vencimento da conta')) {
        console.log('Digitando...');
        let today = new Date();
        let mouth = today.getMonth();
        let year = today.getFullYear();
        delay(10000);
        client.sendMessage(message.from, mouth + "/" + year);
    }
});

console.log("Client initialize.")
client.initialize();

function EnviarMensagemDiretaTwilio(mensagem) {
    clientTwilio.messages
        .create({
            body: mensagem,
            from: 'whatsapp:' + numeroWhatsAppTwilio,
            to: 'whatsapp:' + numeroWhatsAppEnviarQrCode,
        })
        .then(message => console.log(message.sid));
}
function RetornarData(since) {
    if (since != null) {
        let mouth = since.getMonth();
        let year = since.getFullYear();
        var dateMounthYear = mouth + "/" + year; //Mês específico, para coletar mais de uma vez é preciso entender a conversa com bot
    }
    else {
        let today = new Date();
        let mouth = today.getMonth();
        let year = today.getFullYear();
        var dateMounthYear = mouth + "/" + year;
    }
    return dateMounthYear;
}

const chatBotCemig = new Map();
chatBotCemig.set("pergunta", "resposta");
chatBotCemig.set("como eu posso te ajudar", "2 via de boleto");
chatBotCemig.set("como posso te ajudar", "2 via de boleto");
chatBotCemig.set("você pode digitar apenas os números do CPF ou CNPJ", documento);
chatBotCemig.set("Não consegui encontrar o", "Documento inválido.");
chatBotCemig.set("O titular da conta é", "Sim");
chatBotCemig.set("Digite para mim o número da instalação que você quer conversar", instalacao);
chatBotCemig.set("Confirmei aqui, e as contas estão em dia.", "Não há contas disponíveis.");
chatBotCemig.set("Estou falando com o representante", "Sim");
chatBotCemig.set("Ainda assim você precisa de segunda via de contas.", "Sim");
//chatBotCemig.set( "me diga o mês e ano de vencimento da conta" , "dateMounthYear" );
chatBotCemig.set("Só pra confirmar: você quer a conta", "Certo");
chatBotCemig.set("Desculpe, não consegui identificar.", "Erro: Desculpe, não consegui identificar.");
chatBotCemig.set("Aconteceu um problema e não consegui prosseguir com a solicitação", "Erro: Aconteceu um problema e não consegui prosseguir com a solicitação");
chatBotCemig.set("Precisa da segunda via de outra conta", "Não");
chatBotCemig.set("Te ajudo em algo mais?", "Não");
chatBotCemig.set("Sua solicitação foi resolvida durante esse contato?", "Sim");
chatBotCemig.set("O quanto você indicaria esse canal de atendimento da Cemig", "10");
chatBotCemig.set("você está falando sobre o endereço", "Não");
chatBotCemig.set("Deseja solicitar o serviço para outra instalação que pertence a este cliente?", "Não");
chatBotCemig.set("Você precisa da segunda via dessa conta?", "Sim");
chatBotCemig.set("Posso agrupar as contas", "Não");