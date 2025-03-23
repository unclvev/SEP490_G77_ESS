
const initialState = {
    token: null,
  };
  
  export const reducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SET_TOKEN':
        return { ...state, token: action.payload };
      case 'LOGOUT':
        return { ...state, token: null };
      default:
        return state;
    }
  };
  