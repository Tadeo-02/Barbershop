### QUITAR 'ANY's

# FRONT:

## Usuarios:

    - [X] Actualizar pantalla main turnos ## -> Pantallas necesarias para pedir turnos: seleccionar barbero, seleccionar fecha, seleccionar sucursal
    - [X] Modificar frontend de seleccion de sucursales y turnos. Una vez seleccionas una opción ya no te deja volver hacia atras para ver las otras opciones
    - [X] Pantalla de perfil de usuario
    - [X] Pantalla de cancelar turnos // la pantalla ya está habria que cambiar el DELETE por un UPDATE de estado que depende del cambio q se haga en la lógica de los estados
    - [X] Mostrar sucursal seleccionada en pantalla de seleccion barbero y mostrar barbero seleccionado en pantalla de sucursal seleccionada

## Barberos:

    - [X] Pantalla de modificar turno
    - [X] Pantalla de ver turnos pendientes
    - [X] Buscador de turnos medianto nombre y/o apellido del cliente o barbero en branchAppointments

## Admin:

    - [X] Pantalla general admin
    - [X] Pantalla CRUD sucursales
    - [NO] Pantalla CRUD estados?? Decidir si la hacemos
    - [X] Listado de clientes (proposal.md) // faltaria la fecha de registro que creo q nuestra  bd no la tiene, si no me equivoco eso lo vamos a necesitar para la lógica de las categorías
    - [X] Listado de rentabilidad (proposal.md)

## General:

    - [X] Definir estructura mobile first en estilos
    - [X] Fix de Toasts de error cuando hay success (ej: create barberos desde admin)
    - [X] Fix boton de login en Landing Page
    - [X] Validar datos en front -> Implementar actualizacion aplicada en login/createUser para mejoras frontend al resto de formularios
    - [X] Para muestreo de datos ver cambios aplicados en la infoSection (analizar si es necesario, es mas que nada para robustez)
    - [X] Arreglar pdf de factura

# BACK:

## - Usuarios:

    - [X] Pedir turnos
    - [X] Ver perfil
    - [X] Ver beneficios de categoría (en ver perfil)
    - [X] Cancelar Turnos
    - [X] Encriptar Contraseña
    - [X] API Facturación
    Hagan que sea vea bien la API
    - [X] Verificar logica de envio de fecha de cancelacion de turno
    - [X] Evitar que se puedan mandar múltiples peticiones para un mismo formulario (Ejemplo: al logearse, si presionas Enter varias veces, el sistema recibe varias veces la misma petición de logeo)

## Barberos:

    - [X] Modificar Turnos
    - [X] Validar que el turno que completa sea de ese mismo día

## Admin:

    - [X] CRUD Sucursal
    - [X] CRUD Barberos
    - [X] CRUD Categorias
    - [X] Dar de baja barbero en vez de eliminar
    - [X] No permitir cambiar de sucursal al barbero cuando tiene un turno todavia vigente
    - [X] No permitir eliminar barbero o sucursal si hay turnos vigentes
    - [X] Si se elimina una categoria, que sucede con los clientes de la misma? suben o bajan de categoria --> decision del admin, la unica que no se puede eliminar es la inicial
    - [X] Cuando se crea categoria, qué se hace con los descuentos (se aplican cuando se cobran los turnos?)

## General:

    - [ ] Revisar validaciones zod en general
    - [X] Añadir/Mejorar validaciones Backend
    - [X] Aplicar validación del tipo de usuario (Cliente, Barbero, Admin)
    - [X] Cambiar NPM por PNPM
    - [X] Cambiar logica del estado de turnos
    - [X] Lógica de subida de categoría (AD)
    - [X] Lógica de bajada de categoría (AD)
    - [X] Agregar validaciones para checkear cuando un cliente esta vetado, asi no puede iniciar sesión
    - [X] Manejo horarios ocupados del barbero
    - [X] Validar que el cliente no pueda pedir dos turnos para el mismo horario con distintos barberos ?
    - [X] Reestablecer contraseña y unificacion de patrones. Se permite mantener las contraseñas viejas a excepcion de cp3 (revisar readme para ver nueva contraseña).
    - [X] Implementar los descuentos de las categorias

# TODO — Correcciones de Code Review (Barbershop)

## 1. Consistencia de idioma

- [ ] Unificar el idioma del código y comentarios (elegir uno, recomendado: inglés) en todo el proyecto.
  - Ejemplo detectado: `codUsuario: usuario.codUsuario` (nombres de variables en castellano).
  - LISTO: Revisar comentarios mezclados en inglés/castellano en todo el repo.

## 2. Código muerto / comentado

- [ ] Eliminar código comentado que ya no se usa (confunde a quien lee el código).
  - `src/BACK/main.controller.ts`:
    ```
    //const index = (req: Request, res: Response) => {
    //  res.render("index");
    //};
    ```
  - Revisar el resto del proyecto en busca de bloques similares y eliminarlos.

## 3. Seguridad — Backend

- [x] Implementar **validación de usuario y roles** en el backend (actualmente no hay).
- [x] Implementar **JWT** para autenticación y validación de las APIs.
- [x] Usar JWT (o similar) para validar roles en cada endpoint, no solo en el front.
- [ ] Revisar el manejo de tokens de autenticación (actualmente solo hay security events, no manejo de tokens).
- [ ] **Pregunta de seguridad**: no debe tratarse como un segundo password sin verificación adicional.
  - [ ] Implementar envío de email con token para validar que el usuario controla ese email antes de aceptar la respuesta a la pregunta de seguridad.
  - [ ] Documentar/comunicar al usuario que la pregunta de seguridad no reemplaza un password fuerte, para evitar que la subestime.

## 4. Duplicación de código — Frontend

- [ ] Simplificar/crear funciones reutilizables para evitar código duplicado.
  - Ejemplo: `src/FRONT/views/components/Admin/categories/createCategories.tsx`
    ```ts
    const result = await baseResolver(values, context, options);
    if (result.errors) {
      const errors = result.errors;
      for (const key of Object.keys(errors)) {
        const err = errors[key as keyof typeof errors];
        if (!err || typeof err !== "object" || !("message" in err)) continue;
        const normalized = normalizeMessage(
          (err as { message?: unknown }).message,
        );
        if (normalized) {
          (err as { message?: unknown }).message = normalized;
        }
      }
    }
    return result;
    ```
    → Extraer esta lógica de normalización de errores a una función/utilidad compartida.
- [ ] Revisar y eliminar código defensivo duplicado innecesariamente (simplificar checks repetidos).
- [ ] Usar `async/await` de forma consistente para simplificar el manejo de promesas.

## 5. Rutas y entornos

- [ ] Quitar rutas de prueba de `src/FRONT/views/App.tsx` (o protegerlas para que no estén disponibles en producción).

## 6. Login / manejo de respuestas HTTP

- [ ] `src/FRONT/views/components/login/login.tsx`: revisar por qué se usa
  ```ts
  const text = await response.text();
  ```
  en vez de
  ```ts
  const text = await response.json();
  ```
  y corregir según corresponda.

## 7. Logging

- [ ] Eliminar el uso excesivo de `console.log` en el front.
- [ ] Crear un **logger** centralizado que permita:
  - Definir niveles de logging (debug, info, warn, error).
  - Bajar el nivel de logging en producción.
  - Redireccionar logs a un servidor de logs sin exponerlos al usuario final.

## 8. Almacenamiento de datos sensibles (localStorage)

- [ ] Evitar guardar todos los datos personales del usuario en `localStorage`.
- [ ] Verificar y **eliminar el guardado del password en `localStorage`**, aunque esté encriptado (no es una práctica segura).
  - Detectado en: `src/FRONT/views/pages/Barber/HomePageBarber.tsx`
    ```ts
    const savedUser = localStorage.getItem("user");
    ```

## 9. Rutas protegidas duplicadas

- [ ] Revisar si el `useEffect` que valida el usuario en `HomePageBarber.tsx` duplica la lógica de `ProtectedRoute.tsx`.
  - [ ] Unificar usando el componente `src/FRONT/views/components/ProtectedRoute.tsx` en lugar de reimplementar la validación en cada página.

## 10. Lógica de negocio en el front

- [ ] Mover lógica de negocio (cálculos de fechas, etc.) del front al backend/API.
  - Detectado en: `src/FRONT/views/components/Client/clientAppointments.tsx`

## 11. Organización de carpetas (páginas vs. componentes)

- [ ] Separar páginas de componentes reutilizables: actualmente hay archivos en `components` que en realidad son páginas.
  - Ejemplo: `src/FRONT/views/components/Client/clientAppointments.tsx` debería vivir en `pages`, no en `components`.
- [ ] Revisar toda la carpeta `components` y mover las páginas a `pages`, dejando en `components` solo piezas reutilizables.

## 12. Duplicación de tipos/interfaces

- [ ] Revisar todas las definiciones de interfaces del proyecto (ej. `Appointment`) y unificar en un solo lugar (ej. `src/FRONT/types/` o similar).
  - Detectado en: `src/FRONT/views/components/Client/scheduleByBranch.tsx` y otros archivos de Client/Barber.
- [ ] Auditar el resto de las entidades (Usuario, Categoría, Turno, etc.) por posibles duplicados de tipos.

## 13. Duplicación de funciones utilitarias

- [ ] Centralizar funciones repetidas como `formatDate` (y otras similares) en un único módulo de utilidades (`utils/`).

## 14. CSS

- [ ] Crear variables CSS (o tokens de diseño) para:
  - Colores
  - Espaciados
  - Tamaños
    que se repiten en toda la app, en lugar de hardcodearlos en cada componente.

## 15. Hook reutilizable para AbortController

- [x] Crear un hook custom (ej. `useAbortableEffect` / `useAbortController`) para reutilizar la lógica de cancelación de requests al salir de la página.
  - Patrón repetido detectado en varios lugares, ej. `src/FRONT/views/components/Barber/appointments/barberAvailability.tsx`:
    ```ts
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    ```
