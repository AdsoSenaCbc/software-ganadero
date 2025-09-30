# Documentación - Módulo de Raciones Lactancia

## Descripción General

El módulo de **Gestión de Raciones – Lactancia** es un sistema completo para el cálculo y balance nutricional de raciones para bovinos en etapa de lactancia, basado en los estándares del National Research Council (NRC).

## Características Principales

### 🎯 Funcionalidades Implementadas

1. **Formulario de Datos del Animal**
   - Peso del animal (kg)
   - Producción de leche (L/día)
   - Porcentaje de grasa en leche
   - Edad en meses
   - Condición corporal (1-5)
   - Estado fisiológico (lactancia temprana/media/tardía)

2. **Gestión de Ingredientes**
   - Selección por tipo: Forraje, Concentrado, Mineral
   - Tabla de ingredientes seleccionados
   - Información nutricional por ingrediente
   - Cálculo automático de totales

3. **Controles de Balanceo**
   - Balanceo automático activable
   - Uso de estándares NRC
   - Proporción Forraje/Concentrado configurable

4. **Tablas de Resultados**
   - **Requerimientos de la Vaca**: Mantenimiento, producción y totales
   - **Aporte Ración**: Desglose nutricional por ingrediente
   - **Balance Ración**: Comparación y cumplimiento nutricional

5. **Sistema de Recomendaciones**
   - Sugerencias automáticas de ajuste
   - Análisis de deficiencias y excesos
   - Recomendaciones específicas por nutriente

6. **Exportación a PDF**
   - Reporte completo con todos los cálculos
   - Formato profesional para impresión
   - Información del animal y fecha

## Arquitectura Técnica

### 📁 Archivos del Módulo

```
src/pages/Alimentacion/
├── RacionesLactancia.jsx     # Componente principal
└── RacionesLactancia.css     # Estilos específicos
```

### 🔧 Dependencias

- **React**: Componente funcional con hooks
- **React Router**: Navegación entre páginas
- **AOS**: Animaciones al hacer scroll
- **React Icons**: Iconografía (GiCow, GiMeal, MdBolt)

### 🎨 Estilos y Diseño

- **Colores corporativos**: Verde (#2d5016, #4a7c59) y dorado (#d4af37)
- **Diseño responsive**: Adaptable a móviles y tablets
- **Variables CSS**: Configuración centralizada de colores y sombras
- **Animaciones**: Transiciones suaves y efectos hover

## Integración con APIs

### 🌐 Endpoints Utilizados

1. **Cálculo de Requerimientos**
   - Primario: `/api/nrc-balancer/calculate_requirements`
   - Fallback: `/api/raciones/api/calcular-requerimientos`
   - Fallback local: Cálculo usando fórmulas NRC básicas

2. **Balance de Ración**
   - Primario: `/api/nrc-balancer/balance_ration`
   - Fallback: `/api/raciones/api/calcular`

3. **Ingredientes**
   - `/api/ingredientes/api`: Carga de ingredientes disponibles

### 📊 Fórmulas NRC Implementadas

```javascript
// Requerimientos de mantenimiento
mantenimiento.ms = peso * 0.026;  // 2.6% del peso vivo
mantenimiento.pb = peso * 0.96;   // gramos de proteína
mantenimiento.em = peso * 0.077;  // Mcal EM
mantenimiento.ca = peso * 0.043;  // gramos de calcio
mantenimiento.p = peso * 0.028;   // gramos de fósforo

// Requerimientos por kg de leche
por_kg_leche.ms = 0.372;  // kg MS por kg leche
por_kg_leche.pb = 78;     // gramos PB por kg leche
por_kg_leche.em = 0.64;   // Mcal EM por kg leche
por_kg_leche.ca = 2.7;    // gramos Ca por kg leche
por_kg_leche.p = 1.8;     // gramos P por kg leche
```

## Sistema de Permisos

### 🔐 Integración con Control de Acceso

El módulo está integrado con el sistema de permisos dinámicos:

- **PermissionGuard**: Controla la visibilidad del botón "Balancear Ración"
- **Módulo**: `raciones`
- **Acción**: `create`
- **Fallback**: Mensaje informativo para usuarios aprendices

### 👥 Roles y Restricciones

- **Aprendices**: Solo pueden ver cálculos, no crear nuevas raciones
- **Instructores/Administradores**: Acceso completo a todas las funciones

## Uso del Módulo

### 📝 Flujo de Trabajo

1. **Ingreso de Datos del Animal**
   - Completar peso y producción de leche (obligatorios)
   - Configurar parámetros adicionales

2. **Selección de Ingredientes**
   - Elegir tipo de ingrediente
   - Seleccionar ingrediente específico
   - Ingresar cantidad en kg
   - Agregar a la tabla

3. **Configuración de Balanceo**
   - Activar/desactivar balanceo automático
   - Seleccionar uso de estándares NRC
   - Configurar proporción F/C

4. **Cálculo y Análisis**
   - Hacer clic en "Balancear Ración"
   - Revisar las tres tablas de resultados
   - Analizar recomendaciones

5. **Exportación**
   - Generar PDF con todos los resultados
   - Imprimir o guardar el reporte

### ⚠️ Validaciones

- **Peso del animal**: Requerido, entre 200-1000 kg
- **Producción de leche**: Requerida, entre 0-60 L/día
- **Ingredientes**: Al menos uno debe estar seleccionado
- **Cantidades**: Deben ser valores positivos

## Mantenimiento y Desarrollo

### 🔄 Actualizaciones Futuras

1. **Backend NRC Completo**
   - Implementar rutas `/api/nrc-balancer/*`
   - Migrar utilidades de cálculo desde RACIONES6
   - Integrar método del tanteo completo

2. **Funcionalidades Adicionales**
   - Guardado de raciones calculadas
   - Historial de cálculos
   - Comparación entre raciones
   - Optimización automática de costos

3. **Mejoras de UX**
   - Autocompletado de ingredientes
   - Sugerencias inteligentes
   - Gráficos de balance nutricional
   - Modo oscuro

### 🐛 Troubleshooting

**Problema**: Error al calcular requerimientos
- **Solución**: Verificar que peso y producción estén ingresados
- **Fallback**: El sistema usa cálculo local con fórmulas NRC básicas

**Problema**: Ingredientes no cargan
- **Solución**: Verificar conexión con `/api/ingredientes/api`
- **Verificar**: Autenticación y permisos del usuario

**Problema**: Botón "Balancear Ración" no visible
- **Solución**: Verificar permisos del usuario en módulo "raciones"
- **Contactar**: Administrador para habilitar permisos

## Compatibilidad

- **Navegadores**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Dispositivos**: Desktop, tablet, móvil
- **Resoluciones**: Desde 320px hasta 1400px

## Contacto y Soporte

Para soporte técnico o reportar bugs, contactar al equipo de desarrollo del Sistema Ganadero.

---

*Documentación generada para el Sistema Ganadero v1.0*
*Última actualización: Septiembre 2024*
