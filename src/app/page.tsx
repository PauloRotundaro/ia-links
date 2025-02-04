'use client'

import { useState } from "react";

export default function Home() {
  const [inputChatId, setInputChatId] = useState("");
  const [inputSessionId, setInputSessionId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [debounceContent, setDebounceContent] = useState("");
  const [logContent, setLogContent] = useState("");
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

  const fetchSessionId = async (chatId: string) => {
    if (!inputChatId) throw new Error("ID do chat não informado.");

    try {
      const response = await fetch(`https://api.botmaker.com/v2.0/chats/${chatId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "access-token": "eyJhbGciOiJIUzUxMiJ9.eyJidXNpbmVzc0lkIjoiem9zc21vdmlkYSIsIm5hbWUiOiJBZG1pbiBBUElzIiwiYXBpIjp0cnVlLCJpZCI6ImRZbExYZkx2YjloeHF5WmpaaXZRSkJUMXNONTIiLCJleHAiOjE4NTcwNzE4NzcsImp0aSI6ImRZbExYZkx2YjloeHF5WmpaaXZRSkJUMXNONTIifQ.ee_L_HlLYdYpyg6y2-AyZ6_bRzSCYMOxJZAH4NbQTRNCsYZKSA96tTSFRcZiOGlaiLIWI1-ZYjxhOPGUPlf5iA", // 🔹 Adicionando o cabeçalho de autenticação
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar dados da API");

      const data = await response.json();
      const sessionIdFromApi = data?.variables?.ia_session_id;

      if (sessionIdFromApi) {
        setSessionId(sessionIdFromApi);

        //Debounce content
        const debounceResponse = await fetch(`https://debounce.ia.zoss.com.br/getObjects?id=${sessionIdFromApi}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          redirect: "follow"
        });
        if (!debounceResponse.ok) throw new Error(`Erro ao buscar dados do debounce`);
        const debounceData = await debounceResponse.json();

        console.log(`Debounce data: ${debounceData}`)

        setDebounceContent(debounceData);

        //LOG content
        const logResponse = await fetch(`https://ia-api-log.zoss.com.br/logs?projectId=movida-rac&identifier=${sessionIdFromApi}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          redirect: "follow"
        });
        if (!logResponse.ok) throw new Error("Erro ao buscar dados do debounce");
        const logData = await logResponse.json();

        console.log(`LOG data: ${logData}`)

        setLogContent(logData);

      } else {
        throw new Error("ia_session_id não encontrado");
      }
    } catch (err) {
      console.error(err);
      setSessionId("");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="flex">
        <div className="mr-3 input-title">Chat ID:</div>
        <input className="pl-1 pr-1 " placeholder="Digite o ID do chat" value={inputChatId} onChange={(e) => setInputChatId(e.target.value)} />
        <div className="mr-3 input-title">Session ID:</div>
        <input className="pl-1 pr-1 " placeholder="Digite o ID da sessão" value={inputSessionId} onChange={(e) => setInputSessionId(e.target.value)} />
        <button className="btn" onClick={() => fetchSessionId(inputChatId)}>Enviar</button>
      </div>
      <main className="wdt-100 flex flex-col gap-8">
        <div className="column-titles flex">
          <p className="column-title">Botmaker Messages</p>
          <p className="column-title">IA Messages (debounce)</p>
          <p className="column-title">LOG</p>
        </div>
        <div className="columns flex gap-4 space-around">
          <div className="column-30" onClick={() => handleCopy(`https://api.botmaker.com/v2.0/messages/?long-term-search=true&chat-id=${inputChatId}`)}><p>https://api.botmaker.com/v2.0/messages/?long-term-search=true&chat-id={inputChatId}</p></div>
          <div className="column-30" onClick={() => handleCopy(`https://debounce.ia.zoss.com.br/getObjects?id=${sessionId}`)}>{debounceContent}</div>
          <div className="column-30" onClick={() => handleCopy(`https://ia-api-log.zoss.com.br/logs?projectId=movida-rac&identifier=${sessionId}`)}>{logContent}</div>
        </div>
      </main>
      {copied && <p className="mt-2 copied">Texto copiado!</p>}
    </div>
  );
}