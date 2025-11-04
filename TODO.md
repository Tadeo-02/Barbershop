# FRONT:
## Usuarios:
    - [X] Actualizar pantalla main turnos ## -> Pantallas necesarias para pedir turnos: seleccionar barbero, seleccionar fecha, seleccionar sucursal
    - [X] Modificar frontend de seleccion de sucursales y turnos. Una vez seleccionas una opción ya no te deja volver hacia atras para ver las otras opciones
    - [X] Pantalla de perfil de usuario
    - [ ] Pantalla de cancelar turnos // la pantalla ya está habria que cambiar el DELETE por un UPDATE de estado que será diferente dependiendo de si mantenemos a los estados como clase o si son solo un atributo del turno.
    - [ ] Mostrar sucursal seleccionada en pantalla de seleccion barbero y mostrar barbero seleccionado en pantalla de sucursal seleccionada
## Barberos:
    - [ ] Pantalla de modificar turno
    - [ ] Pantalla de ver turnos pendientes
## Admin:
    - [X] Pantalla general admin
    - [X] Pantalla CRUD sucursales
    - [NO] Pantalla CRUD estados?? Decidir si la hacemos
    - [X] Listado de clientes (proposal.md) // faltaria la fecha de registro que creo q nuestra  bd no la tiene, si no me equivoco eso lo vamos a necesitar para la lógica de las categorías
    - [X] Listado de rentabilidad (proposal.md)
## General:
    - [X] Definir estructura mobile first en estilos
    - [ ] Sección Productos
    - [ ] Fix de Toasts de error cuando hay succes (ej: create barberos desde admin)
    - [ ] Fix boton de login en Landing Page
# BACK:
## - Usuarios:
    - [X] Pedir turnos
    - [X] Ver perfil
    - [X] Ver beneficios de categoría (en ver perfil) 
    - [X] Cancelar Turnos
    - [X] Encriptar Contraseña
    - [ ] API Facturación
## Barberos:
    - [ ] Modificar Turnos
## Admin:
    - [X] CRUD Sucursal
    - [X] CRUD Barberos
    - [X] CRUD Categorias
    - [X] CRUD Estados turno - Modificar funcionalidades de Appointments para que utilizan esta CRUD 
## General:
    - [ ] Revisar validaciones zod en general
    - [X] Aplicar validación del tipo de usuario (Cliente, Barbero, Admin)
    - [ ] Sección Productos
    - [X] Cambiar NPM por PNPM
    - [ ] Cambiar logica del estado de turnos
    - [ ] Lógica de cambio de categoría (AD)
