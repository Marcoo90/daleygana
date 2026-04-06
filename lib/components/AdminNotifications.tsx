"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

interface Notification {
  id: string;
  name: string;
  dni: string;
  whatsapp: string;
  department: string;
  timestamp: Date;
}

// Genera un sonido de notificación "ding" usando Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);

    // Primer tono - nota alta
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1046, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);

    // Segundo tono - delay
    oscillator2.type = "sine";
    oscillator2.frequency.setValueAtTime(1046, ctx.currentTime + 0.15);
    oscillator2.frequency.exponentialRampToValueAtTime(1318, ctx.currentTime + 0.3);
    gainNode2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    gainNode2.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.18);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    oscillator2.start(ctx.currentTime + 0.15);
    oscillator2.stop(ctx.currentTime + 0.65);
  } catch (e) {
    console.warn("Audio no disponible:", e);
  }
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const addNotification = useCallback((notif: Notification) => {
    setNotifications((prev) => [notif, ...prev].slice(0, 20)); // máx 20
    setUnreadCount((c) => c + 1);
    playNotificationSound();
  }, []);

  useEffect(() => {
    // Escuchar inserciones en la tabla `orders` (se crea cuando el usuario se registra)
    const channel = supabase
      .channel("admin-new-registrations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          const order = payload.new as any;

          // Obtener datos del participante
          try {
            const { data: participant } = await supabase
              .from("participants")
              .select("first_name, last_name, dni, whatsapp, department")
              .eq("id", order.participant_id)
              .single();

            const notif: Notification = {
              id: order.id,
              name: participant
                ? `${participant.first_name} ${participant.last_name}`.trim()
                : "Nuevo participante",
              dni: participant?.dni || "---",
              whatsapp: participant?.whatsapp || "---",
              department: participant?.department || "---",
              timestamp: new Date(),
            };

            addNotification(notif);
          } catch {
            // Si falla el fetch, igual notificamos con info básica
            addNotification({
              id: order.id,
              name: "Nuevo participante",
              dni: "---",
              whatsapp: "---",
              department: "---",
              timestamp: new Date(),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification]);

  // Cerrar panel al click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenPanel = () => {
    setPanelOpen((v) => !v);
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Toast de notificaciones — aparecen arriba a la derecha */}
      <div id="notif-toast-container" style={{
        position: "fixed",
        top: "1.5rem",
        right: "1.5rem",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        pointerEvents: "none",
      }}>
        {notifications.slice(0, 3).map((n, i) => (
          <NotifToast
            key={n.id + i}
            notification={n}
            onDismiss={() => removeNotification(n.id)}
          />
        ))}
      </div>

      {/* Botón campana en sidebar - se inserta vía portal */}
      <div ref={containerRef} id="notif-bell-wrapper" style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 9999,
      }}>
        {/* Botón campana */}
        <button
          onClick={handleOpenPanel}
          title="Notificaciones de registro"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: unreadCount > 0
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #6366f1, #4f46e5)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            boxShadow: unreadCount > 0
              ? "0 0 0 4px rgba(16,185,129,0.25), 0 8px 24px rgba(0,0,0,0.2)"
              : "0 8px 24px rgba(0,0,0,0.15)",
            transition: "all 0.25s",
            position: "relative",
            animation: unreadCount > 0 ? "bellRing 0.6s ease-in-out" : "none",
          }}
        >
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#ef4444",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.7rem",
              fontWeight: 900,
              minWidth: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
            }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Panel de notificaciones */}
        {panelOpen && (
          <div style={{
            position: "absolute",
            bottom: "68px",
            right: "0",
            width: "360px",
            maxHeight: "480px",
            background: "#ffffff",
            borderRadius: "1.25rem",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "panelSlideUp 0.2s ease-out",
          }}>
            {/* Header */}
            <div style={{
              padding: "1rem 1.25rem",
              background: "linear-gradient(135deg, #1e1b4b, #2563eb)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#fff",
            }}>
              <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                🔔 Nuevos Registros
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    color: "#fff",
                    borderRadius: "0.4rem",
                    padding: "0.25rem 0.6rem",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Lista */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{
                  padding: "2.5rem 1rem",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "0.88rem",
                }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎯</div>
                  Sin notificaciones aún.<br />
                  <span style={{ fontSize: "0.78rem" }}>Los nuevos registros aparecerán aquí.</span>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} style={{
                    padding: "0.9rem 1.25rem",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                      flexShrink: 0,
                    }}>
                      👤
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 800,
                        fontSize: "0.88rem",
                        color: "#0f172a",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {n.name}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.1rem 0 0", }}>
                        DNI: {n.dni} · {n.department}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: "0.1rem 0 0" }}>
                        📱 {n.whatsapp} · {formatTime(n.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNotification(n.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#cbd5e1",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        padding: "0",
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{
                padding: "0.75rem 1.25rem",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                textAlign: "center",
                fontSize: "0.75rem",
                color: "#94a3b8",
              }}>
                {notifications.length} registro(s) recibido(s) en esta sesión
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          20%        { transform: rotate(-15deg); }
          40%        { transform: rotate(15deg); }
          60%        { transform: rotate(-10deg); }
          80%        { transform: rotate(10deg); }
        }
        @keyframes panelSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(120%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to   { opacity: 0; transform: translateX(120%) scale(0.9); }
        }
      `}</style>
    </>
  );
}

// ─── Toast individual ────────────────────────────────────────────────────────
function NotifToast({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => handleDismiss(), 6000);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        pointerEvents: "all",
        background: "#ffffff",
        borderRadius: "1rem",
        padding: "1rem 1.2rem",
        display: "flex",
        gap: "0.8rem",
        alignItems: "flex-start",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 0 0 2px rgba(16,185,129,0.35)",
        borderLeft: "4px solid #10b981",
        width: "320px",
        animation: exiting
          ? "toastSlideOut 0.3s ease-in forwards"
          : "toastSlideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      }}
    >
      {/* Ícono */}
      <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #10b981, #059669)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.1rem",
        flexShrink: 0,
        boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
      }}>
        ✅
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 900,
          fontSize: "0.82rem",
          color: "#10b981",
          margin: "0 0 0.15rem",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          ¡Nuevo Registro!
        </p>
        <p style={{
          fontWeight: 700,
          fontSize: "0.9rem",
          color: "#0f172a",
          margin: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {notification.name}
        </p>
        <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.15rem 0 0" }}>
          DNI {notification.dni} · {notification.department}
        </p>
      </div>

      {/* Cerrar */}
      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          color: "#cbd5e1",
          cursor: "pointer",
          padding: 0,
          fontSize: "0.9rem",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
