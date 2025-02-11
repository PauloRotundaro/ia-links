'use client'

import { useState } from "react";

export default function Home() {
  type Message = {
    from: string;
    text: string;
  };

  // type debounceMessage = {
  //   role: string;
  //   content: string | null;
  //   name: string | null;
  //   function_call: functionCall | null;
  // }

  // type functionCall = {
  //   name: string | null;
  //   arguments: string | null;
  // }

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

    setDebounceContent(JSON.parse(content?.debounceContent));
    setLogContent(JSON.parse(content?.logContent));
    setBotmakerContent(content?.botmakerContent?.messages);
  };

  const highlightJSON = (json: string) => {
    const jsonString = JSON.stringify(json, null, 2);

    return jsonString.split("\n").map((line, index) => {
      const parts = [];
      let lastIndex = 0;

      const regexRoleUser = /("role":\s*)"user"/g;
      const regexRoleAssistant = /("role":\s*)"assistant"/g;
      const regexRoleFunction = /("role":\s*)"function"/g;
      const regexFunctionCall = /("function_call":\s*)/g;
      const regexBrackets = /<([^<>]+)>/g;

      let match;
      while ((match = regexRoleUser.exec(line)) !== null) {
        parts.push(line.substring(lastIndex, match.index));
        parts.push(<span key={`user-${index}`}>&quot;role&quot;: &quot;<b key={`user-${index}`} className="text-blue-500">user</b>&quot;</span>);
        lastIndex = regexRoleUser.lastIndex;
      }

      while ((match = regexRoleAssistant.exec(line)) !== null) {
        const nextLine = jsonString.split("\n")[index + 1];
        if (nextLine && nextLine.includes('"function_call":')) {
          parts.push(line.substring(lastIndex, match.index));
          parts.push(<span key={`assistant-fc-${index}`}>&quot;role&quot;: &quot;<b key={`assistant-fc-${index}`} className="text-red-500">assistant</b>&quot;</span>);
        } else {
          parts.push(line.substring(lastIndex, match.index));
          parts.push(<span key={`assistant-${index}`}>&quot;role&quot;: &quot;<b key={`assistant-${index}`} className="text-green-500">assistant</b>&quot;</span>);
        }
        lastIndex = regexRoleAssistant.lastIndex;
      }

      while ((match = regexFunctionCall.exec(line)) !== null) {
        parts.push(line.substring(lastIndex, match.index));
        parts.push(<span key={`function-call-${index}`}>&quot;<b key={`function-call-${index}`} className="text-red-500">function_call</b>&quot;: </span>);
        lastIndex = regexFunctionCall.lastIndex;
      }

      while ((match = regexRoleFunction.exec(line)) !== null) {
        parts.push(line.substring(lastIndex, match.index));
        parts.push(<span key={`function-${index}`}>&quot;role&quot;: &quot;<b key={`function-${index}`} className="text-purple-500">function</b>&quot;</span>);
        lastIndex = regexRoleFunction.lastIndex;
      }

      while ((match = regexBrackets.exec(line)) !== null) {
        parts.push(line.substring(lastIndex, match.index));
        parts.push(<strong key={`brackets-${index}`}>&lt;{match[1]}&gt;</strong>);
        lastIndex = regexBrackets.lastIndex;
      }

      parts.push(line.substring(lastIndex));

      return <div key={index}>{parts}</div>;
    });
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
          <div className="column-30 scrollbar" onClick={() => handleCopy(`https://debounce.ia.zoss.com.br/getObjects?id=${inputSessionId}`)}>
            <pre className="whitespace-pre-wrap">
              {highlightJSON(debounceContent)}
            </pre>
          </div>
          <div className="column-30 scrollbar" onClick={() => handleCopy(`https://ia-api-log.zoss.com.br/logs?projectId=movida-rac&identifier=${inputSessionId}`)}>
            <pre className="whitespace-pre-wrap">
              {highlightJSON(logContent)}
            </pre>
          </div>
        </div>
      </main>
      {copied && <p className="mt-2 copied">Url copiada!</p>}
    </div>
  );
}