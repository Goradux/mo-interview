import { useEffect, useRef, useState } from 'react'
import './App.css'

type Message = {
  who: "me" | "ai"
  text: string
  messageId: number
}

function App() {
  const [text, setText] = useState("")
  const [messageHistory, setMessageHistory] = useState<Message[]>([])
  const sseConnection = useRef<EventSource | undefined>(undefined)

  useEffect(() => {
    sseConnection.current = new EventSource("http://localhost:3000/connection")

    sseConnection.current.onmessage = (event) => {
      if (event.data === "DONE!") {
        return
      } else {
        setMessageHistory(prev => {
          const newHistory = [...prev];

          newHistory[newHistory.length - 1] = {
            ...newHistory[newHistory.length - 1],
            text: (newHistory[newHistory.length - 1]?.text || "") + event.data,
          };

          return newHistory;
        })
      }
    }

    sseConnection.current.onerror = (error) => {
      console.log(error)
    }

    return () => {
      sseConnection.current?.close()
    }
  }, [])

  const buttonHandler = () => {
    const requestText = text
    console.log(requestText)
    setText('')

    fetch("http://localhost:3000/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: requestText
      })
    })
    // add the user request & add response placeholder
    setMessageHistory(prev => [...prev,
    { who: "me", text: requestText, messageId: prev.length + 1 },
    { who: "ai", text: "", messageId: prev.length + 2 }
    ])
  }

  return (
    <>
      <div>
        Your chat:
      </div>
      <div>
        {messageHistory.map(each => <div key={each.messageId}>
          <b>
            {each.who} says:
          </b>
          <p>
            {each.text}
          </p>
          <br />
        </div >)}
      </div>

      <input type="text" value={text} onChange={e => setText(e.target.value)} />

      <button onClick={buttonHandler}>Send</button>
    </>
  )
}

export default App
