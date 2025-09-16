import express from "express";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verificarToken, verificarAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Crear nuevo usuario (solo admin)
router.post("/crear", verificarToken, verificarAdmin, async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const nuevoUsuario = new User({ username, email, password: hashedPassword, role });
        await nuevoUsuario.save();
        res.status(201).json({ message: "Usuario creado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al crear usuario", error });
    }
});

export default router;
