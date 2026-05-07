import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const Blocked = () => {
  const [site, setSite] = React.useState('')

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSite(params.get('site') || 'this website')
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="bg-red-500/20 p-6 rounded-full inline-block">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold">Time's Up!</h1>
        <p className="text-slate-400 text-lg">
          You've reached your daily limit for <span className="text-red-400 font-semibold">{site}</span>.
        </p>
        <p className="text-slate-500">
          This site will be available again after midnight. Go do something else! 🚀
        </p>
        <button 
          onClick={() => window.close()}
          className="mt-8 px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors shadow-lg shadow-red-600/20"
        >
          Close Tab
        </button>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Blocked />
  </React.StrictMode>,
)
