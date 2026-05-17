import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { toast } from '../components/ui/Toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [itemCount, setItemCount] = useState(0)

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setCart(null)
      setItemCount(0)
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/cart/')
      setCart(res.data)
      const count = (res.data.items || []).reduce((s, i) => s + i.quantity, 0)
      setItemCount(count)
    } catch {
      setCart(null)
      setItemCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addItem = async (productId, variantId = null, quantity = 1) => {
    try {
      const res = await api.post('/cart/add/', { product_id: productId, variant_id: variantId, quantity })
      setCart(res.data)
      const count = (res.data.items || []).reduce((s, i) => s + i.quantity, 0)
      setItemCount(count)
      toast('Added to cart', 'success')
    } catch { toast('Failed to add item', 'error') }
  }

  const updateItem = async (itemId, quantity) => {
    try {
      const res = await api.patch('/cart/items/' + itemId + '/', { quantity })
      setCart(res.data)
      const count = (res.data.items || []).reduce((s, i) => s + i.quantity, 0)
      setItemCount(count)
    } catch { toast('Failed to update', 'error') }
  }

  const removeItem = async (itemId) => {
    try {
      const res = await api.delete('/cart/items/' + itemId + '/')
      setCart(res.data)
      const count = (res.data.items || []).reduce((s, i) => s + i.quantity, 0)
      setItemCount(count)
      toast('Removed from cart', 'info')
    } catch { toast('Failed to remove', 'error') }
  }

  const clearCart = () => {
    setCart(null)
    setItemCount(0)
  }

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, addItem, updateItem, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
