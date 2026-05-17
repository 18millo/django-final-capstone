import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapPicker({ lat, lng, onLocationChange }) {
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      const map = L.map(containerRef.current).setView([lat || 20, lng || 0], 2)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      map.on('click', (e) => {
        const { lat: newLat, lng: newLng } = e.latlng
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng])
        } else {
          markerRef.current = L.marker([newLat, newLng], { draggable: true }).addTo(map)
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current.getLatLng()
            onLocationChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)))
          })
        }
        onLocationChange(parseFloat(newLat.toFixed(6)), parseFloat(newLng.toFixed(6)))
      })

      if (lat && lng) {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
        map.setView([lat, lng], 13)
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng()
          onLocationChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)))
        })
      }

      mapRef.current = map
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (mapRef.current && lat && lng && markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
      mapRef.current.setView([lat, lng], 13)
    }
  }, [lat, lng])

  return <div ref={containerRef} className="w-full h-full" />
}
