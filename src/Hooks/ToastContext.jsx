// contexts/ToastContext.js
import React, { createContext, useContext, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message, duration = 5000) => addToast(message, 'success', duration);
  const error = (message, duration = 7000) => addToast(message, 'danger', duration);
  const warning = (message, duration = 6000) => addToast(message, 'warning', duration);
  const info = (message, duration = 5000) => addToast(message, 'info', duration);

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <ToastContainer 
        position="top-end" 
        className="p-3"
        style={{ zIndex: 1055 }}
      >
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            bg={toast.type}
            autohide
            delay={toast.duration}
            onClose={() => removeToast(toast.id)}
            show={true}
          >
            <Toast.Header>
              <strong className="me-auto">
                {toast.type === 'success' && '✅ Success'}
                {toast.type === 'danger' && '❌ Error'}
                {toast.type === 'warning' && '⚠️ Warning'}
                {toast.type === 'info' && 'ℹ️ Info'}
              </strong>
            </Toast.Header>
            <Toast.Body className={toast.type === 'danger' || toast.type === 'success' ? 'text-white' : ''}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};