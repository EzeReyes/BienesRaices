import { check,validationResult } from 'express-validator'
import Usuario from '../models/Usuario.js'
import { generarId } from '../helpers/token.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/email.js'
import bcrypt from 'bcrypt'


const formularioLogin = (req,res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    })
}

const autenticar = async (req,res) => {
    // Validacióm
    await check('email').isEmail().withMessage('El email es obligatorio').run(req)
    await check('password').notEmpty({ min: 6 }).withMessage('El password es obligatorio').run(req)

    let resultado = validationResult(req)

    // Verificar que el resultado este vacio
    if(!resultado.isEmpty()) {
        // Errores
        return  res.render('auth/login', {
                pagina: 'Iniciar Sesión',
                csrfToken: req.csrfToken(),
                errores: resultado.array(),
            })
    }

const { email, password } = req.body


// Comprobar si el usuario existe
const usuario = await Usuario.findOne({ where: { email }})
if(!usuario) {
    return  res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken(),
        errores: [{msg: 'El Usuario no existe'}],
    })


    

}


// Comprobar si el usuario esta confirmado
if(!usuario.confirmado) {
    return  res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken(),
        errores: [{msg: 'Tu cuenta no ha sido confirmada'}],
    })
}


// Revisar el password
if(!usuario.verificarPassword(password)) {
    return  res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken(),
        errores: [{msg: 'El Password es incorrecto'}],
    })
}

// Autenticar al usuario


console.log('Cuenta confirmada')

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
            return   res.render('auth/restablecer', {
                pagina: 'Restablece tu Cuenta',
                csrfToken: req.csrfToken(), 
                errores: resultado.array()
            })
        }
    
    // Buscar el usuario

    const { email } = req.body

    const usuario = await Usuario.findOne({ where: { email }})
    
    if(!usuario) {
        return   res.render('auth/restablecer', {
                pagina: 'Restablece tu Cuenta',
                csrfToken: req.csrfToken(), 
                errores: [{msg: 'El email no pertenece a ningún usuario registrado'}]
            })
    }

    //  Generar un token y enviar el email
    usuario.token = generarId();
    await usuario.save();

    // Enviar un email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })

    // Renderizar un mensaje

    res.render('templates/mensaje', {
        pagina: 'Reestablece tu password',
        mensaje: 'Hemos enviado un correo con las instrucciones. presiona en el enlace'
    })
    }

    const comprobarToken = async (req,res, next) => {

        const { token } = req.params;

        const usuario = await Usuario.findOne({ where : { token }})
        if(!usuario) {
            return res.render('auth/confirmar_cuenta', {
                pagina: 'Reestablece tu password tu cuenta',
                mensaje:'Hubo un error al validar tu información, intenta de nuevo por favor',
                error: true
            })
        }        console.log(usuario)
    
    
        //  Mostrar formulario para modificar el password
        res.render('auth/reset-password', {
            pagina: 'Reestablece tu Password',
            csrfToken: req.csrfToken()
        } )
    }

    const nuevoPassword = async (req,res) => {
        await check('password').isLength({ min: 6 }).withMessage('El password debe ser al menos de 6 caracteres').run(req)

        let resultado = validationResult(req)

        // Verificar que el resultado este vacio
        if(!resultado.isEmpty()) {
            // Errores
            return  res.render('auth/reset-password', {
                    pagina: 'Reestablece tu Password',
                    csrfToken: req.csrfToken(),
                    errores: resultado.array(),
                })
        }

        const { token } = req.params
        const { password } = req.body;

        // Identificar quien hace el cambio
        const usuario = await Usuario.findOne({ where: { token }})



        // Hashear el nuevo password
        const salt = await bcrypt.genSalt(10)
        usuario.password = await bcrypt.hash( password , salt);
        usuario.token = null;

        await usuario.save();

        res.render('auth/confirmar_cuenta', {
            pagina: 'Password Reestablecido',
            mensaje: 'El Password se guardo correctamente'
        })


    }




export {
    formularioLogin, 
    autenticar,
    formularioRegistro,
    registrar,
    confirmar,
    formularioRestablecer,
    resetPassword,
    comprobarToken,
    nuevoPassword
}