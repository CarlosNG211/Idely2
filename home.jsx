import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Package, User, DollarSign, Clock, Navigation, MessageCircle, CheckCircle, AlertCircle, Building, X, Store, Printer, ShoppingBasket, Info, MapIcon, ChevronDown, Filter, RefreshCw, Truck } from 'lucide-react';
import { db } from './conexion';
import { ref, onValue, update, remove, serverTimestamp as realtimeServerTimestamp } from 'firebase/database';
import { getFirestore, doc, updateDoc, collection, query, where, getDocs, serverTimestamp, getDoc } from 'firebase/firestore';

const DeliveryMapSystem = () => {
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const REPARTIDOR_EMAIL = 'camlosnochemala@gmail.com';
  const firestore = getFirestore();

  // ✅ FUNCIÓN PARA OBTENER TOKEN FCM DEL USUARIO
  const getUserFCMToken = async (userEmail) => {
    try {
      console.log(`🔍 Buscando token FCM para: ${userEmail}`);
      
      const tokenDocRef = doc(firestore, userEmail, 'token');
      const tokenDoc = await getDoc(tokenDocRef);
      
      if (tokenDoc.exists()) {
        const tokenData = tokenDoc.data();
        console.log(`✅ Token encontrado para ${userEmail}`);
        return tokenData.token;
      } else {
        console.log(`❌ No existe documento token para ${userEmail}`);
      }
      return null;
    } catch (error) {
      console.error(`❌ Error obteniendo token FCM para ${userEmail}:`, error);
      return null;
    }
  };

  // ✅ FUNCIÓN PARA OBTENER ACCESS TOKEN
  const getAccessToken = async () => {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: await createJWT(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      } else {
        console.error('❌ Error obteniendo access token:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('❌ Error en getAccessToken:', error);
      return null;
    }
  };

  // ✅ CREAR JWT MANUALMENTE
  const createJWT = async () => {
    const serviceAccount = {
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQClJIa3kG1q1pTj\ntbn6V1KVWy7N1qfKNj8WzczDMMg9RZPUKbm5pUkZW7v5suIB+EExJQTDnSypTMpF\nGJeFczE8OItr1XXZIkVK5vM3O0WfkVklKwIaKqGPJtBfhGNPY8TNcCKJXtlzDKvZ\na7IYXfKgfksxbrejXzeQMaY+feXpwTSnFIhVsow0ptyEfxLa+EzgqRjN/qPhK8oe\nlRf4Ga1lP9KQl0OEcnOMOgR5wZ1irOk6t6+1/9eL+7g2ax9vZS3CDRBgJjeLrX7W\nC4F3OEyh/HKJ/PH0d8SiAr1zp+iY9K613srKD/MDuRp9QYewpSdKJdSam7LeSka1\nOqY5DJlfAgMBAAECggEAA2WYzPDEHFt6ou0DG0/zp6GWqccNjq/3cLmLpR+ewRaO\n3XOhgUR/nmEzAk9ty7uHYv9ydX856nnGsjIyxrtTtNdblCQ0zh8zJon7+zhVazG9\nX1lAgWOp3B/OgDVtQSP8vyWfYcOzE1kWL6YXUD+R5DNU1p8JA67XwnUDv8a/2Ixo\n/jBq4N1CE9qfkWNBTEbHSJHDKXO5YKtRud5Q4TC05dLoGYxNA8JivNOSu6V86Gne\nnUYDC/Iz4V27QniFrYLENV8nAe8bYcqeJDTtNODPQED6rdqc7h1FWxh37qpoVBWA\nKvnGDZfKCo1091nCKDxbOhvbi/GKUt+ybtYLlLmpiQKBgQDTmfUiDZDnNB6AGQWV\nF/CAf4zuQwh9XJkEoRnhQCbYUQeg9T+mdq9M0r6bwd94wWdPKawrmZ0Y4rxYpZjX\n0mu0MVW7TUTlQMFtM0LT2l7CaWHky4SJcYFAnMHfeqapqradlJAtH6Fgq/mnqelD\nBM60A9UE8g/C0OZOhmPLoxl15QKBgQDHyxEJDr7Qn2K3TOyv7BbrqBI+InRVYGwn\npOILhfAHxeqnrVWNpqrwZhULPBGtOdyNZa/JJ1EP98BxkXWtfr2XPInBcDyv0TPd\njdYXiPO0QBDU4ZxHIZODb3q6dAQx6i2rUsQB5tn20+C1ufxwYvGLvP1hy7wYc01G\nw/DdJv/d8wKBgQC1nBXAPFR5m0nyN4eLBxjrsI2MkQvgTHEof/xuT1kHn8QkaVlP\nzd122gmuNR9PzO6WCvYyFY23piJxEu+zjG3UIeOq9g6DlKhuyOg6W9mokjnq3KHM\nNRbyFZhv7hzM0jAZ30A++j7Pccq8FCCX3LBr4D4cGIVed1yzWLSeOkXH4QKBgQC5\nnUjoV1CjVVBK5yaFkhsBOJYqL6xQnVIdyqtO9VI4hoEo4no3LX5l9RDb7SSnALiM\njMoxYVuIMC4T1IW1d6f/13hLxFA9L2i2Ds2188Al19dLT4b29pSraWhlzN8Q2HUx\nU6VR9vzMua9sZavHZcTug9gLgVHwjT5f3i3p6A+STQKBgE3CcexLBs9vsd6H8oAK\nlvprg8tVS/L8YtdYZYJKzn1UbLwfUnRxQ9/NV9dZyUrT+cXYJNl0FLIZ87o0m/50\n8YzmtGFTyei+xlWvSwaMHNykRHzfj8V+FTZnJ+Ur1wloXCrxwT8Up24GKksJP/tu\nC7Meb57h23H0wqmdg2aLrffo\n-----END PRIVATE KEY-----\n",
      client_email: "firebase-adminsdk-g1mkp@chilitosramen-89223.iam.gserviceaccount.com",
    };

    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: "RS256",
      typ: "JWT"
    };

    const payload = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };

    const base64Header = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const base64Payload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const unsignedToken = `${base64Header}.${base64Payload}`;

    try {
      const privateKey = await importPrivateKey(serviceAccount.private_key);
      const signature = await signData(unsignedToken, privateKey);
      const base64Signature = arrayBufferToBase64(signature).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      
      return `${unsignedToken}.${base64Signature}`;
    } catch (error) {
      console.error('❌ Error creando JWT:', error);
      return null;
    }
  };

  // Helper functions para JWT
  const importPrivateKey = async (pem) => {
    const pemContents = pem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    const binaryDer = atob(pemContents);
    const binaryDerArray = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      binaryDerArray[i] = binaryDer.charCodeAt(i);
    }

    return await crypto.subtle.importKey(
      'pkcs8',
      binaryDerArray.buffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );
  };

  const signData = async (data, key) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    return await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, dataBuffer);
  };

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // ✅ FUNCIÓN PARA ENVIAR NOTIFICACIÓN FCM
  const sendFCMNotification = async (token, title, body, data = {}) => {
    try {
      console.log('📤 Intentando enviar notificación...');
      console.log('Token destinatario:', token);
      console.log('Título:', title);
      console.log('Mensaje:', body);

      const accessToken = await getAccessToken();
      if (!accessToken) {
        console.error('❌ No se pudo obtener access token');
        return false;
      }

      console.log('✅ Access token obtenido correctamente');

      const response = await fetch(
        'https://fcm.googleapis.com/v1/projects/chilitosramen-89223/messages:send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token: token,
              notification: {
                title: title,
                body: body,
              },
              data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                status: 'done',
                type: 'delivery_update',
              },
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  channel_id: 'high_importance_channel',
                  notification_priority: 'PRIORITY_MAX',
                },
              },
              apns: {
                headers: {
                  'apns-priority': '10',
                },
                payload: {
                  aps: {
                    sound: 'default',
                    badge: 1,
                  },
                },
              },
            },
          }),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Notificación enviada exitosamente');
        console.log('Respuesta FCM:', responseData);
        return true;
      } else {
        const errorData = await response.json();
        console.error('❌ Error en respuesta FCM:', errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ Error al enviar notificación:', error);
      return false;
    }
  };

  // ✅ FUNCIÓN PRINCIPAL PARA ACTUALIZAR ESTADO
  const handleUpdateEstado = async (pedidoId, nuevoEstado) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log(`🔄 Actualizando pedido ${pedidoId} a estado: ${nuevoEstado}`);

    try {
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (!pedido) {
        alert('❌ Pedido no encontrado');
        return;
      }

      // 1. Actualizar Realtime Database
      const pedidoRef = ref(db, `pedidos_activos/${pedidoId}`);
      const realtimeUpdate = {
        estado: nuevoEstado,
        repartidorEmail: REPARTIDOR_EMAIL,
        repartidorNombre: 'Repartidor',
        fechaActualizacion: Date.now()
      };

      // Configurar mensajes según el estado
      let notificationTitle = '';
      let notificationBody = '';

      if (nuevoEstado === 'En Camino') {
        realtimeUpdate.enCamino = true;
        realtimeUpdate.afuera = false;
        realtimeUpdate.problema = false;
        realtimeUpdate.repartidorFrase = 'Tu pedido está en camino';
        notificationTitle = '🚛 ¡Tu pedido está en camino!';
        notificationBody = 'El repartidor ya salió y está en camino con tu pedido';
      } else if (nuevoEstado === 'Afuera') {
        realtimeUpdate.afuera = true;
        realtimeUpdate.enCamino = false;
        realtimeUpdate.problema = false;
        realtimeUpdate.repartidorFrase = 'Estoy afuera con tu pedido';
        notificationTitle = '📍 ¡El repartidor ha llegado!';
        notificationBody = 'El repartidor está afuera con tu pedido. ¡Sal a recibirlo!';
      } else if (nuevoEstado === 'Error') {
        realtimeUpdate.problema = true;
        realtimeUpdate.afuera = false;
        realtimeUpdate.enCamino = false;
        realtimeUpdate.repartidorFrase = 'Hay un problema con tu pedido';
        notificationTitle = '⚠️ Problema con tu pedido';
        notificationBody = 'Estamos resolviendo un inconveniente con tu pedido. Te mantendremos informado.';
      } else if (nuevoEstado === 'Listo') {
        realtimeUpdate.enCamino = false;
        realtimeUpdate.afuera = false;
        realtimeUpdate.problema = false;
        realtimeUpdate.repartidorFrase = 'Tu pedido está listo';
        notificationTitle = '✅ ¡Tu pedido está listo!';
        notificationBody = 'Tu pedido ha sido completado exitosamente.';
      }

      await update(pedidoRef, realtimeUpdate);
      console.log('✅ Realtime Database actualizado');

      // 2. Actualizar Firestore del cliente
      if (pedido.email && pedido.orderId) {
        await actualizarEstadoCliente(pedido.email, pedido.orderId, nuevoEstado);
      }

      // 3. Actualizar Repartidor collection
      await actualizarRepartidorCollection(pedidoId, nuevoEstado);

      // 4. 🔔 ENVIAR NOTIFICACIÓN FCM AL CLIENTE
      if (pedido.email) {
        console.log(`📧 Email del cliente: ${pedido.email}`);
        const userToken = await getUserFCMToken(pedido.email);
        
        if (userToken) {
          console.log('✅ Token FCM obtenido, enviando notificación...');
          const notificationSent = await sendFCMNotification(
            userToken,
            notificationTitle,
            notificationBody,
            {
              orderId: pedido.orderId || '',
              estado: nuevoEstado,
              timestamp: Date.now().toString()
            }
          );
          
          if (notificationSent) {
            console.log('✅ Notificación enviada al cliente');
          } else {
            console.log('⚠️ Falló el envío de la notificación');
          }
        } else {
          console.log('⚠️ No se encontró token FCM para el usuario');
        }
      } else {
        console.log('⚠️ El pedido no tiene email asociado');
      }

      // 5. Si es "Listo", mover a completados
      if (nuevoEstado === 'Listo') {
        const completadosRef = ref(db, `pedidos_completados/${pedidoId}`);
        const pedidoCompleto = {
          ...pedido,
          ...realtimeUpdate,
          fechaCompletado: Date.now()
        };
        
        await update(completadosRef, pedidoCompleto);
        await remove(pedidoRef);
        
        const colaPedidosRef = ref(db, `cola_pedidos/${pedidoId}`);
        await remove(colaPedidosRef);
        
        console.log('✅ Pedido movido a completados');
      }

      // 6. Actualizar UI local
      setPedidos(pedidos.map(p => 
        p.id === pedidoId ? { ...p, estado: nuevoEstado, repartidorEmail: REPARTIDOR_EMAIL } : p
      ));
      
      setSelectedPedido(null);
      alert(`✅ Pedido actualizado a: ${nuevoEstado}`);
      
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      alert('❌ Error al actualizar el pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  const actualizarEstadoCliente = async (clienteEmail, orderId, nuevoEstado) => {
    try {
      const vendidosRef = collection(firestore, clienteEmail, 'vendidos', '0');
      const q = query(vendidosRef, where('orderId', '==', orderId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const pedidoDoc = querySnapshot.docs[0];
        await updateDoc(pedidoDoc.ref, {
          estado: nuevoEstado,
          fechaActualizacion: serverTimestamp(),
          ultimaActualizacionRepartidor: REPARTIDOR_EMAIL
        });
        console.log(`✅ Estado actualizado en Firestore del cliente: ${nuevoEstado}`);
      }

      const repartidorRef = doc(firestore, clienteEmail, 'repartidor');
      const repartidorData = {
        nombre: 'Repartidor',
        email: REPARTIDOR_EMAIL,
        estado: nuevoEstado,
        fechaActualizacion: serverTimestamp()
      };

      if (nuevoEstado === 'En Camino') {
        repartidorData.frase = 'Tu pedido está en camino';
        repartidorData.enCamino = true;
        repartidorData.afuera = false;
        repartidorData.problema = false;
      } else if (nuevoEstado === 'Afuera') {
        repartidorData.frase = 'Estoy afuera con tu pedido';
        repartidorData.afuera = true;
        repartidorData.enCamino = false;
        repartidorData.problema = false;
      } else if (nuevoEstado === 'Error') {
        repartidorData.frase = 'Hay un problema con tu pedido, lo resolveremos en breve';
        repartidorData.problema = true;
        repartidorData.afuera = false;
        repartidorData.enCamino = false;
      } else if (nuevoEstado === 'Listo') {
        repartidorData.frase = 'Tu pedido está listo';
        repartidorData.enCamino = false;
        repartidorData.afuera = false;
        repartidorData.problema = false;
      }

      await updateDoc(repartidorRef, repartidorData);
      console.log(`✅ Documento repartidor actualizado en Firestore del cliente`);
    } catch (error) {
      console.error('❌ Error actualizando estado en Firestore:', error);
    }
  };

  const actualizarRepartidorCollection = async (docId, nuevoEstado) => {
    try {
      const repartidorDocRef = doc(firestore, 'Repartidor', docId);
      
      const updateData = {
        estado: nuevoEstado,
        repartidorEmail: REPARTIDOR_EMAIL,
        fechaActualizacion: serverTimestamp()
      };

      if (nuevoEstado === 'En Camino') {
        updateData.enCamino = true;
        updateData.afuera = false;
        updateData.problema = false;
      } else if (nuevoEstado === 'Afuera') {
        updateData.afuera = true;
        updateData.enCamino = false;
        updateData.problema = false;
      } else if (nuevoEstado === 'Error') {
        updateData.problema = true;
        updateData.afuera = false;
        updateData.enCamino = false;
      } else if (nuevoEstado === 'Listo') {
        updateData.enCamino = false;
        updateData.afuera = false;
        updateData.problema = false;
        updateData.fechaCompletado = serverTimestamp();
      }

      await updateDoc(repartidorDocRef, updateData);
      console.log(`✅ Estado actualizado en Repartidor collection: ${nuevoEstado}`);
    } catch (error) {
      console.error('❌ Error actualizando Repartidor collection:', error);
    }
  };

useEffect(() => {
  const pedidosRef = ref(db, 'pedidos_activos');
  
  const unsubscribe = onValue(pedidosRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const pedidosArray = Object.entries(data).map(([id, pedido]) => ({
        id,
        orderId: pedido.orderId || null,
        nombreCliente: pedido.nombreCliente || null,
        telefono: pedido.telefono || null,
        direccion: pedido.direccion || null,
        cantidad: pedido.cantidad || 0,
        metodoPago: pedido.metodoPago || null,
        montoPagado: pedido.montoPagado || null,
        cambio: pedido.cambio || null,
        estado: pedido.estado || 'pendiente',
        ubicacion: pedido.ubicacion || null,
        edificio: pedido.edificio || null,
        productos: pedido.productos || [],
        vendedorData: pedido.vendedorData || null,
        comentarioe: pedido.comentarioe || null,
        comentariop: pedido.comentariop || null,
        email: pedido.email || null,
        repartidorEmail: pedido.repartidorEmail || null,
        repartidorNombre: pedido.repartidorNombre || null,
        repartidorImagen: pedido.repartidorImagen || null,
      }));
      setPedidos(pedidosArray);
    } else {
      setPedidos([]);
    }
    setLoading(false);
  }, (error) => {
    console.error('Error al cargar pedidos:', error);
    setLoading(false);
  });

  // ✅ AGREGAR: Auto-refresh cada 30 segundos
  const refreshInterval = setInterval(() => {
    console.log('🔄 Actualizando pedidos automáticamente...');
    // Firebase Realtime Database ya está escuchando cambios en tiempo real
    // Este log es solo para confirmar que el intervalo está funcionando
  }, 30000); // 30 segundos

  return () => {
    unsubscribe();
    clearInterval(refreshInterval); // Limpiar el intervalo al desmontar
  };
}, []);

  const zonasEntrega = [
    { nombre: 'Edificio A', centro: { lat: 19.72914, lng: -98.46742 }, radio: 29.25, color: '#1976D2', icon: '🏢' },
    { nombre: 'Edificio B', centro: { lat: 19.72971, lng: -98.46744 }, radio: 26.76, color: '#388E3C', icon: '🏢' },
    { nombre: 'Edificio C', centro: { lat: 19.72961, lng: -98.46659 }, radio: 28.19, color: '#D32F2F', icon: '🏢' },
    { nombre: 'Edificio D', centro: { lat: 19.72914, lng: -98.46619 }, radio: 28.23, color: '#F57C00', icon: '🏢' },
    { nombre: 'Edificio E', centro: { lat: 19.72999, lng: -98.46624 }, radio: 21.16, color: '#7B1FA2', icon: '🏢' },
    { nombre: 'Edificio F', centro: { lat: 19.73021, lng: -98.46731 }, radio: 26.40, color: '#0097A7', icon: '🏢' },
    { nombre: 'Edificio G', centro: { lat: 19.73048, lng: -98.46699 }, radio: 16.36, color: '#C2185B', icon: '🏢' },
    { nombre: 'Cafetería', centro: { lat: 19.73003, lng: -98.46689 }, radio: 11.76, color: '#8D6E63', icon: '☕' },
    { nombre: 'Gallineros', centro: { lat: 19.72997, lng: -98.46662 }, radio: 16.88, color: '#FFB74D', icon: '🐔' },
    { nombre: 'En medio', centro: { lat: 19.72952, lng: -98.46701 }, radio: 16.10, color: '#4DB6AC', icon: '🎯' },
    { nombre: 'Árbol de Redes', centro: { lat: 19.72930, lng: -98.46672 }, radio: 21.17, color: '#66BB6A', icon: '🌳' },
    { nombre: 'Fuera Edificio E', centro: { lat: 19.72967, lng: -98.46615 }, radio: 18.41, color: '#9575CD', icon: '📍' },
    { nombre: 'Polideportivo', centro: { lat: 19.72958, lng: -98.46523 }, radio: 75.99, color: '#5D4037', icon: '🏟️' },
    { nombre: 'Dentro de ITESA', centro: { lat: 19.72917, lng: -98.46605 }, radio: 208.99, color: '#9C27B0', icon: '🎓' },
  ];

  const calcularDistancia = (punto1, punto2) => {
    const R = 6371000;
    const lat1Rad = punto1.lat * Math.PI / 180;
    const lat2Rad = punto2.lat * Math.PI / 180;
    const deltaLat = (punto2.lat - punto1.lat) * Math.PI / 180;
    const deltaLon = (punto2.lng - punto1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const identificarEdificio = (ubicacion) => {
    if (!ubicacion || !ubicacion.lat || !ubicacion.lng) {
      return { nombre: 'Sin ubicación', color: '#757575', icon: '❓' };
    }

    for (let zona of zonasEntrega) {
      if (zona.nombre === 'Fuera de Universidad' || zona.nombre === 'Dentro de ITESA') continue;
      const distancia = calcularDistancia(zona.centro, ubicacion);
      if (distancia <= zona.radio) {
        return zona;
      }
    }
    
    const zonaITESA = zonasEntrega.find(z => z.nombre === 'Dentro de ITESA');
    if (zonaITESA) {
      const distancia = calcularDistancia(zonaITESA.centro, ubicacion);
      if (distancia <= zonaITESA.radio) {
        return zonaITESA;
      }
    }
    return { nombre: 'Fuera de Universidad', color: '#757575', icon: '🌍' };
  };

  const abrirWhatsApp = (telefono, nombre) => {
    if (!telefono) {
      alert('No hay número de teléfono disponible');
      return;
    }
    const numeroLimpio = telefono.replace(/\D/g, '');
    const mensaje = `Hola ${nombre || 'cliente'}, soy el repartidor con tu pedido.`;
    const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const abrirGoogleMaps = (ubicacion) => {
    if (!ubicacion || !ubicacion.lat || !ubicacion.lng) {
      alert('No hay ubicación disponible para este pedido');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${ubicacion.lat},${ubicacion.lng}`;
    window.open(url, '_blank');
  };

  const pedidosFiltrados = pedidos.filter(p => {
    if (filter === 'todos') return true;
    if (filter === 'pendientes') return p.estado === 'pendiente';
    if (filter === 'en_camino') return p.estado === 'En Camino';
    if (filter === 'afuera') return p.estado === 'Afuera';
    if (filter === 'completados') return p.estado === 'Listo';
    return true;
  });

  const getEstadoColor = (estado) => {
    const colores = {
      'pendiente': '#f59e0b',
      'En Camino': '#3b82f6',
      'Afuera': '#10b981',
      'Listo': '#10b981',
      'Error': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  };

  const getEstadoIcon = (estado) => {
    const iconos = {
      'pendiente': Clock,
      'En Camino': Truck,
      'Afuera': MapPin,
      'Listo': CheckCircle,
      'Error': AlertCircle
    };
    return iconos[estado] || Clock;
  };

  const styles = {
    container: {
      minHeight: '100vh',
      minHeight: '100dvh',
      background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: 'env(safe-area-inset-bottom)',
      WebkitFontSmoothing: 'antialiased'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
      color: 'white',
      padding: 'max(env(safe-area-inset-top), 1rem) 1rem 1rem',
      marginBottom: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 30
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.2s ease',
      overflow: 'hidden',
      WebkitTapHighlightColor: 'transparent'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding: '0.375rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.8125rem',
      fontWeight: '600'
    },
    button: {
      padding: '0.875rem 1rem',
      borderRadius: '12px',
      fontWeight: '600',
      border: 'none',
      cursor: isProcessing ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      WebkitTapHighlightColor: 'transparent',
      WebkitTouchCallout: 'none',
      userSelect: 'none',
      fontSize: '0.9375rem',
      minHeight: '44px',
      opacity: isProcessing ? 0.6 : 1
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '1rem', fontWeight: '500' }}>
            Cargando pedidos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .card-animate {
            animation: slideIn 0.3s ease;
          }
          
          @supports (padding: max(0px)) {
            body {
              padding-left: env(safe-area-inset-left);
              padding-right: env(safe-area-inset-right);
            }
          }
          
          button:active:not(:disabled) {
            opacity: 0.7;
          }
        `}
      </style>

      <div style={styles.header}>
        <div style={{ maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.2)', 
                padding: '0.75rem', 
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <Package size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: '700', margin: 0, marginBottom: '0.125rem' }}>
                  Panel de Entregas
                </h1>
                <p style={{ fontSize: '0.8125rem', opacity: 0.9, margin: 0 }}>
                  Gestión de repartidor
                </p>
              </div>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              padding: '0.625rem 1rem', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              minWidth: '60px'
            }}>
              <p style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, lineHeight: 1 }}>
                {pedidosFiltrados.length}
              </p>
              <p style={{ fontSize: '0.6875rem', opacity: 0.9, margin: 0, marginTop: '0.125rem' }}>
                Activos
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 1rem 1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '0.5rem',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}>
            {['todos', 'pendientes', 'en_camino', 'afuera', 'completados'].map((filterKey) => {
              const labels = {
                todos: { text: 'Todos', icon: Package },
                pendientes: { text: 'Pendientes', icon: Clock },
                en_camino: { text: 'En Camino', icon: Truck },
                afuera: { text: 'Afuera', icon: MapPin },
                completados: { text: 'Listos', icon: CheckCircle }
              };
              const { text, icon: Icon } = labels[filterKey];
              
              return (
                <button
                  key={filterKey}
                  onClick={() => setFilter(filterKey)}
                  style={{
                    ...styles.button,
                    background: filter === filterKey ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                    color: filter === filterKey ? 'white' : '#374151',
                    boxShadow: filter === filterKey 
                      ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                      : '0 2px 6px rgba(0, 0, 0, 0.1)',
                    padding: '0.625rem 1rem',
                    minHeight: '44px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <Icon size={18} />
                  {text}
                </button>
              );
            })}
          </div>
        </div>

        {pedidosFiltrados.length === 0 ? (
          <div style={{ ...styles.card, padding: '3rem 1.5rem', textAlign: 'center' }}>
            <Package size={64} style={{ color: '#d1d5db', margin: '0 auto 0.75rem' }} />
            <p style={{ color: '#6b7280', fontSize: '1rem', fontWeight: '500' }}>
              No hay pedidos en esta categoría
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pedidosFiltrados.map((pedido, index) => {
              const zonaInfo = identificarEdificio(pedido.ubicacion);
              const EstadoIcon = getEstadoIcon(pedido.estado);
              
              return (
                <div
                  key={pedido.id}
                  className="card-animate"
                  style={{
                    ...styles.card,
                    animationDelay: `${index * 0.05}s`
                  }}
                >
                  <div style={{ 
                    padding: '1rem',
                    background: 'linear-gradient(to right, #f9fafb, white)',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                        <div style={{ 
                          ...styles.badge, 
                          backgroundColor: getEstadoColor(pedido.estado),
                          color: 'white',
                          alignSelf: 'flex-start'
                        }}>
                          <EstadoIcon size={14} />
                          {pedido.estado}
                        </div>
                        {pedido.orderId && (
                          <span style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.8125rem', 
                            color: '#6b7280',
                            background: '#f3f4f6',
                            padding: '0.25rem 0.625rem',
                            borderRadius: '6px',
                            alignSelf: 'flex-start'
                          }}>
                            #{pedido.orderId}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981', margin: 0, lineHeight: 1 }}>
                          ${pedido.cantidad?.toFixed ? pedido.cantidad.toFixed(2) : pedido.cantidad || '0.00'}
                        </p>
                        {pedido.metodoPago && (
                          <p style={{ fontSize: '0.6875rem', color: '#6b7280', margin: 0, marginTop: '0.25rem' }}>
                            {pedido.metodoPago}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                      <span style={{ fontSize: '1.125rem' }}>{zonaInfo.icon}</span>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: `${zonaInfo.color}15`,
                        color: zonaInfo.color,
                        border: `1.5px solid ${zonaInfo.color}30`
                      }}>
                        <Building size={14} />
                        <span style={{ fontSize: '0.8125rem' }}>{pedido.edificio || zonaInfo.nombre}</span>
                      </span>
                    </div>

                    {pedido.nombreCliente && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151' }}>
                          <User size={16} style={{ color: '#667eea' }} />
                          <span style={{ fontWeight: '600', fontSize: '0.9375rem' }}>{pedido.nombreCliente}</span>
                        </div>
                      </div>
                    )}

                    {pedido.direccion && (
                      <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', color: '#6b7280', fontSize: '0.8125rem' }}>
                        <MapPin size={14} style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.4 }}>{pedido.direccion}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    padding: '0.75rem',
                    background: '#f9fafb',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem'
                  }}>
                    {pedido.telefono && (
                      <button
                        onClick={() => abrirWhatsApp(pedido.telefono, pedido.nombreCliente)}
                        style={{
                          ...styles.button,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                          padding: '0.75rem 0.5rem',
                          fontSize: '0.8125rem'
                        }}
                      >
                        <MessageCircle size={16} />
                        <span style={{ display: window.innerWidth > 380 ? 'inline' : 'none' }}>Chat</span>
                      </button>
                    )}
                    
                    {pedido.ubicacion && (
                      <button
                        onClick={() => abrirGoogleMaps(pedido.ubicacion)}
                        style={{
                          ...styles.button,
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                          padding: '0.75rem 0.5rem',
                          fontSize: '0.8125rem'
                        }}
                      >
                        <Navigation size={16} />
                        <span style={{ display: window.innerWidth > 380 ? 'inline' : 'none' }}>Ir</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedPedido(selectedPedido?.id === pedido.id ? null : pedido)}
                      style={{
                        ...styles.button,
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)',
                        padding: '0.75rem 0.5rem',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <Info size={16} />
                      <span style={{ display: window.innerWidth > 380 ? 'inline' : 'none' }}>Info</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedPedido && (
        <>
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 40,
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={() => setSelectedPedido(null)}
          />
          
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'slideIn 0.3s ease',
            padding: 0
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
              width: '100%',
              maxHeight: '90vh',
              maxHeight: '90dvh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                padding: '1rem',
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'white',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Package size={20} />
                  <h2 style={{ fontSize: '1.125rem', fontWeight: '700', margin: 0 }}>
                    Detalles del Pedido
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedPedido(null)}
                  disabled={isProcessing}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '36px',
                    minHeight: '36px',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ 
                overflowY: 'auto',
                flex: 1,
                WebkitOverflowScrolling: 'touch'
              }}>
                <div style={{ padding: '1rem', background: '#f0f9ff' }}>
                  <h3 style={{ 
                    fontWeight: '700',
                    color: '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    fontSize: '1rem'
                  }}>
                    <Info size={18} style={{ color: '#3b82f6' }} />
                    Información del Pedido
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {selectedPedido.orderId && (
                      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '0.875rem', border: '1px solid #dbeafe' }}>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>ID del Pedido</p>
                        <p style={{ fontWeight: '600', color: '#1f2937', margin: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {selectedPedido.orderId}
                        </p>
                      </div>
                    )}

                    {selectedPedido.nombreCliente && (
                      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '0.875rem', border: '1px solid #dbeafe' }}>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Cliente</p>
                        <p style={{ fontWeight: '600', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
                          <User size={16} style={{ color: '#667eea' }} />
                          {selectedPedido.nombreCliente}
                        </p>
                      </div>
                    )}

                    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '0.875rem', border: '2px solid #dbeafe' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontWeight: '500', fontSize: '0.875rem' }}>Total a Cobrar</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                          ${selectedPedido.cantidad?.toFixed ? selectedPedido.cantidad.toFixed(2) : selectedPedido.cantidad || '0.00'}
                        </span>
                      </div>
                    </div>

                    {selectedPedido.metodoPago && (
                      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '0.875rem', border: '1px solid #dbeafe' }}>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Método de Pago</p>
                        <p style={{ fontWeight: '600', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
                          <DollarSign size={16} style={{ color: '#10b981' }} />
                          {selectedPedido.metodoPago}
                        </p>
                      </div>
                    )}

                    {selectedPedido.montoPagado && (
                      <div style={{ 
                        backgroundColor: '#dbeafe', 
                        borderRadius: '10px', 
                        padding: '0.875rem',
                        borderLeft: '3px solid #3b82f6'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#1e40af', fontWeight: '600' }}>
                            Cliente paga con:
                          </span>
                          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#1e40af' }}>
                            ${selectedPedido.montoPagado?.toFixed ? selectedPedido.montoPagado.toFixed(2) : selectedPedido.montoPagado}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#1e40af', fontWeight: '600' }}>
                            Cambio a devolver:
                          </span>
                          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#f59e0b' }}>
                            ${selectedPedido.cambio?.toFixed ? selectedPedido.cambio.toFixed(2) : selectedPedido.cambio || '0.00'}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedPedido.direccion && (
                      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '0.875rem', border: '1px solid #dbeafe' }}>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Dirección del cliente</p>
                        <p style={{ fontWeight: '600', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'start', gap: '0.5rem', fontSize: '0.875rem', lineHeight: 1.4 }}>
                          <MapPin size={14} style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }} />
                          <span>{selectedPedido.direccion}</span>
                        </p>
                      </div>
                    )}

                    {selectedPedido.edificio && (
                      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '0.875rem', border: '1px solid #dbeafe' }}>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Edificio de Entrega</p>
                        <p style={{ fontWeight: '600', color: '#8b5cf6', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
                          <Building size={16} />
                          {selectedPedido.edificio}
                        </p>
                      </div>
                    )}

                    {selectedPedido.telefono && (
                      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '0.875rem', border: '1px solid #dbeafe' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, marginBottom: '0.25rem' }}>Teléfono</p>
                            <p style={{ fontWeight: '600', color: '#1f2937', margin: 0, fontSize: '0.9375rem' }}>{selectedPedido.telefono}</p>
                          </div>
                          <button
                            onClick={() => abrirWhatsApp(selectedPedido.telefono, selectedPedido.nombreCliente)}
                            style={{
                              backgroundColor: '#10b981',
                              padding: '0.625rem',
                              borderRadius: '10px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                              minWidth: '40px',
                              minHeight: '40px',
                              WebkitTapHighlightColor: 'transparent'
                            }}
                          >
                            <Phone size={16} style={{ color: 'white' }} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {(selectedPedido.comentarioe || selectedPedido.comentariop) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedPedido.comentarioe && (
                          <div style={{ 
                            backgroundColor: '#fef3c7', 
                            borderLeft: '3px solid #f59e0b',
                            borderRadius: '8px', 
                            padding: '0.75rem'
                          }}>
                            <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#92400e', margin: 0, marginBottom: '0.25rem' }}>
                              📝 Comentario de Entrega:
                            </p>
                            <p style={{ fontSize: '0.8125rem', color: '#78350f', margin: 0, lineHeight: 1.4 }}>
                              {selectedPedido.comentarioe}
                            </p>
                          </div>
                        )}
                        {selectedPedido.comentariop && (
                          <div style={{ 
                            backgroundColor: '#dbeafe', 
                            borderLeft: '3px solid #3b82f6',
                            borderRadius: '8px', 
                            padding: '0.75rem'
                          }}>
                            <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#1e40af', margin: 0, marginBottom: '0.25rem' }}>
                              🍽️ Comentario del Pedido:
                            </p>
                            <p style={{ fontSize: '0.8125rem', color: '#1e3a8a', margin: 0, lineHeight: 1.4 }}>
                              {selectedPedido.comentariop}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

{/* Productos - FILTRAR PRODUCTOS CON PRECIO 0 */}
{selectedPedido.productos && Array.isArray(selectedPedido.productos) && selectedPedido.productos.length > 0 && (
  (() => {
    // ✅ Filtrar productos con precio mayor a 0
    const productosFiltrados = selectedPedido.productos.filter(prod => {
      const precio = parseFloat(prod.precio) || 0;
      return precio > 0;
    });

    // Solo mostrar la sección si hay productos válidos
    if (productosFiltrados.length === 0) return null;

    return (
      <div style={{ padding: '1rem', background: '#faf5ff' }}>
        <h3 style={{ 
          fontWeight: '700',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          fontSize: '1rem'
        }}>
          <ShoppingBasket size={18} style={{ color: '#8b5cf6' }} />
          Productos ({productosFiltrados.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {productosFiltrados.map((prod, idx) => (
            <div key={idx} style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '0.875rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e9d5ff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.375rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9375rem', margin: 0, marginBottom: '0.125rem' }}>
                    {prod.titulo}
                  </p>
                  {prod.preparado && (
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                      Preparación: {prod.preparado}
                    </p>
                  )}
                </div>
                <span style={{
                  backgroundColor: '#f3e8ff',
                  color: '#7c3aed',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginLeft: '0.5rem',
                  flexShrink: 0
                }}>
                  x{prod.cantidad}
                </span>
              </div>
              <p style={{ fontWeight: '700', color: '#8b5cf6', textAlign: 'right', margin: 0, fontSize: '1rem' }}>
                ${prod.precio?.toFixed ? prod.precio.toFixed(2) : prod.precio || '0.00'}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  })()
)}

                {/* Vendedor */}
                {selectedPedido.vendedorData && typeof selectedPedido.vendedorData === 'object' && (
                  <div style={{ padding: '1rem', background: '#f1f5f9' }}>
                    <h3 style={{ 
                      fontWeight: '700',
                      color: '#1f2937',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      fontSize: '1rem'
                    }}>
                      <Store size={18} style={{ color: '#475569' }} />
                      Recoger en
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {selectedPedido.vendedorData.nombre && (
                        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '0.875rem', border: '1px solid #e2e8f0' }}>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Vendedor</p>
                          <p style={{ fontWeight: '600', color: '#8b5cf6', fontSize: '0.9375rem', margin: 0 }}>
                            {selectedPedido.vendedorData.nombre}
                          </p>
                        </div>
                      )}
                      {selectedPedido.vendedorData.direccion && (
                        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '0.875rem', border: '1px solid #e2e8f0' }}>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Dirección</p>
                          <p style={{ fontWeight: '600', color: '#1f2937', margin: 0, fontSize: '0.875rem', lineHeight: 1.4 }}>
                            {selectedPedido.vendedorData.direccion}
                          </p>
                        </div>
                      )}
                      {selectedPedido.vendedorData.Vendedortelefono && (
                        <button
                          onClick={() => abrirWhatsApp(selectedPedido.vendedorData.Vendedortelefono, selectedPedido.vendedorData.nombre)}
                          style={{
                            ...styles.button,
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                            width: '100%',
                            padding: '0.875rem'
                          }}
                        >
                          <Phone size={16} />
                          Contactar Vendedor
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Mapa */}
                {selectedPedido.ubicacion && selectedPedido.ubicacion.lat && selectedPedido.ubicacion.lng && (
                  <div style={{ padding: '1rem', background: 'white' }}>
                    <h3 style={{ 
                      fontWeight: '700',
                      color: '#1f2937',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '1rem'
                    }}>
                      <MapPin size={18} style={{ color: '#ef4444' }} />
                      Mapa de Ubicación
                    </h3>
                    <div style={{ 
                      borderRadius: '12px', 
                      overflow: 'hidden', 
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb',
                      marginBottom: '0.75rem'
                    }}>
                      <iframe
                        width="100%"
                        height="250"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps?q=${selectedPedido.ubicacion.lat},${selectedPedido.ubicacion.lng}&z=17&output=embed`}
                        allowFullScreen
                      ></iframe>
                    </div>
                    <button
                      onClick={() => abrirGoogleMaps(selectedPedido.ubicacion)}
                      style={{
                        ...styles.button,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                        width: '100%',
                        padding: '0.875rem'
                      }}
                    >
                      <Navigation size={16} />
                      Abrir en Google Maps
                    </button>
                  </div>
                )}
              </div>

              {/* Botones de Acción en el Footer */}
              <div style={{ 
                padding: '1rem',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)',
                borderTop: '1px solid #e5e7eb',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.625rem'
              }}>
                <button
                  onClick={() => handleUpdateEstado(selectedPedido.id, 'En Camino')}
                  style={{
                    ...styles.button,
                    flexDirection: 'column',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '0.75rem',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    minHeight: '70px'
                  }}
                >
                  <Navigation size={20} />
                  <span style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>En Camino</span>
                </button>

                <button
                  onClick={() => handleUpdateEstado(selectedPedido.id, 'Afuera')}
                  style={{
                    ...styles.button,
                    flexDirection: 'column',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '0.75rem',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    minHeight: '70px'
                  }}
                >
                  <MapPin size={20} />
                  <span style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Afuera</span>
                </button>

                <button
                  onClick={() => handleUpdateEstado(selectedPedido.id, 'Error')}
                  style={{
                    ...styles.button,
                    flexDirection: 'column',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    padding: '0.75rem',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                    minHeight: '70px'
                  }}
                >
                  <AlertCircle size={20} />
                  <span style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Problema</span>
                </button>

                <button
                  onClick={() => handleUpdateEstado(selectedPedido.id, 'Listo')}
                  style={{
                    ...styles.button,
                    flexDirection: 'column',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '0.75rem',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    minHeight: '70px'
                  }}
                >
                  <CheckCircle size={20} />
                  <span style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Completado</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DeliveryMapSystem;