import { useMemo, useState } from "react";

class Sender {
  start: boolean = false;
  
  async sendMessages(
    messages: { role: string; content: string }[],
    onReceive: (text: string) => void
  ) {
    if (this.start) {
      console.warn("Already sending messages");
      return;
    }
    this.start = true
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      body: JSON.stringify({
        model: "gemma3",
        messages,
      }),
    });
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        this.start = false;
        break;
      }
      onReceive(decoder.decode(value, { stream: true }));
    }
  }
}

function App() {
  const [input, setInput] = useState<string>("");
  const [lines, setLines] = useState<string[]>([]);
  const sender = useMemo(() => new Sender(), []);
  return (
    <>
      <section>
        {lines
          .map(it => JSON.parse(it).message.content)
          .reduce((prev, cur) => prev + cur, "")
          .split("\n")
          .map((line: string, index: number) => (
            <p key={index}>{line}</p>
          ))}
      </section>
      <input value={input} onChange={e => setInput(e.target.value)} /><button
        onClick={() => {
          if (!input.trim()) return;
          if (sender.start) {
            console.warn("Already sending messages, please wait.");
            return
          }
          const array: string[] = [];
          let buffer: string = "";
          sender.sendMessages(
            [
              {
                role: "user",
                content: input,
              },
            ],
            (text: string) => {
              buffer += text;
              const parts = buffer.split("\n");
              if (parts.length > 1) {
                array.push(parts[0]);
                setLines([...array]);
                buffer = parts.slice(1).join("\n");
              }
            }
          );
        }}
      >
        send
      </button>
    </>
  );
}

export default App;
