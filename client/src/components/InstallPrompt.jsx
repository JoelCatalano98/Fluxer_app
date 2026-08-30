import React, { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Detect if app is already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Listen for beforeinstallprompt on Android/Chrome
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the prompt custom UI
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, there is no beforeinstallprompt, so we just show the prompt if it's iOS and not standalone
    if (isIOSDevice && !isStandaloneMode) {
      // Delay prompt slightly
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] rounded-t-2xl border-t border-gray-100 transition-transform transform translate-y-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <img src="/icon-192.png" alt="App Icon" className="w-10 h-10 rounded-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Instalar Fluxer Admin</h3>
            <p className="text-xs text-gray-500 mt-1">
              {isIOS ? 'Agrega la app a tu inicio para un acceso rápido y fácil.' : 'Instala nuestra aplicación para una mejor experiencia.'}
            </p>
          </div>
        </div>
        <button onClick={() => setShowPrompt(false)} className="text-gray-400 hover:text-gray-600 p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4">
        {isIOS ? (
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
            <p>1. Toca el ícono <Share className="w-4 h-4 inline mx-1" /> en la barra inferior.</p>
            <p>2. Selecciona <strong>"Agregar a inicio"</strong> o <strong>"Add to Home Screen"</strong>.</p>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Instalar Aplicación
          </button>
        )}
      </div>
    </div>
  );
}
