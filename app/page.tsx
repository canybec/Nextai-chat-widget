'use client'

import { useChat } from 'ai/react'
import { useState, useEffect } from 'react'
import { getTotalRows } from '../utils'

export default function Home() {
  const[query, setQuery] = useState('')
  const[result, setResult] = useState('')
  const[loading, setLoading] = useState(false)
  const[rowCount, setRowCount] = useState(0);


  async function getTotalRows(){
    const count = await supabase
      .from('prompts_and_completions')
      .select('*', { count: 'exact' })
      .single();
    console.log(count);

    return count;
  };


  async function createIndexAndEmbeddings(){
    try {
      const result = await fetch('/api/setup', {
        method: 'POST',
      })
      const json = await result.json()
      console.log('result:', json)
    } catch (err) {
      console.error('err:', err)
    }
  }


  const { messages, input, stop, isLoading:chatLoading, handleInputChange, handleSubmit } = useChat()

  const aiStyle = {
    backgroundColor: "#f2f2f2",
    color: "#555",
    borderRadius: "18px",
    padding: "10px 15px",
    margin: "5px",
    textAlign: "left",
    maxWidth: "60%",
    alignSelf: "flex-start"
  };

  const userStyle = {
    backgroundColor: "#007aff",
    color: "#fff",
    borderRadius: "18px",
    padding: "10px 15px",
    margin: "5px",
    textAlign: "right",
    maxWidth: "50%",
    alignSelf: "flex-end"
  };

  return (

    <div className="flex w-full">
      
        <main className="flex flex-col items-center justify-between p-14 w-1/3 bg-blue-50 rounded-lg shadow-lg">
          <button 
            onClick={createIndexAndEmbeddings} 
            className="px-5 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 transition duration-200 ease-in-out"
          >
            Create Index and Embeddings
          </button>
        </main>

    <div className="flex flex-col w-2/3 max-w-md py-12 px-1"  style={{ marginLeft: 'auto', maxWidth: '70%' }}>
      {messages.length > 0
        ? messages.map(m => (
            <div key={m.id} className={`whitespace-pre-wrap ${
              m.role === 'user' ? 'user-message' : 'ai-message'
            }`}
            style={m.role === 'user' ? userStyle : aiStyle}
             >
            {m.role === 'user' ? 'User: ' : 'AI: '}
              {m.content}
            </div>
          ))
        : null}

      <form onSubmit={handleSubmit}  >
        <input className="fixed bottom-0 w-full max-w-md min-w-16 p-4 mb-2 border border-gray-300 rounded-xl outline-none shadow-md "


          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
    
      </form>
    </div>
    </div>
  )
}
