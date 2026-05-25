import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('shop_access')
    if (!token) { setCart(null); return }
    setLoading(true)
    try {
      const { data } = await api.get('/cart/')
      setCart(data)
    } catch { setCart(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addItem = async (productId, quantity = 1, variantId = null) => {
    const { data } = await api.post('/cart/add/', {
      product_id: productId,
      quantity,
      variant_id: variantId,
    })
    setCart(data)
    return data
  }

  const updateItem = async (itemId, quantity) => {
    const { data } = await api.patch(`/cart/items/${itemId}/`, { quantity })
    setCart(data)
    return data
  }

  const removeItem = async (itemId) => {
    const { data } = await api.delete(`/cart/items/${itemId}/`)
    setCart(data)
    return data
  }

  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addItem, updateItem, removeItem, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
