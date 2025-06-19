// Script para debuggear el error 500 en PUT /personal/:id
// Ejecutar en la consola del navegador

async function debugPutEndpoint() {
  console.log('🔧 === DEBUG PUT ENDPOINT ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No hay token');
    return;
  }
  
  // 1. Primero obtener un personal para editarlo
  console.log('1. Obteniendo personal existente...');
  
  try {
    const getResponse = await fetch('http://localhost:3000/personal', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!getResponse.ok) {
      console.error('❌ Error obteniendo personal:', getResponse.status);
      return;
    }
    
    const personalList = await getResponse.json();
    console.log('✅ Personal obtenido:', personalList.length, 'registros');
    
    if (personalList.length === 0) {
      console.error('❌ No hay personal para actualizar');
      return;
    }
    
    const personal = personalList[0];
    console.log('📋 Personal a actualizar:', personal);
    console.log('🆔 ID del personal:', personal.personalId || personal.id);
    
    // 2. Crear un DTO mínimo para actualización (similar al frontend)
    const updateDto = {
      userId: 1, // Usuario que hace la actualización
      bloodTypeId: personal.bloodTypeEntity?.bloodTypeId || 1,
      firstName: personal.firstName || 'Nombre',
      secondName: personal.secondName || undefined,
      firstLastName: personal.firstLastName || 'Apellido',
      secondLastName: personal.secondLastName || undefined,
      idNumber: personal.idNumber || '123456789',
      birthDate: personal.birthDate ? personal.birthDate.split('T')[0] : '2000-01-01',
      address: personal.address || 'Dirección test',
      phoneNumber: personal.phoneNumber || '3001234567',
      competencias: [1], // Al menos una competencia
      emergencyContact: {
        name: personal.emergencyContact?.name || 'Contacto test',
        relationship: personal.emergencyContact?.relationship || 'familiar',
        mobilePhone: personal.emergencyContact?.mobilePhone || '3001234567'
      },
      employmentData: {
        rangeId: personal.employmentDataEntity?.range?.rangeId || 1,
        stateId: personal.employmentDataEntity?.stateId || 1,
        admissionDate: personal.employmentDataEntity?.admissionDate ? 
          personal.employmentDataEntity.admissionDate.split('T')[0] : '2020-01-01',
        yearsOfExperience: personal.employmentDataEntity?.yearsOfExperience || 1,
        observations: 'Actualizado desde debug - ' + new Date().toISOString()
      }
    };
    
    console.log('📤 DTO a enviar:', updateDto);
    
    // 3. Intentar la actualización con datos estructurados
    const personalId = personal.personalId || personal.id;
    console.log('🔄 Intentando PUT a /personal/' + personalId);
    
    const putResponse = await fetch(`http://localhost:3000/personal/${personalId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateDto)
    });
    
    console.log('📊 Respuesta PUT:', putResponse.status, putResponse.statusText);
    
    if (putResponse.ok) {
      const resultado = await putResponse.json();
      console.log('✅ Actualización exitosa:', resultado);
    } else {
      // Intentar obtener el error detallado
      const errorText = await putResponse.text();
      console.error('❌ Error detallado del backend:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Error JSON parseado:', errorJson);
      } catch (e) {
        console.error('❌ Error no es JSON válido');
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
  
  console.log('===============================');
}

// Función para probar con diferentes estructuras de datos
async function testMinimalUpdate() {
  console.log('🧪 === TEST ACTUALIZACIÓN MÍNIMA ===');
  
  const token = localStorage.getItem('token');
  if (!token) return;
  
  // Datos mínimos que definitivamente deberían funcionar
  const minimalDto = {
    userId: 1,
    bloodTypeId: 1,
    firstName: "Test",
    firstLastName: "Update",
    idNumber: "123456789",
    birthDate: "2000-01-01",
    address: "Test Address",
    phoneNumber: "3001234567",
    competencias: [1],
    emergencyContact: {
      name: "Emergency Contact",
      relationship: "familiar",
      mobilePhone: "3001234567"
    },
    employmentData: {
      rangeId: 1,
      stateId: 1,
      admissionDate: "2020-01-01",
      yearsOfExperience: 1,
      observations: "Test minimal update"
    }
  };
  
  console.log('📤 Enviando datos mínimos:', minimalDto);
  
  try {
    const response = await fetch('http://localhost:3000/personal/1', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalDto)
    });
    
    console.log('📊 Respuesta:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('===============================');
}

// Ejecutar ambas funciones
debugPutEndpoint();
setTimeout(() => testMinimalUpdate(), 3000); 