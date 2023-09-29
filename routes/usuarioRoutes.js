import express from "express";
import { formularioLogin, formularioRegistro, formularioRestablecer, registrar, confirmar, resetPassword } from "../controllers/usuarioController.js";


const router = express.Router();

// Routing
router.get('/login', formularioLogin)

router.get('/registro', formularioRegistro)

router.post('/registro', registrar)

router.get('/confirmar/:token', confirmar)

router.get('/restablecer', formularioRestablecer)
router.post('/restablecer', resetPassword)


export default router