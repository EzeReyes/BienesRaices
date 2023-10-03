import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad } from '../models/index.js'


const admin = (req,res) => {
    res.render('propiedades/admin', {
        pagina: 'Mis Propiedades'
        }) 
}

// Formulario para crear una nueva propiedad
const crear =  async (req, res) => {
    
    // Consultar Modelo de Precio y Categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])


    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios, 
        datos: {}
    }) 
}

const guardar = async (req, res) => {

    // Validación
    let resultado = validationResult(req)

    if(!resultado.isEmpty()) {
         // Consultar Modelo de Precio y Categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    return res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        errores: resultado.array(),
        datos: req.body
    })
    }

    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioID, categoria: categoriaID} = req.body

    const { id: usuarioID } =  req.usuario 

    // Crear un registro
    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones, 
            estacionamiento, 
            wc,
            calle, 
            lat, 
            lng, 
            precioID,
            categoriaID,
            usuarioID, 
            imagen: ''
        })

        const { id } = propiedadGuardada

        res.redirect(`propiedades/agregar-imagen/${id}`)

    } catch (error) {
        console.log(error)
    }
}

const agregarImagen = async (req, res ) => {

    const { id } = req.params

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
    
    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Validar que la propiedad no este publicada

    if(propiedad.Publicado) {
        return res.redirect('/mis-propiedades')
    }

    // Validar que la propiedad pertenece a quien visita esta pagina
    console.log(req.usuario)

    res.render('propiedades/agregar-imagen', {
        pagina: 'Agregar Imagen'
    })
}

export {
    admin,
    crear,
    guardar,
    agregarImagen
}