'use client'

import { useState, useEffect } from "react";
import Image from "next/image";

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

  type MessageContent = {
    id: string;
    timestamp: string;
    content: unknown;
  }

  const [inputProjectId, setInputProjectId] = useState("");
  const [inputSessionId, setInputSessionId] = useState("");
  const [chatId, setChatId] = useState("");
  const [debounceContent, setDebounceContent] = useState<MessageContent[]>([]);
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

    const debounce = content?.debounceContent;
    const parsedDebounce = typeof debounce === "string" ? JSON.parse(debounce) : debounce;
    setDebounceContent(parsedDebounce?.items ?? []);
    setLogContent(JSON.parse(content?.logContent));
    setBotmakerContent(content?.botmakerContent?.messages);
    setDataflowContent(content?.dataflowContent);
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session_id');
      const projectParam = params.get('project_id');
      if (sessionParam && projectParam) {
        setInputSessionId(sessionParam);
        setInputProjectId(projectParam);
        fetchSessionId(sessionParam, projectParam).catch(err => console.error('Erro ao buscar session via URL:', err));
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
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <Image className="brand-logo" src="/zoss-logo.png" alt="ZOSS" width={148} height={44} priority />
          <div className="brand-text">
            <span className="brand-title">Monitor IA</span>
            <span className="brand-subtitle">Painel de monitoramento de sessões</span>
          </div>
        </div>
        <span className="header-badge">Dica: clique numa coluna para copiar a URL da fonte</span>
      </header>

      <section className="control-panel">
        <div className="field">
          <label className="input-title">Projeto</label>
          <select value={inputProjectId} onChange={(e) => setInputProjectId(e.target.value)}>
            <option value="movida-rac">Movida RAC</option>
            <option value="foco-rac">Foco RAC</option>
            <option value="mit">Mitsubishi</option>
            <option value="amil-dental">Amil Dental</option>
            <option value="leve-dental">Leve Dental</option>
            <option value="assim-saude">Assim Saúde</option>
            <option value="hapvida">Hapvida</option>
            <option value="nissan">Nissan</option>
            <option value="rod">ROD</option>
            <option value="plano-pet">Plano Pet</option>
            <option value="odontoprev">Odontoprev</option>
            <option value="alugueldecarroai">Aluguel de Carro AI</option>
            <option value="unidas-seminovos">Unidas Seminovos</option>
            <option value="cpa">Carro Por Assinatura</option>
            <option value="gwm">GWM</option>
          </select>
        </div>
        <div className="field field-grow">
          <label className="input-title">Session ID</label>
          <input placeholder="Digite o ID da sessão" value={inputSessionId} onChange={(e) => setInputSessionId(e.target.value)} />
        </div>
        <button className="btn" onClick={() => fetchSessionId(inputSessionId, inputProjectId)}>Buscar</button>
      </section>

      <main className="columns">
        <div className="column-card">
          <div className="column-head head-botmaker"><span className="dot" />Botmaker Messages</div>
          <div className="column-body" onClick={() => handleCopy(`https://api.botmaker.com/v2.0/messages/?long-term-search=true&chat-id=${chatId}`)}>
            {botmakerContent.length === 0
              ? <span className="empty-hint">Sem mensagens.</span>
              : botmakerContent.map((message, index) => (
                <div className="bubble" key={message.from + "_" + message.text + "_" + index}>
                  <span className="bubble-from">{message.from}:</span>{message.text}
                </div>
              ))}
          </div>
        </div>

        <div className="column-card">
          <div className="column-head head-ia"><span className="dot" />IA Messages</div>
          <div className="column-body" onClick={() => handleCopy(`https://api.zx.zoss.ai/getObjects`)}>
            {debounceContent.length === 0
              ? <span className="empty-hint">Sem mensagens.</span>
              : debounceContent.map((item, index) => {
                let contentToShow = item.content;
                if (typeof contentToShow === "string") {
                  try {
                    contentToShow = JSON.parse(contentToShow);
                  } catch {
                    // mantém como string se não for JSON válido
                  }
                }
                return (
                  <div className="entry" key={item.id + "_" + index}>
                    <pre>
                      {typeof contentToShow === "object" && contentToShow !== null
                        ? highlightJSON(contentToShow as unknown as string)
                        : String(contentToShow)}
                    </pre>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="column-card">
          <div className="column-head head-log"><span className="dot" />LOG</div>
          <div className="column-body" onClick={() => handleCopy(`https://ia-api-log.zoss.com.br/logs?projectId=${inputProjectId}&identifier=${inputSessionId}`)}>
            {logContent
              ? <pre>{highlightJSON(logContent)}</pre>
              : <span className="empty-hint">Sem log.</span>}
          </div>
        </div>

        <div className="column-card">
          <div className="column-head head-dataflow"><span className="dot" />Dataflow</div>
          <div className="column-body" onClick={() => handleCopy(`https://api.zx.zoss.ai/getDataflow/${inputSessionId}`)}>
            {dataflowContent.length === 0
              ? <span className="empty-hint">Sem dataflow.</span>
              : dataflowContent.map((dataflow, index) => {
                let contentToShow = dataflow.content;
                if (typeof contentToShow === "string") {
                  try {
                    contentToShow = JSON.parse(contentToShow);
                  } catch {
                    // mantém como string se não for JSON válido
                  }
                }
                return (
                  <div className="entry" key={dataflow.createdAt + "_" + index}>
                    <pre>
                      {typeof contentToShow === "object" && contentToShow !== null
                        ? highlightJSON(contentToShow)
                        : String(contentToShow)}
                    </pre>
                  </div>
                );
              })}
          </div>
        </div>
      </main>

      {copied && <p className="copied">URL copiada!</p>}
    </div>
  );
}