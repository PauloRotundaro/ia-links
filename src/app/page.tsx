'use client'

import { useState, useEffect } from "react";

export default function Home() {
  type Message = {
    from: string;
    text: string;
  };

  type DataflowContent = {
    sessionId: string;
    content: string;
    updatedAt: string;
    createdAt: string;
  }

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

  const [inputProjectId, setInputProjectId] = useState("");
  const [inputSessionId, setInputSessionId] = useState("");
  const [chatId, setChatId] = useState("");
  const [debounceContent, setDebounceContent] = useState("");
  const [logContent, setLogContent] = useState("");
  const [botmakerContent, setBotmakerContent] = useState<Message[]>([]);
  const [dataflowContent, setDataflowContent] = useState<DataflowContent[]>([]);
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

  const fetchSessionId = async (sessionId: string, projectId?: string) => {
    if (!sessionId) throw new Error("ID da sessão não informado.");

    let url = `https://api-ia.zoss.com.br/getContent?iaSessionId=${sessionId}`;
    if (projectId && projectId.trim() !== "") {
      url += `&projectId=${projectId}`;
    }

    const contentResponse = await fetch(url, {
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
    setDataflowContent(content?.dataflowContent);
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session_id');
      if (sessionParam) {
        setInputSessionId(sessionParam);
        fetchSessionId(sessionParam, inputProjectId).catch(err => console.error('Erro ao buscar session via URL:', err));
      }
    } catch (err) {
      console.error('Erro ao ler parâmetros da URL', err);
    }
  }, []);

  const highlightJSON = (json: string) => {
    const jsonString = JSON.stringify(json, null, 2).replace(/\\{1,3}"/g, '"');

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
        <div className="mr-3 input-title">Project ID:</div>
        <select className="pl-1 pr-1 cursor-pointer text-black bg-white border-2 border-gray-300 rounded-md w-48" value={inputProjectId} onChange={(e) => setInputProjectId(e.target.value)}>
          <option value="movida-rac">Movida RAC</option>
        </select>
        <div className="mr-3 ml-3 input-title">Session ID:</div>
        <input className="pl-1 pr-1 border-2 border-gray-300 rounded-md w-96" placeholder="Digite o ID da sessão" value={inputSessionId} onChange={(e) => setInputSessionId(e.target.value)} />
        <button className="btn" onClick={() => fetchSessionId(inputSessionId, inputProjectId)}>Enviar</button>
      </div>
      <main className="wdt-100 flex flex-col gap-8">
        <div className="column-titles flex">
          <p className="column-title">Botmaker Messages</p>
          <p className="column-title">IA Messages (debounce)</p>
          <p className="column-title">LOG</p>
          <p className="column-title">Dataflow</p>
        </div>
        <div className="columns flex gap-4 space-around">
          <div className="column-30 scrollbar" onClick={() => handleCopy(`https://api.botmaker.com/v2.0/messages/?long-term-search=true&chat-id=${chatId}`)}>{botmakerContent.map((message, index) => (
            <div className="wdt-100" key={message.from + "_" + message.text + "_" + index}>
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
          <div className="column-30 scrollbar" onClick={() => handleCopy(`https://api.zx.zoss.ai/getDataflow/${inputSessionId}`)}>{dataflowContent.map((dataflow, index) => {
            let contentToShow = dataflow.content;
            if (typeof contentToShow === "string") {
              try {
                contentToShow = JSON.parse(contentToShow);
              } catch {
                // mantém como string se não for JSON válido
              }
            }
            return (
              <div className="wdt-100 mb-5" key={dataflow.createdAt + "_" + index}>
                <pre className="whitespace-pre-wrap text-sm">
                  {typeof contentToShow === "object" && contentToShow !== null
                    ? highlightJSON(contentToShow)
                    : String(contentToShow)}
                </pre>
              </div>
            );
          })}</div>
        </div>
      </main>
      {copied && <p className="mt-2 copied">Url copiada!</p>}
    </div>
  );
}