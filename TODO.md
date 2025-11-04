# FRONT:
## Usuarios:
    - [ ] Actualizar pantalla main turnos ## -> Pantallas necesarias para pedir turnos: seleccionar barbero, seleccionar fecha, seleccionar sucursal (?)
    - [ ] Modificar frontend de seleccion de sucursales y turnos. Una vez seleccionas una opción ya no te deja volver hacia atras para ver las otras opciones
    - [X] Pantalla de perfil de usuario
    - [X?] Pantalla de cancelar turnos
## Barberos:
    - [ ] Pantalla de modificar turno
    - [ ] Pantalla de ver turnos
## Admin:
    - [X] Pantalla general admin
    - [X] Pantalla CRUD sucursales
    - [ ] Pantalla CRUD estados?? Decidir si la hacemos // no se hace
    - [casi] Listado de clientes (proposal.md) // faltaria la cantidad de cortes de cada cliente y la fecha de registro que creo q nuestra  bd no la tiene
    - [ ] Listado de rentabilidad (proposal.md)
## General:
    - [X] Definir estructura mobile first en estilos
    - [ ] Sección Productos
    - [ ] Fix de Toasts de error cuando hay succes (ej: create barberos desde admin)
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
    - [ ] CRUD Estados turno - Modificar funcionalidades de Appointments para que utilizan esta CRUD // la crud de estados tampoco se hace
## General:
    - [ ] Revisar validaciones zod en general
    - [X] Aplicar validación del tipo de usuario (Cliente, Barbero, Admin)
    - [ ] Sección Productos
    - [X] Cambiar NPM por PNPM
