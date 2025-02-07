'use client'

import { useState } from "react";

export default function Home() {
  type Message = {
    from: string;
    text: string;
  };

  const [inputSessionId, setInputSessionId] = useState("");
  const [chatId, setChatId] = useState("");
  const [debounceContent, setDebounceContent] = useState("");
  const [logContent, setLogContent] = useState("");
  const [botmakerContent, setBotmakerContent] = useState<Message[]>([]);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar o texto", err);
    }
  };

  const fetchSessionId = async (sessionId: string) => {
    if (!inputSessionId) throw new Error("ID da sessão não informado.");

    const contentResponse = await fetch(`https://api-ia.zoss.com.br/getContent?iaSessionId=${sessionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!contentResponse.ok) {
      console.log(`Erro: ${contentResponse.status}`);
    }

    setChatId(sessionId.split('_')[0]);

    const content = await contentResponse.json();
    setDebounceContent(content?.debounceContent);
    setLogContent(content?.logContent);
    setBotmakerContent(content?.botmakerContent?.messages);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="flex">
        <div className="mr-3 input-title">Session ID:</div>
        <input className="pl-1 pr-1 " placeholder="Digite o ID da sessão" value={inputSessionId} onChange={(e) => setInputSessionId(e.target.value)} />
        <button className="btn" onClick={() => fetchSessionId(inputSessionId)}>Enviar</button>
      </div>
      <main className="wdt-100 flex flex-col gap-8">
        <div className="column-titles flex">
          <p className="column-title">Botmaker Messages</p>
          <p className="column-title">IA Messages (debounce)</p>
          <p className="column-title">LOG</p>
        </div>
        <div className="columns flex gap-4 space-around">
          <div className="column-30 scrollbar" onClick={() => handleCopy(`https://api.botmaker.com/v2.0/messages/?long-term-search=true&chat-id=${chatId}`)}>{botmakerContent.map(message => (
            <div className="wdt-100" key={message.from + "_" + message.text}>
              <p className="wdt-100 mb-5">{message.from}: {message.text}</p>
            </div>
          ))}</div>
          <div className="column-30 scrollbar" onClick={() => handleCopy(`https://debounce.ia.zoss.com.br/getObjects?id=${inputSessionId}`)}>{debounceContent}</div>
          <div className="column-30 scrollbar" onClick={() => handleCopy(`https://ia-api-log.zoss.com.br/logs?projectId=movida-rac&identifier=${inputSessionId}`)}>{logContent}</div>
        </div>
      </main>
      {copied && <p className="mt-2 copied">Url copiada!</p>}
    </div>
  );
}