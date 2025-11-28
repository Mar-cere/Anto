# Cómo Obtener el Project ID de Expo

Ya estás logueado en Expo. Ahora necesitas obtener el Project ID.

## Opción 1: Desde el Dashboard Web (Más Fácil)

1. Ve a: https://expo.dev/accounts/marcelo0.nicolas@gmail.com/projects
2. Busca el proyecto "anto" o créalo si no existe
3. Haz clic en el proyecto
4. Ve a Settings
5. Copia el **Project ID** (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## Opción 2: Crear Proyecto Nuevo en Expo

Si no tienes un proyecto creado:

1. Ve a: https://expo.dev/accounts/marcelo0.nicolas@gmail.com/projects
2. Haz clic en "Create a project"
3. Nombre: "anto"
4. Slug: "anto"
5. Copia el Project ID que se genera

## Opción 3: Usar EAS CLI (Si está instalado)

```bash
cd frontend
npx eas-cli init
```

Esto creará un `eas.json` con el Project ID.

## Opción 4: Obtener desde Configuración

```bash
cd frontend
npx expo config --type public
```

Busca `projectId` en la salida.

---

## Una vez que tengas el Project ID:

1. Edita `frontend/app.json`
2. Reemplaza `YOUR_PROJECT_ID_HERE` con tu Project ID real
3. Guarda el archivo
4. Reinicia la app

Ejemplo:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      }
    }
  }
}
```

