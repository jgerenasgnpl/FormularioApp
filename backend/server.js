require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');


// --- Configuración de Express ---
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// --- Configuración de Supabase ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: Las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar definidas.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('Cliente de Supabase inicializado.');

// --- Middleware de Autenticación ---
const adminOnly = async (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ error: 'No se proporcionó ID de usuario para la autorización.' });
    }

    try {
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'Usuario de autorización no encontrado.' });
        }

        if (user.rol !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al verificar el rol.', details: error.message });
    }
};

// --- Rutas de la API ---

app.get('/', (req, res) => {
    res.send('Backend conectado a Supabase funcionando!');
});

// --- Endpoints de Autenticación ---
app.post('/auth/register', adminOnly, async (req, res) => {
    const { email, password, rol } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'El correo y la contraseña son obligatorios.' });
    try {
        const { data: existingUser } = await supabase.from('usuarios').select('email').eq('email', email).single();
        if (existingUser) return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        const { data: newUser, error } = await supabase.from('usuarios').insert([{ email, password, rol: rol || 'usuario' }]).select().single();
        if (error) throw error;
        delete newUser.password;
        res.status(201).json({ message: 'Usuario registrado con éxito', user: newUser });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'El correo y la contraseña son obligatorios.' });
    try {
        const { data: user, error } = await supabase.from('usuarios').select('*').eq('email', email).single();
        if (error || !user) return res.status(404).json({ error: 'Usuario no encontrado.' });
        if (user.password !== password) return res.status(401).json({ error: 'Contraseña incorrecta.' });
        delete user.password;
        res.status(200).json({ message: 'Inicio de sesión exitoso', user });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
});

// --- Endpoints de Formularios (CRUD) ---
app.get('/formularios', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('formularios')
            .select(`
                *,
                modulos (*, preguntas (*))
            `);

        if (error) throw error;

        // Ordenar los resultados en JavaScript para mayor fiabilidad
        data.forEach(form => {
            if (form.modulos) {
                form.modulos.sort((a, b) => a.position - b.position);
                form.modulos.forEach(mod => {
                    if (mod.preguntas) {
                        mod.preguntas.sort((a, b) => a.position - b.position);
                    }
                });
            }
        });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los formularios.', details: error.message });
    }
});

app.post('/formularios', adminOnly, async (req, res) => {
    const { name, created_by } = req.body;
    if (!name || !created_by) return res.status(400).json({ error: 'El nombre y el creador son obligatorios.' });
    try {
        const { data, error } = await supabase.from('formularios').insert([{ name, created_by }]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el formulario.', details: error.message });
    }
});

// --- Endpoints de Módulos ---
app.post('/formularios/:formularioId/modulos', adminOnly, async (req, res) => {
    const { formularioId } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre del módulo es obligatorio.' });
    try {
        const { count } = await supabase.from('modulos').select('count', { count: 'exact' }).eq('formulario_id', formularioId);
        const position = (count || 0) + 1;
        const { data, error } = await supabase.from('modulos').insert([{ name, formulario_id: formularioId, position }]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el módulo.', details: error.message });
    }
});

app.put('/modulos/:id', adminOnly, async (req, res) => { /* ... sin cambios ... */ });
app.delete('/modulos/:id', adminOnly, async (req, res) => {
    const { id } = req.params;
    console.log(`Backend: Recibida petición DELETE para módulo con ID: ${id}`);
    try {
        console.log(`Backend: Intentando eliminar módulo ${id} en Supabase...`);
        const { error } = await supabase.from('modulos').delete().eq('id', id);
        if (error) {
            console.error(`Backend: Error de Supabase al eliminar módulo ${id}:`, error);
            throw error;
        }
        console.log(`Backend: Módulo ${id} eliminado con éxito.`);
        res.status(204).send(); // 204 No Content
    } catch (error) {
        console.error(`Backend: Excepción en DELETE /modulos/${id}:`, error);
        res.status(500).json({ error: 'Error al eliminar el módulo.', details: error.message });
    }
});

// --- Endpoints de Preguntas ---
app.post('/modulos/:moduloId/preguntas', adminOnly, async (req, res) => {
    const { moduloId } = req.params;
    const { text, type, rules } = req.body;
    if (!text || !type) return res.status(400).json({ error: 'El texto y el tipo son obligatorios.' });
    try {
        const { count } = await supabase.from('preguntas').select('count', { count: 'exact' }).eq('modulo_id', moduloId);
        const position = (count || 0) + 1;
        const { data, error } = await supabase.from('preguntas').insert([{ text, type, rules, modulo_id: moduloId, position }]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la pregunta.', details: error.message });
    }
});

app.put('/preguntas/:id', adminOnly, async (req, res) => {
    const { id } = req.params;
    const { text, type, rules } = req.body;
    console.log(`Backend: PUT /preguntas/${id} - Recibido:`, { text, type, rules });
    if (!text || !type) {
        console.log(`Backend: PUT /preguntas/${id} - Error 400: Faltan datos.`);
        return res.status(400).json({ error: 'El texto y el tipo son obligatorios.' });
    }
    try {
        console.log(`Backend: PUT /preguntas/${id} - Intentando actualizar en Supabase...`);
        const { data, error } = await supabase.from('preguntas').update({ text, type, rules }).eq('id', id).select().single();
        if (error) {
            console.error(`Backend: PUT /preguntas/${id} - Error de Supabase:`, error);
            throw error;
        }
        console.log(`Backend: PUT /preguntas/${id} - Actualización exitosa. Datos:`, data);
        res.status(200).json(data);
    } catch (error) {
        console.error(`Backend: PUT /preguntas/${id} - Excepción en try/catch:`, error);
        res.status(500).json({ error: 'Error al actualizar la pregunta.', details: error.message });
    }
});

app.delete('/preguntas/:id', adminOnly, async (req, res) => {
    const { id } = req.params;
    console.log(`Backend: Recibida petición DELETE para pregunta con ID: ${id}`);
    try {
        console.log(`Backend: Intentando eliminar pregunta ${id} en Supabase...`);
        const { error } = await supabase.from('preguntas').delete().eq('id', id);
        if (error) {
            console.error(`Backend: Error de Supabase al eliminar pregunta ${id}:`, error);
            throw error;
        }
        console.log(`Backend: Pregunta ${id} eliminada con éxito.`);
        res.status(204).send(); // 204 No Content
    } catch (error) {
        console.error(`Backend: Excepción en DELETE /preguntas/${id}:`, error);
        res.status(500).json({ error: 'Error al eliminar la pregunta.', details: error.message });
    }
});

// --- Endpoints de Datos Geográficos (NUEVOS) ---
app.get('/geodata/departamentos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('geografia_colombia')
            .select('departamento')
            .order('departamento', { ascending: true });
        if (error) throw error;
        
        // Asegurar unicidad en JavaScript
        const uniqueDepartamentos = [...new Set(data.map(row => row.departamento))];
        res.status(200).json(uniqueDepartamentos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener departamentos.', details: error.message });
    }
});

app.get('/geodata/municipios/:departamento', async (req, res) => {
    const { departamento } = req.params;
    try {
        const { data, error } = await supabase
            .from('geografia_colombia')
            .select('municipio')
            .eq('departamento', departamento)
            .order('municipio', { ascending: true });
        if (error) throw error;
        res.status(200).json(data.map(row => row.municipio));
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener municipios.', details: error.message });
    }
});

app.get('/submissions', adminOnly, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('submissions')
            .select(`
                id,
                created_at,
                formularios ( name ),
                usuarios ( email ),
                respuestas
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener los envíos:', error);
        res.status(500).json({ error: 'Error al obtener los envíos.', details: error.message });
    }
});

// --- Endpoint de Reordenamiento ---
app.post('/reorder', adminOnly, async (req, res) => {
    const { table, ids } = req.body;
    if (!table || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'Tabla e IDs son requeridos.' });
    }
    try {
        const updates = ids.map((id, index) => 
            supabase.from(table).update({ position: index + 1 }).eq('id', id)
        );
        const results = await Promise.all(updates);
        const firstError = results.find(r => r.error);
        if (firstError) throw firstError.error;
        res.status(200).json({ message: `Orden actualizado para ${table}` });
    } catch (error) {
        res.status(500).json({ error: 'Error al reordenar.', details: error.message });
    }
});

// --- Endpoint de Envío ---
app.post('/formularios/:formularioId/envios', async (req, res) => {
    const { formularioId } = req.params;
    // El frontend ahora enviará un objeto de respuestas, no un array.
    const { usuario_id, respuestas } = req.body;

    // Validar que respuestas sea un objeto y no esté vacío.
    if (!usuario_id || !respuestas || typeof respuestas !== 'object' || Object.keys(respuestas).length === 0) {
        return res.status(400).json({ error: 'Usuario ID y un objeto de respuestas son obligatorios.' });
    }

    try {
        const { data, error } = await supabase
            .from('submissions') // Usar la nueva tabla 'submissions'
            .insert([{
                formulario_id: formularioId,
                usuario_id: usuario_id,
                respuestas: respuestas // Insertar el objeto JSON directamente
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: 'Formulario enviado y guardado con éxito', submissionId: data.id });

    } catch (error) {
        console.error('Error al guardar el envío del formulario:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al guardar el formulario.', 
            details: error.message 
        });
    }
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
