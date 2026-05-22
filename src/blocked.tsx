import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BlockedScreen } from './screens/blocked/BlockedScreen'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BlockedScreen />
  </React.StrictMode>,
)
