
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { GPSPoint, ActivitySession } from '../types';

const ActivityScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, saveActivity, syncHealthData } = useApp();
  
  // States: 'idle' | 'countdown' | 'tracking' | 'paused' | 'summary' | 'importing'
  const [status, setStatus] = useState<'idle' | 'countdown' | 'tracking' | 'paused' | 'summary' | 'importing'>('idle');
  const [activityType, setActivityType] = useState<'Running' | 'Walking'>('Running');
  const [countdown, setCountdown] = useState(3);
  
  // Import State
  const [importMessage, setImportMessage] = useState('');
  
  // Tracking Data
  const [startTime, setStartTime] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // seconds
  const [distance, setDistance] = useState(0); // km
  const [route, setRoute] = useState<GPSPoint[]>([]);
  const [currentPace, setCurrentPace] = useState("0'00\""); // min/km
  const [summaryImage, setSummaryImage] = useState<string | null>(null);
  
  // Summary Edit Data
  const [activityTitle, setActivityTitle] = useState('');
  const [activityPhoto, setActivityPhoto] = useState<string | null>(null);
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  
  // Tracking Map Ref
  const trackingMapRef = useRef<any>(null);
  const trackingPolylineRef = useRef<any>(null);
  const trackingMarkerRef = useRef<any>(null);
  
  // Summary Map Refs (to handle cleanups)
  const summaryMapInstanceRef = useRef<any>(null);
  const fullScreenMapInstanceRef = useRef<any>(null);
  
  // Auto-Pause Refs
  const lastMovementTimeRef = useRef<number>(0);

  // Platform Detection for Health App Label
  const isAndroid = /Android/i.test(navigator.userAgent);
  const healthAppName = isAndroid ? 'Google Fit' : 'Apple Health';
  const healthAppIcon = isAndroid ? 'fa-google' : 'fa-apple';

  // Haversine Formula for distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  // Start Tracking Logic
  const startTracking = () => {
      setStatus('countdown');
      let count = 3;
      setCountdown(3);
      const countInterval = setInterval(() => {
          count--;
          if (count > 0) {
              setCountdown(count);
          } else {
              clearInterval(countInterval);
              beginSession();
          }
      }, 1000);
  };

  const beginSession = () => {
      setStatus('tracking');
      setStartTime(new Date().toISOString());
      setElapsedTime(0);
      setDistance(0);
      setRoute([]);
      
      // Reset auto-pause timer
      lastMovementTimeRef.current = Date.now();
      
      // Start Timer
      timerRef.current = setInterval(() => {
          setElapsedTime(prev => prev + 1);
          
          // Check for Auto-Pause (120 seconds inactivity)
          if (user?.autoPauseEnabled) {
              const timeSinceLastMove = Date.now() - lastMovementTimeRef.current;
              if (timeSinceLastMove > 120000) { // 120 seconds
                  pauseTracking();
                  // Reset timestamp so it doesn't immediately pause again upon manual resume unless still
                  lastMovementTimeRef.current = Date.now(); 
              }
          }
      }, 1000);

      // Start GPS
      if (navigator.geolocation) {
          watchIdRef.current = navigator.geolocation.watchPosition(
              (position) => {
                  const { latitude, longitude } = position.coords;
                  const timestamp = position.timestamp;
                  const newPoint: GPSPoint = { latitude, longitude, timestamp };
                  
                  setRoute(prevRoute => {
                      if (prevRoute.length > 0) {
                          const lastPoint = prevRoute[prevRoute.length - 1];
                          const distDelta = calculateDistance(
                              lastPoint.latitude, lastPoint.longitude,
                              latitude, longitude
                          );
                          // Filter GPS jitter (ignore extremely small movements < 2m in short time)
                          if (distDelta > 0.002) {
                              setDistance(d => d + distDelta);
                              // Reset last movement time on significant move
                              lastMovementTimeRef.current = Date.now();
                          }
                      } else {
                          // First point counts as movement
                          lastMovementTimeRef.current = Date.now();
                      }
                      return [...prevRoute, newPoint];
                  });
              },
              (error) => console.error("GPS Error", error),
              { enableHighAccuracy: true }
          );
      }
  };

  const pauseTracking = () => {
      setStatus('paused');
      clearInterval(timerRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  };

  const resumeTracking = () => {
      setStatus('tracking');
      // Reset movement timer on resume to give user time to start moving
      lastMovementTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
          setElapsedTime(prev => prev + 1);
          
          // Check for Auto-Pause (120 seconds inactivity)
          if (user?.autoPauseEnabled) {
              const timeSinceLastMove = Date.now() - lastMovementTimeRef.current;
              if (timeSinceLastMove > 120000) { 
                  pauseTracking();
                  lastMovementTimeRef.current = Date.now();
              }
          }
      }, 1000);
      
      if (navigator.geolocation) {
          watchIdRef.current = navigator.geolocation.watchPosition(
              (position) => {
                  const { latitude, longitude } = position.coords;
                  const timestamp = position.timestamp;
                  const newPoint: GPSPoint = { latitude, longitude, timestamp };
                  
                  setRoute(prevRoute => {
                      if (prevRoute.length > 0) {
                          const lastPoint = prevRoute[prevRoute.length - 1];
                          const distDelta = calculateDistance(
                              lastPoint.latitude, lastPoint.longitude,
                              latitude, longitude
                          );
                          if (distDelta > 0.002) {
                              setDistance(d => d + distDelta);
                              lastMovementTimeRef.current = Date.now();
                          }
                      }
                      return [...prevRoute, newPoint];
                  });
              },
              null, { enableHighAccuracy: true }
          );
      }
  };

  // Live Tracking Map Effect
  useEffect(() => {
    if ((status === 'tracking' || status === 'paused')) {
        const timer = setTimeout(() => {
             const L = (window as any).L;
             if (!L) return;
             
             const mapContainer = document.getElementById('tracking-map');
             if (!mapContainer) return;
             
             if (!trackingMapRef.current) {
                 const map = L.map('tracking-map', {
                    zoomControl: false,
                    attributionControl: false,
                    dragging: false,
                    scrollWheelZoom: false,
                    doubleClickZoom: false,
                    touchZoom: false
                 }).setView([0, 0], 15);
                 
                 L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    subdomains: 'abcd',
                    maxZoom: 19
                 }).addTo(map);

                 trackingMapRef.current = map;
             }

             if (route.length > 0) {
                 const latlngs = route.map(p => [p.latitude, p.longitude]);
                 const lastPos = latlngs[latlngs.length - 1];
                 
                 trackingMapRef.current.setView(lastPos, 16, { animate: true });

                 if (!trackingPolylineRef.current) {
                     trackingPolylineRef.current = L.polyline(latlngs, { color: '#E11D48', weight: 4 }).addTo(trackingMapRef.current);
                 } else {
                     trackingPolylineRef.current.setLatLngs(latlngs);
                 }

                 if (!trackingMarkerRef.current) {
                     const icon = L.divIcon({
                        className: 'live-marker',
                        html: '<div style="width: 12px; height: 12px; background: #E11D48; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(225,29,72,0.5);"></div>',
                        iconSize: [12, 12]
                     });
                     trackingMarkerRef.current = L.marker(lastPos, { icon }).addTo(trackingMapRef.current);
                 } else {
                     trackingMarkerRef.current.setLatLng(lastPos);
                 }
             }
        }, 100);
        return () => clearTimeout(timer);
    } else {
        // Cleanup tracking map if leaving tracking state
        if (trackingMapRef.current) {
            trackingMapRef.current.remove();
            trackingMapRef.current = null;
            trackingPolylineRef.current = null;
            trackingMarkerRef.current = null;
        }
    }
  }, [status, route]);

  // Helper to initialize static Leaflet maps (used for summary and fullscreen)
  const initializeLeafletMap = (elementId: string, mapRef: React.MutableRefObject<any>, isInteractive: boolean = false) => {
    const L = (window as any).L;
    if (!L) return;

    const mapElement = document.getElementById(elementId);
    if (mapElement && !mapRef.current) {
        const map = L.map(elementId, {
            zoomControl: isInteractive,
            attributionControl: false,
            dragging: isInteractive,
            scrollWheelZoom: isInteractive,
            doubleClickZoom: isInteractive,
            touchZoom: isInteractive
        }).setView([0, 0], 13);

        mapRef.current = map;

        // Dark Mode Tiles (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        const latlngs = route.map(p => [p.latitude, p.longitude]);
        
        if (latlngs.length > 0) {
            // Neon Glow Effect: Wide transparent line under thin opaque line
            L.polyline(latlngs, { 
                color: '#E11D48', 
                weight: 12, 
                opacity: 0.2, 
                lineCap: 'round',
                lineJoin: 'round',
                className: 'neon-glow'
            }).addTo(map);

            const polyline = L.polyline(latlngs, { 
                color: '#fb7185', // Lighter rose/pink for core
                weight: 4, 
                opacity: 1, 
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);
            
            const createMarkerIcon = (color: string, iconClass: string) => {
                return L.divIcon({
                    className: 'custom-map-marker',
                    html: `<div style="
                        background-color: ${color}; 
                        width: 36px; 
                        height: 36px; 
                        border-radius: 50%; 
                        border: 3px solid white; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        box-shadow: 0 0 20px ${color}80;
                        transform: translate(-2px, -2px);
                    ">
                        <i class="${iconClass}" style="color: white; font-size: 16px;"></i>
                    </div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                    popupAnchor: [0, -20]
                });
            };

            const startTimeStr = new Date(route[0].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const endTimeStr = new Date(route[route.length-1].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            L.marker(latlngs[0], { 
                icon: createMarkerIcon('#10B981', 'fas fa-play pl-0.5') // Green
            })
            .bindPopup(`<div class="text-black font-bold text-center">Início<br><span class="text-xs text-gray-600">${startTimeStr}</span></div>`)
            .addTo(map);
            
            L.marker(latlngs[latlngs.length - 1], { 
                icon: createMarkerIcon('#EF4444', 'fas fa-flag-checkered') // Red
            })
            .bindPopup(`<div class="text-black font-bold text-center">Fim<br><span class="text-xs text-gray-600">${endTimeStr}</span></div>`)
            .addTo(map);

            map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        }
    }
  };

  // Effect for Small Summary Map
  useEffect(() => {
    if (status === 'summary' && route.length > 0 && !showFullScreenMap) {
      const timer = setTimeout(() => {
        initializeLeafletMap('summary-map', summaryMapInstanceRef, false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, route, showFullScreenMap]);

  // Effect for Full Screen Map
  useEffect(() => {
    if (showFullScreenMap && route.length > 0) {
        // Allow DOM to render modal first
        const timer = setTimeout(() => {
            initializeLeafletMap('fullscreen-map', fullScreenMapInstanceRef, true);
        }, 100);
        return () => {
            clearTimeout(timer);
            if (fullScreenMapInstanceRef.current) {
                fullScreenMapInstanceRef.current.remove();
                fullScreenMapInstanceRef.current = null;
            }
        };
    }
  }, [showFullScreenMap, route]);

  const generateSummaryImage = (routePoints: GPSPoint[], dist: number, timeSecs: number, pace: string): string => {
      const canvas = document.createElement('canvas');
      const width = 600;
      const height = 800;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // 1. Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#18181b');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Header
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold italic 30px Inter, sans-serif';
      ctx.fillText('NURU FIT', 40, 60);
      
      ctx.fillStyle = '#E11D48'; // Red
      ctx.fillText('RUN', width - 110, 60);

      // 3. Stats Card
      const cardY = 550;
      ctx.fillStyle = '#18181b';
      if (ctx.roundRect) ctx.roundRect(30, cardY, width - 60, 200, 25);
      else ctx.fillRect(30, cardY, width - 60, 200);
      ctx.fill();
      
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.stroke();

      const formattedTime = formatTime(timeSecs);
      
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('DISTÂNCIA', 60, cardY + 50);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText(dist.toFixed(2), 60, cardY + 100);
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('km', 170, cardY + 100);

      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('TEMPO', 300, cardY + 50);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(formattedTime, 300, cardY + 90);

      ctx.fillStyle = '#9ca3af';
      ctx.fillText('PACE', 300, cardY + 140);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(pace, 300, cardY + 180);
      ctx.font = '16px sans-serif';
      ctx.fillText('/km', 400, cardY + 180);

      ctx.fillStyle = '#555';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(new Date().toLocaleString(), width / 2, height - 20);

      return canvas.toDataURL('image/png');
  };

  const finishTracking = () => {
      pauseTracking();
      const currentPaceVal = formatPace(elapsedTime, distance);
      const imgData = generateSummaryImage(route, distance, elapsedTime, currentPaceVal);
      setSummaryImage(imgData);
      
      // Set default title based on time
      const hour = new Date().getHours();
      const timeStr = hour < 12 ? 'Matinal' : hour < 18 ? 'da Tarde' : 'Noturna';
      setActivityTitle(`${activityType === 'Running' ? 'Corrida' : 'Caminhada'} ${timeStr}`);
      
      setStatus('summary');
  };

  const handleSaveActivity = () => {
      const currentPaceVal = formatPace(elapsedTime, distance);
      
      const session: ActivitySession = {
          id: Date.now().toString(),
          type: activityType,
          title: activityTitle,
          photoUrl: activityPhoto || undefined,
          date: new Date().toISOString(),
          startTime: startTime!,
          endTime: new Date().toISOString(),
          durationSeconds: elapsedTime,
          distanceKm: parseFloat(distance.toFixed(2)),
          paceMinKm: currentPaceVal,
          calories: Math.round(distance * (user?.weight || 70) * (activityType === 'Running' ? 1.036 : 0.7)),
          route: route,
          source: 'Manual'
      };
      
      saveActivity(session);
      navigate('/plan');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setActivityPhoto(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleImportHealth = async () => {
      setStatus('importing');
      setImportMessage(`A conectar ao ${healthAppName}...`);
      
      // Call Sync
      const count = await syncHealthData();
      
      if (count > 0) {
          setImportMessage(`${count} atividades importadas com sucesso!`);
          setTimeout(() => {
              navigate('/plan'); 
          }, 1500);
      } else {
          setImportMessage("Nenhuma atividade nova encontrada hoje.");
          setTimeout(() => {
              setStatus('idle');
          }, 1500);
      }
  };
  
  const downloadSummaryImage = () => {
      if (!summaryImage) return;
      const link = document.createElement('a');
      link.href = summaryImage;
      link.download = `nuru_activity_${new Date().toISOString().slice(0,10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Pace Calculation
  useEffect(() => {
      if (distance > 0.05) { 
          const paceDec = (elapsedTime / 60) / distance;
          const paceMin = Math.floor(paceDec);
          const paceSec = Math.round((paceDec - paceMin) * 60);
          setCurrentPace(`${paceMin}'${paceSec.toString().padStart(2, '0')}"`);
      }
  }, [distance, elapsedTime]);

  // Clean up
  useEffect(() => {
      return () => {
          clearInterval(timerRef.current);
          if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
          // Cleanup tracking map
          if (trackingMapRef.current) {
              trackingMapRef.current.remove();
              trackingMapRef.current = null;
          }
          if (summaryMapInstanceRef.current) {
              summaryMapInstanceRef.current.remove();
              summaryMapInstanceRef.current = null;
          }
      };
  }, []);

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const hrs = Math.floor(mins / 60);
      return hrs > 0 
        ? `${hrs}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (seconds: number, km: number) => {
      if (km === 0) return "0'00\"";
      const paceDec = (seconds / 60) / km;
      const paceMin = Math.floor(paceDec);
      const paceSec = Math.round((paceDec - paceMin) * 60);
      return `${paceMin}'${paceSec.toString().padStart(2, '0')}"`;
  };

  // RENDER SCREENS
  if (status === 'importing') {
      return (
          <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  <i className={`fab ${healthAppIcon} text-2xl text-white`}></i>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Sincronizando</h2>
              <p className="text-zinc-500 text-sm animate-pulse">{importMessage}</p>
          </div>
      );
  }

  if (status === 'idle') {
      return (
          <div className="h-screen bg-black flex flex-col p-6">
              <div className="flex justify-between items-center mb-8 pt-8">
                <h1 className="text-2xl font-black uppercase italic">Nova Atividade</h1>
                <button onClick={() => navigate('/plan')} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400">
                    <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-6">
                  <button 
                    onClick={() => setActivityType('Running')} 
                    className={`p-6 rounded-3xl border-2 flex items-center gap-6 transition-all ${activityType === 'Running' ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}
                  >
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${activityType === 'Running' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                          <i className="fas fa-running"></i>
                      </div>
                      <div className="text-left">
                          <h2 className="text-2xl font-black text-white">Corrida</h2>
                          <p className="text-sm text-zinc-500 font-bold uppercase">Outdoor GPS</p>
                      </div>
                  </button>

                  <button 
                    onClick={() => setActivityType('Walking')} 
                    className={`p-6 rounded-3xl border-2 flex items-center gap-6 transition-all ${activityType === 'Walking' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-900'}`}
                  >
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${activityType === 'Walking' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                          <i className="fas fa-walking"></i>
                      </div>
                      <div className="text-left">
                          <h2 className="text-2xl font-black text-white">Caminhada</h2>
                          <p className="text-sm text-zinc-500 font-bold uppercase">Outdoor GPS</p>
                      </div>
                  </button>
              </div>

              <div className="space-y-4">
                  <button onClick={startTracking} className="w-full py-5 bg-white text-black font-black text-xl rounded-2xl uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                      Iniciar
                  </button>
                  
                  <button 
                    onClick={handleImportHealth}
                    className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs rounded-2xl uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                  >
                      <i className={`fab ${healthAppIcon} text-lg`}></i>
                      Importar {healthAppName}
                  </button>
              </div>
          </div>
      );
  }

  if (status === 'countdown') {
      return (
          <div className="h-screen bg-red-600 flex items-center justify-center">
              <div className="text-[12rem] font-black text-white animate-ping">{countdown}</div>
          </div>
      );
  }

  if (status === 'tracking' || status === 'paused') {
      return (
          <div className="h-screen bg-black flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-zinc-900">
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
              </div>

              <div className="relative z-10 flex flex-col h-full justify-between p-6">
                  {/* Header Row */}
                  <div className="flex justify-between items-start pt-6 mb-4">
                      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                          <span className="text-xs text-zinc-400 font-bold uppercase mr-2">{activityType}</span>
                          {status === 'paused' ? (
                             <span className="text-yellow-500 text-xs font-black animate-pulse">PAUSADO</span>
                          ) : (
                             <span className="text-red-500 text-xs animate-pulse">● REC</span>
                          )}
                      </div>
                      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                           <span className="text-xl font-mono font-black text-white tracking-widest">{formatTime(elapsedTime)}</span>
                      </div>
                  </div>

                  {/* Live Map Area (Top Right Context) */}
                  <div className="flex justify-end mb-4">
                      <div id="tracking-map" className="w-full h-48 bg-zinc-800 rounded-2xl border border-zinc-700 shadow-lg relative overflow-hidden">
                          {/* Map injects here */}
                          {route.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-500 uppercase font-bold">
                                A obter GPS...
                            </div>
                          )}
                      </div>
                  </div>

                  {/* Stats Area */}
                  <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-6 border-t border-white/10 mb-8 mt-auto">
                      <div className="flex items-baseline justify-center mb-2">
                          <span className="text-7xl font-black text-white tracking-tighter">{distance.toFixed(2)}</span>
                          <span className="text-xl font-bold text-zinc-500 ml-2">KM</span>
                      </div>
                      
                      <div className="flex justify-around mt-6 border-t border-zinc-800 pt-6">
                          <div className="text-center">
                              <div className="text-2xl font-black text-white">{currentPace}</div>
                              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Ritmo Médio</div>
                          </div>
                          <div className="text-center">
                              <div className="text-2xl font-black text-white">
                                  {Math.round(distance * (user?.weight || 70) * (activityType === 'Running' ? 1.036 : 0.7))}
                              </div>
                              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Kcal</div>
                          </div>
                      </div>
                  </div>

                  {/* Auto-Pause Notification */}
                  {status === 'paused' && user?.autoPauseEnabled && (
                      <div className="absolute bottom-32 left-0 right-0 text-center animate-fade-in">
                          <span className="bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-full text-xs font-bold border border-yellow-500/50">
                              <i className="fas fa-pause-circle mr-2"></i>
                              Auto-Pause Ativado
                          </span>
                      </div>
                  )}

                  <div className="flex justify-center gap-6 mb-8">
                      {status === 'tracking' ? (
                          <button onClick={pauseTracking} className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-black shadow-lg">
                              <i className="fas fa-pause text-2xl text-white"></i>
                          </button>
                      ) : (
                          <>
                            <button onClick={resumeTracking} className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center border-4 border-black shadow-lg">
                                <i className="fas fa-play text-2xl text-black"></i>
                            </button>
                            <button onClick={finishTracking} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center border-4 border-black shadow-lg">
                                <i className="fas fa-flag-checkered text-2xl text-white"></i>
                            </button>
                          </>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // Summary View
  return (
      <div className="h-screen bg-black flex flex-col p-6 overflow-y-auto">
          <div className="pt-8 mb-6 text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-black text-2xl shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                  <i className="fas fa-trophy"></i>
              </div>
              <h1 className="text-3xl font-black uppercase italic text-white">Atividade Concluída!</h1>
              <p className="text-zinc-500 text-sm">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
          </div>

          {/* Title Input */}
          <div className="mb-4">
              <input 
                  type="text" 
                  value={activityTitle} 
                  onChange={(e) => setActivityTitle(e.target.value)}
                  className="w-full bg-zinc-900 border-b border-zinc-800 text-center text-xl font-bold text-white pb-2 focus:outline-none focus:border-red-600 transition-colors"
                  placeholder="Nome da Atividade"
              />
          </div>

          {/* Interactive Map Section */}
          <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 mb-6 relative group">
              <div id="summary-map" className="w-full h-64 bg-zinc-800 relative">
                  {/* Leaflet Map will be mounted here */}
                  {!route.length && <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs">Sem dados de GPS</div>}
              </div>
              
              {/* Expand Button */}
              {route.length > 0 && (
                  <button 
                    onClick={() => setShowFullScreenMap(true)}
                    className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-lg text-white hover:bg-black/80 transition-colors z-[400] border border-white/10"
                  >
                      <i className="fas fa-expand-alt"></i>
                  </button>
              )}
          </div>
          
          {/* Full Screen Map Modal */}
          {showFullScreenMap && (
              <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
                  <div className="flex justify-between items-center p-4 bg-black border-b border-zinc-800 z-10">
                      <h2 className="text-lg font-black italic uppercase">Rota Detalhada</h2>
                      <button onClick={() => setShowFullScreenMap(false)} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400">
                          <i className="fas fa-times"></i>
                      </button>
                  </div>
                  <div className="flex-1 relative">
                      <div id="fullscreen-map" className="absolute inset-0 bg-zinc-900"></div>
                      <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 z-[400] flex justify-between items-center">
                          <div>
                              <div className="text-[10px] text-zinc-500 uppercase font-bold">Distância Total</div>
                              <div className="text-xl font-black text-white">{distance.toFixed(2)} km</div>
                          </div>
                          <div>
                              <div className="text-[10px] text-zinc-500 uppercase font-bold">Tempo</div>
                              <div className="text-xl font-black text-white">{formatTime(elapsedTime)}</div>
                          </div>
                      </div>
                  </div>
              </div>
          )}
          
          {/* Photo Upload Section */}
          <div className="mb-6">
              <div 
                onClick={() => photoInputRef.current?.click()}
                className="w-full h-40 bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-600 transition-all overflow-hidden relative"
              >
                  {activityPhoto ? (
                      <img src={activityPhoto} alt="Activity" className="w-full h-full object-cover" />
                  ) : (
                      <>
                        <i className="fas fa-camera text-2xl text-zinc-500 mb-2"></i>
                        <span className="text-xs text-zinc-500 font-bold uppercase">Adicionar Foto</span>
                      </>
                  )}
                  <input 
                    type="file" 
                    ref={photoInputRef} 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                  {activityPhoto && (
                      <div className="absolute bottom-2 right-2 bg-black/50 p-2 rounded-full backdrop-blur-sm">
                          <i className="fas fa-edit text-white text-xs"></i>
                      </div>
                  )}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold">Distância Total</div>
                   <div className="text-2xl font-black text-white">{distance.toFixed(2)} <span className="text-sm text-zinc-500">km</span></div>
               </div>
               <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold">Tempo Total</div>
                   <div className="text-2xl font-black text-white">{formatTime(elapsedTime)}</div>
               </div>
               <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold">Ritmo Médio</div>
                   <div className="text-2xl font-black text-white">{currentPace} <span className="text-sm text-zinc-500">/km</span></div>
               </div>
               <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold">Calorias</div>
                   <div className="text-2xl font-black text-white">{Math.round(distance * (user?.weight || 70) * (activityType === 'Running' ? 1.036 : 0.7))}</div>
               </div>
               <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold">Pontos GPS</div>
                   <div className="text-2xl font-black text-white">{route.length}</div>
               </div>
               <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold">Distância/Ponto</div>
                   <div className="text-2xl font-black text-white">
                       {route.length > 1 ? (distance * 1000 / route.length).toFixed(1) : 0} <span className="text-sm text-zinc-500">m</span>
                   </div>
               </div>
          </div>

          {/* Shareable Image */}
          {summaryImage && (
              <div className="text-center mb-6">
                  <p className="text-xs text-zinc-500 mb-2">Imagem de Resumo (Toque para Baixar)</p>
                  <button 
                    onClick={downloadSummaryImage}
                    className="relative group mx-auto block"
                  >
                      <img 
                        src={summaryImage} 
                        alt="Resumo da Atividade" 
                        className="w-48 h-auto rounded-xl border-2 border-zinc-800 shadow-2xl transition-all group-hover:border-red-600 hover:scale-105 transform duration-300" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <i className="fas fa-download text-white text-3xl drop-shadow-md"></i>
                      </div>
                  </button>
              </div>
          )}

          <button onClick={handleSaveActivity} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors">
              Salvar Atividade
          </button>
      </div>
  );
};

export default ActivityScreen;
