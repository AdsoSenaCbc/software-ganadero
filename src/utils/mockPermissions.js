/**
 * Mock de permisos para testing y debugging
 * Simula los permisos que debería devolver el backend
 */

export const mockApprenticePermissions = {
  user_role: "Aprendiz",
  user_email: "angelgoyeneche197@gmail.com",
  is_apprentice: true,
  
  // Permisos generales
  can_create: true,
  can_update: true,
  can_delete: false,
  
  // Permisos específicos por módulo - Animales
  can_create_animals: true,
  can_update_animals: true,
  can_delete_animals: false,
  
  // Permisos específicos por módulo - Haciendas
  can_create_haciendas: true,
  can_update_haciendas: true,
  can_delete_haciendas: false,
  
  // Permisos específicos por módulo - Raciones
  can_create_raciones: false,
  can_update_raciones: false,
  can_delete_raciones: false,
  can_calculate_raciones: false,
  
  restrictions: {
    can_create: true,
    can_update: true,
    can_delete: false,
    can_read: true,
    allowed_methods: ["GET", "POST", "PUT", "PATCH"],
    message: "Permisos dinámicos configurados por administrador"
  }
};

export const mockAdminPermissions = {
  user_role: "Administrador",
  user_email: "admin@sistemaganadero.com",
  is_apprentice: false,
  
  restrictions: {
    can_create: true,
    can_update: true,
    can_delete: true,
    can_read: true,
    allowed_methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    message: "Usuario con permisos completos"
  }
};

/**
 * Función para obtener permisos mock basados en el usuario
 */
export const getMockPermissions = (userEmail) => {
  if (userEmail === "angelgoyeneche197@gmail.com") {
    return mockApprenticePermissions;
  } else if (userEmail === "admin@sistemaganadero.com") {
    return mockAdminPermissions;
  }
  
  // Por defecto, permisos de aprendiz básico
  return {
    ...mockApprenticePermissions,
    can_create_animals: false,
    can_update_animals: false,
    can_create_haciendas: false,
    can_update_haciendas: false,
    restrictions: {
      ...mockApprenticePermissions.restrictions,
      can_create: false,
      can_update: false,
      allowed_methods: ["GET"]
    }
  };
};
