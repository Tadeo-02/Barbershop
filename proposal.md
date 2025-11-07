# Propuesta TP DSW

## Grupo
### Integrantes
·        Morici, Matías – 52171 <br>
·        Rufine, Tadeo – 52064 <br>
·        Dominguez, Dolores – 52072<br>
### Repositorio
* [frontend y backend](http://hyperlinkToGihubOrGitlab)

## Tema
### Descripción
Sistema de gestión de turnos de una barbería que cuenta con varias sucursales y barberos. El sistema deberá registrar a los clientes quienes podrán solicitar turnos con los diferentes barberos. Por otro lado, el barbero será capaz de gestionar los turnos solicitados. Los clientes tendrán diferentes categorías que les permitirán acceder a descuentos, y para eso se llevará un historial de todos los turnos solicitados por cada cliente. El sistema ofrecerá la opción de realizar la facturación del corte una vez atendido al cliente.

### Modelo
![image](https://github.com/user-attachments/assets/a12d6f49-9e6f-48b2-93dd-02db4d63cd49)


## Alcance Funcional 

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Sucursal<br>2. CRUD Tipo Corte<br>3. CRUD Categoría<br>4. CRUD Barbero|
|CRUD dependiente|1. CRUD Turno {depende de} CRUD Tipo Corte<br>2. CRUD Cliente {depende de} CRUD Categoría|
|Listado<br>+<br>detalle| 1. Listado de clientes filtrado por categoría, muestra cantidad de cortes, DNI y nombre => detalle CRUD Cliente.<br>2. Listado de rentabilidad de cada sucursal => detalle CRUD Sucursal.|
|CUU/Epic|1. Reservar Turno<br>2. Modificar Turno|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Cliente<br>2. CRUD Sucursal<br>3. CRUD Tipo Corte<br>4. CRUD Categoría<br>5. CRUD Barbero|
|CUU/Epic|1. Reservar Turno<br>2. Modificar Turno<br>3. Cancelación de turno<br>4. Facturación|


### Alcance Adicional Voluntario

|Req|Detalle|
|:-|:-|
|Listados |1. Listado de historial de cortes para clientes<br>2. Listado de historial de cortes para barberos|
|CUU/Epic|-|
|Otros|-|

