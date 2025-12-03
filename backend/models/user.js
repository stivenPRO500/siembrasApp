import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'agricultor', 'usuario'], default: 'usuario' },
    // Estado de acceso
    // pendiente -> no puede iniciar sesión
    // aprobado  -> puede iniciar sesión
    // rechazado -> no puede iniciar sesión
    estado: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
    agricultor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    aprobado: { type: Boolean, default: function () { return this.role === 'admin'; } }, // Estado de aprobación: el admin no tiene estados (siempre aprobado)
    suscripcionExpira: { type: Date }
    , suscripcionSuspendido: { type: Boolean, default: false }
    , suscripcionGraceInicio: { type: Date }
});

// Índice compuesto (a futuro) podría garantizar unicidad de username ya existente y permitir búsquedas por role
// UserSchema.index({ role: 1 });

export default mongoose.model('User', UserSchema);
