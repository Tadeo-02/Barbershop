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
    - [ ] Sección Productos
    - [ ] Fix de Toasts de error cuando hay success (ej: create barberos desde admin)
    - [X] Fix boton de login en Landing Page
# BACK:
## - Usuarios:
    - [X] Pedir turnos
    - [X] Ver perfil
    - [X] Ver beneficios de categoría (en ver perfil) 
    - [X] Cancelar Turnos
    - [X] Encriptar Contraseña
    - [ ] API Facturación
    - [X] Verificar logica de envio de fecha de cancelacion de turno
    - [ ] Evitar que se puedan mandar múltiples peticiones para un mismo formulario (Ejemplo: al logearse, si presionas Enter varias veces, el sistema recibe varias veces la misma petición de logeo)
## Barberos:
    - [X] Modificar Turnos
    - [X] Validar que el turno que completa sea de ese mismo día
## Admin:
    - [X] CRUD Sucursal
    - [X] CRUD Barberos
    - [X] CRUD Categorias
    - [ ] Dar de baja barbero en vez de eliminar
## General:
    - [ ] Revisar validaciones zod en general
    - [ ] Validar datos en front y back
    - [X] Aplicar validación del tipo de usuario (Cliente, Barbero, Admin)
    - [ ] Sección Productos
    - [X] Cambiar NPM por PNPM
    - [X] Cambiar logica del estado de turnos
    - [X] Lógica de subida de categoría (AD)
    - [X] Lógica de bajada de categoría (AD)
    - [X] Agregar validaciones para checkear cuando un cliente esta vetado, asi no puede iniciar sesión
    - [ ] Manejo horarios ocupados del barbero
    - [ ] Validar que el cliente no pueda pedir dos turnos para el mismo horario con distintos barberos ?