import express from "express";
import { formularioLogin, autenticar, cerrarSesion, formularioRegistro, formularioRestablecer, registrar, confirmar, resetPassword, comprobarToken, nuevoPassword } from "../controllers/usuarioController.js";


const router = express.Router();

// Cerrar sesión
router.post('/cerrar-sesion', cerrarSesion)

// Routing
router.get('/login', formularioLogin)
router.post('/login', autenticar)

router.get('/registro', formularioRegistro)
router.post('/registro', registrar)

router.get('/confirmar/:token', confirmar)

router.get('/restablecer', formularioRestablecer)
router.post('/restablecer', resetPassword)

// Almacena el nuevo password
router.get('/restablecer/:token', comprobarToken );
router.post('/restablecer/:token', nuevoPassword );


export default router