import { check,validationResult } from 'express-validator'
import Usuario from '../models/Usuario.js'
import { generarId } from '../helpers/token.js'
import { emailRegistro } from '../helpers/email.js'

const formularioLogin = (req,res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión'
    })
}



const formularioRegistro = (req,res) => {
    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken: req.csrfToken()
    })
}

const registrar = async (req,res) => {
    // Validacion
    await check('nombre').notEmpty().withMessage('Debe completar el campo nombre').run(req)
    await check('email').isEmail().withMessage('Eso no parece un email').run(req)
    await check('password').isLength({ min: 6 }).withMessage('El password debe ser al menos de 6 caracteres').run(req)
    await check('repetir_password').equals(req.body.password).withMessage('Los Passwords deben ser iguales').run(req)

    let resultado = validationResult(req)


    // return res.json(resultado.array())
    // Verificar que el resultado este vacio
    if(!resultado.isEmpty()) {
        // Errores
        return  res.render('auth/registro', {
                pagina: 'Crear Cuenta',
                csrfToken: req.csrfToken(),
                errores: resultado.array(),
                usuario: {
                    nombre: req.body.nombre,
                    email: req.body.email
                }
            })
    }

// Extraer los datos
const { nombre, email, password } = req.body

// Verificar que el usuario no este duplicado
const existeUsuario = await Usuario.findOne( { where: { email } })
if(existeUsuario) {
    return res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken: req.csrfToken(),
        errores: [{msg: 'El usuario ya está Registrado'}],
        usuario: {
            nombre: nombre,
            email: email
        }
    })
}

// Almacenar un usuario
const usuario = await Usuario.create({
    nombre,
    email,
    password,
    token: generarId()
})

// Envia email de confirmacion
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })


// Mostar mensaje de confirmación
res.render('templates/mensaje', {
    pagina: 'Cuenta creada correctamente',
    mensaje: 'Hemos enviado un correo de confirmación. presiona en el enlace'
})
}

// Función que comprueba una cuenta
const confirmar = async (req, res) => {
    const { token } = req.params;

    // Verificar si el token es válido
    const usuario = await Usuario.findOne({ where: {token}})

    if(!usuario) {
        return res.render('auth/confirmar_cuenta', {
            pagina: 'Error al confirmar tu cuenta',
            mensaje:'Hubo un error al confirmar tu cuenta, Intenta de nuevo',
            error: true
        })
    }
    
    // Confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    console.log(usuario)

    res.render('auth/confirmar_cuenta', {
        pagina: 'Cuenta Confirmada',
        mensaje: 'La cuenta se confirmó Correctamente'
    })
}

const formularioRestablecer = (req,res) => {
    res.render('auth/restablecer', {
        pagina: 'Restablece tu Cuenta',
        csrfToken: req.csrfToken()
    })
}

const resetPassword = async (req,res) => {
        // Validacion
        await check('email').isEmail().withMessage('Eso no parece un email').run(req)
        
        let resultado = validationResult(req)

        // Verificar que el resultado este vacio
        if(!resultado.isEmpty()) {
            // Errores
            return      res.render('auth/restablecer', {
                pagina: 'Restablece tu Cuenta',
                csrfToken: req.csrfToken(), 
                errores: resultado.array()
            })
        }
    
    // Buscar el usuario

    const { email } = req.body

    const usuario = await Usuario.findOne({ where: { email }})
    console.log(usuario)

    
    }



export {
    formularioLogin, 
    formularioRegistro,
    registrar,
    confirmar,
    formularioRestablecer,
    resetPassword
}