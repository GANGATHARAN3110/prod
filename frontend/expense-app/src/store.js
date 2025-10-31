import { legacy_createStore as createStore } from 'redux'

// 🧩 Safely parse user from localStorage
let parsedUser = null
try {
  const userStr = localStorage.getItem('user')
  if (userStr && userStr !== 'undefined') {
    parsedUser = JSON.parse(userStr)
  }
} catch (e) {
  console.warn('Invalid user data in localStorage:', e)
  localStorage.removeItem('user') // optional: cleanup invalid entry
}

// 🏁 Initial Redux state
const initialState = {
  sidebarShow: true,
  theme: 'light',

  // 🔐 Auth state
  token: localStorage.getItem('token') || null,
  user: parsedUser,
  isAuthenticated: !!localStorage.getItem('token'),
}

// 🔄 Reducer
const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest }

    // ✅ When login succeeds
    case 'loginSuccess':
      if (rest.token) localStorage.setItem('token', rest.token)
      if (rest.user) localStorage.setItem('user', JSON.stringify(rest.user))
      return {
        ...state,
        token: rest.token,
        user: rest.user,
        isAuthenticated: true,
      }

    // ✅ On logout
    case 'logout':
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
      }

    default:
      return state
  }
}

// 🏬 Create store
const store = createStore(changeState)

export default store
