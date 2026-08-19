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
- [x] Revisar el manejo básico de tokens de autenticación: JWT emitido en login, validado por middleware, enviado desde el frontend y limpiado ante expiración/401.
  - Pendiente opcional de hardening: evaluar refresh tokens, revocación server-side, invalidación al desactivar/vetar usuarios y cookies `HttpOnly`.
- [x] **Pregunta de seguridad**: no debe tratarse como un segundo password sin verificación adicional.
  - [x] Implementar envío de email con token para validar que el usuario controla ese email y usar recuperación por token.
  - [x] Documentar/comunicar al usuario que la pregunta de seguridad no reemplaza un password fuerte, para evitar que la subestime.

## 4. Duplicación de código — Frontend

- [x] Simplificar/crear funciones reutilizables para evitar código duplicado.
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
- [x] Revisar y eliminar código defensivo duplicado innecesariamente (simplificar checks repetidos).
- [x] Usar `async/await` de forma consistente para simplificar el manejo de promesas.

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
- [x] Evitar guardar todos los datos personales del usuario en `localStorage`.
  - LISTO: se centralizó el acceso en `src/FRONT/views/lib/authStorage.ts`; `AuthContext` persiste solo el JWT, deriva rol/código desde el payload y rehidrata el perfil desde `/usuarios/profiles/:codUsuario`.
  - Ajuste adicional: el JWT se guarda en `sessionStorage` para reducir la persistencia del token en el navegador y evitar dejar información sensible en `localStorage`.
- [x] Verificar y **eliminar el guardado del password en `localStorage`**, aunque esté encriptado (no es una práctica segura).
  - LISTO: no se encontró persistencia de password/contraseña en `localStorage`; también se eliminó el guardado del objeto `user` y `userType`.
  - Detectado en: `src/FRONT/views/pages/Barber/HomePageBarber.tsx`
    ```ts
    const savedUser = localStorage.getItem("user");
    ```
  - LISTO: `HomePageBarber.tsx` ya no lee `localStorage` directamente; usa `useAuth`/estado de hidratación.
  - Se limpian también claves heredadas como `user` y `userType` desde ambos storages cuando la sesión es inválida o se cierra.

## 9. Rutas protegidas duplicadas
- [ ] Revisar si el `useEffect` que valida el usuario en `HomePageBarber.tsx` duplica la lógica de `ProtectedRoute.tsx`.
  - [ ] Unificar usando el componente `src/FRONT/views/components/ProtectedRoute.tsx` en lugar de reimplementar la validación en cada página.

## 10. Lógica de negocio en el front
- [ ] Mover lógica de negocio (cálculos de fechas, etc.) del front al backend/API.
  - Detectado en: `src/FRONT/views/components/Client/clientAppointments.tsx`

## 11. Organización de carpetas (páginas vs. componentes)
- [x] Separar páginas de componentes reutilizables: actualmente hay archivos en `components` que en realidad son páginas.
  - Ejemplo: `src/FRONT/views/components/Client/clientAppointments.tsx` debería vivir en `pages`, no en `components`.
- [x] Revisar toda la carpeta `components` y mover las páginas a `pages`, dejando en `components` solo piezas reutilizables.

## 12. Duplicación de tipos/interfaces
- [ ] Revisar todas las definiciones de interfaces del proyecto (ej. `Appointment`) y unificar en un solo lugar (ej. `src/FRONT/types/` o similar).
  - Detectado en: `src/FRONT/views/components/Client/scheduleByBranch.tsx` y otros archivos de Client/Barber.
- [ ] Auditar el resto de las entidades (Usuario, Categoría, Turno, etc.) por posibles duplicados de tipos.

## 13. Duplicación de funciones utilitarias
- [ ] Centralizar funciones repetidas como `formatDate` (y otras similares) en un único módulo de utilidades (`utils/`).

## 14. CSS
- [x] Crear variables CSS (o tokens de diseño) para:
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
