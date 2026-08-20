# Mecha's Barbershop

Aplicación de Gestión de Turnos y Usuarios de Mecha's Barbershop

Instruccions de uso: <br>
1 - Clonar repositorio (borrar viejo node_modules si da problemas) <br>
2 - Ejecutar en consola: 'pnpm install' <br>
3 - Ejecutar en consola: 'pnpm prisma db pull' -> 'pnpm exec prisma generate'<br>
4 - Iniciar Frontend: 'pnpm dev' -> Abrir Enlace <br>
5 - Iniciar Backend: 'pnpm dev:backend' 

## Antes de hacer push

**Siempre correr `pnpm run build` antes de hacer push.** Vercel ejecuta `tsc -b && vite build` en Linux (case-sensitive), y `pnpm dev` NO chequea tipos. Un error de tipos o de casing en imports puede pasar desapercibido en dev pero romper el deploy.

```bash
pnpm run lint    # verificar errores de lint
pnpm run build   # verificar que tsc y vite build pasan sin errores
```

 <br>




Datos de distintos Tipos de Usuarios:
Client:
cp3@gmail.com
Cp3!123456 
Barber:
king@gmail.com
123456
Admin:
admin@gmail.com
123456
