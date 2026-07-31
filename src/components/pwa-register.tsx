"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    // 1. Register Service Worker for PWA
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered successfully:", reg.scope)
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err)
        })
    }

    // 2. Request Notification Permission immediately from the start
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("Notification permission response:", permission)
          if (permission === "granted") {
            // Trigger a welcome notification
            new Notification("Hệ thống Quản lý Hụi", {
              body: "Thông báo đẩy đã được kích hoạt thành công trên thiết bị!",
              icon: "/globe.svg"
            })
          }
        })
      }
    }
  }, [])

  return null
}
