// Script para probar la funcionalidad de actualización
// Ejecutar en la consola del navegador

async function testUpdatePersonal() {
  console.log('🧪 === TEST DE ACTUALIZACIÓN DE PERSONAL ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No hay token para realizar pruebas');
    return;
  }
  
  // 1. Primero obtener la lista de personal
  console.log('1. Obteniendo lista de personal...');
  
  try {
    const response = await fetch('http://localhost:3000/personal', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const personalList = await response.json();
      console.log('✅ Personal obtenido:', personalList.length, 'registros');
      
      if (personalList.length > 0) {
        const primeraPersona = personalList[0];
        console.log('📋 Primera persona para prueba:', primeraPersona);
        
        // 2. Intentar actualizar esa persona
        console.log('2. Probando actualización...');
        
        const datosActualizados = {
          ...primeraPersona,
          observaciones: 'Actualizado desde test - ' + new Date().toISOString()
        };
        
        const updateResponse = await fetch(`http://localhost:3000/personal/${primeraPersona.personalId || primeraPersona.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosActualizados)
        });
        
        console.log('🔄 Respuesta actualización:', updateResponse.status, updateResponse.statusText);
        
        if (updateResponse.ok) {
          const resultado = await updateResponse.json();
          console.log('✅ Actualización exitosa:', resultado);
        } else {
          const error = await updateResponse.text();
          console.error('❌ Error en actualización:', error);
        }
        
      } else {
        console.log('⚠️ No hay personal registrado para probar actualización');
      }
      
    } else {
      console.error('❌ Error obteniendo personal:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
  
  console.log('==============================================');
}

// Función auxiliar para verificar estructura del endpoint
async function checkPersonalEndpoint() {
  console.log('🔍 === VERIFICANDO ENDPOINT DE PERSONAL ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No hay token');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:3000/personal', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint funcionando');
      console.log('📊 Total registros:', data.length);
      
      if (data.length > 0) {
        console.log('📋 Estructura del primer registro:');
        console.log('  - ID:', data[0].personalId || data[0].id || 'NO ENCONTRADO');
        console.log('  - Nombre:', data[0].firstName, data[0].secondName);
        console.log('  - Apellido:', data[0].firstLastName, data[0].secondLastName);
        console.log('  - Cédula:', data[0].idNumber);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('===============================================');
}

// Ejecutar ambas funciones
checkPersonalEndpoint();
setTimeout(() => testUpdatePersonal(), 2000); 