# Backend

## Imagenes persistentes (Cloudinary)
Para que las imágenes del catálogo NO se pierdan al reiniciar en Render, configura Cloudinary.

### Variables de entorno necesarias
Agrega estas variables en el panel de Render (Environment / Secret Files):

```
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

También puedes usar la variable única `CLOUDINARY_URL` (formato recomendado por Cloudinary), por ejemplo:

```
CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
```

Nota: No guardes estas claves en el repositorio. Añádelas como variables de entorno en el panel de Render (Environment / Secret Files) o en un `.env` local que no se suba a Git.

Si TODAS están presentes, el backend subirá las imágenes nuevas y las de actualización a Cloudinary y guardará `secure_url` en MongoDB.
Si faltan, verás en los logs: `Cloudinary no configurado. Usando almacenamiento local (se perderá al reiniciar).` y las imágenes se almacenarán localmente en `/uploads` (se borran al redeploy / restart en Render).

### Pasos rápidos
1. Crear cuenta gratis en https://cloudinary.com/ si aún no la tienes.
2. Copiar Cloud name, API Key y API Secret desde el dashboard.
3. Agregar las tres variables arriba en Render y redeploy.
4. Subir un nuevo producto con imagen para verificar que la URL empiece con `https://res.cloudinary.com/`.

### Migrar imágenes existentes
Las imágenes anteriores (locales) ya no existen tras reinicios. Sube nuevamente cada producto con la opción de imagen para regenerarlas en Cloudinary.

### Seguridad
No compartas tu API Secret. Manténlo solo en variables de entorno.

### Troubleshooting
- 500 al subir imagen: revisa que las variables estén bien escritas y que no haya espacios extras.
- Tiempo de respuesta lento: Cloudinary hace upload streaming; la primera vez puede tardar un poco más.
- URL vacía en producto: asegúrate de enviar el campo `imagen` (archivo) en el formulario.

## Scripts
`npm run start` -> producción
`npm run dev` -> desarrollo con nodemon

## Tests
Se ejecutan con `npm test`. Actualmente no hay pruebas para catálogo.
