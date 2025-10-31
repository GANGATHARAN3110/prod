/* eslint-disable prettier/prettier */
// src/DebugRedux.js
import { useSelector } from 'react-redux'
import { useEffect } from 'react'

const DebugRedux = () => {
  const state = useSelector((state) => state)

  useEffect(() => {
    console.log('🧠 Current Redux State:', state)
  }, [state])

  return null
}

export default DebugRedux
