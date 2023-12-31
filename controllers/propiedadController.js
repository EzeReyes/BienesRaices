import { validationResult } from 'express-validator'
import { unlink } from 'node:fs/promises'
import { Precio, Categoria, Propiedad, Mensaje, Usuario} from '../models/index.js'
import { esVendedor, formatearFecha } from '../helpers/index.js'


const admin = async (req,res)  => {

    // Leer QueryString
    const { pagina: paginaActual } =req.query
    console.log(paginaActual)

    const expReg = /^[1-9]$/

    if(!expReg.test(paginaActual)) {
        return res.redirect('/mis-propiedades?pagina=1')
    }

    try {

        const { id } = req.usuario

        // Limites y Offset par el paginador
        const limit = 10
        const offset= (( paginaActual * limit ) - limit)

        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit,
                offset,
                where: {
                    usuarioID: id
                },
                include: [
                    { model: Categoria, as: 'categoria'},
                    { model: Precio, as: 'precio'},
                    { model: Mensaje, as: 'mensajes'}
                ]
            }),
            Propiedad.count({
                where: {
                    usuarioID : id
                }
            })
        ])

        console.log(total)
    
        res.render('propiedades/admin', {
            pagina: 'Mis Propiedades',
            csrfToken: req.csrfToken(),
            propiedades,
            paginas: Math.ceil(total/limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit
            }) 
    } catch (error) {
        console.log(error)
    }

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

        res.redirect(`/propiedades/agregar-imagen/${id}`)

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

    if(req.usuario.id.toString() !== propiedad.usuarioID.toString()) {
        return(
        console.log('La propiedad no pertenece al usuario'),
        res.redirect('/mis-propiedades'))
    }

    res.render('propiedades/agregar-imagen', {
        pagina: `Agregar Imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad
    })
}

const almacenarImagen = async (req, res, next ) => {

    
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

    if(req.usuario.id.toString() !== propiedad.usuarioID.toString()) {
        return(
        console.log('La propiedad no pertenece al usuario'),
        res.redirect('/mis-propiedades'))
    }

    try {
        // Almacenar la imagen y publicar propiedad
        propiedad.imagen = req.file.filename
        propiedad.Publicado = 1
        await propiedad.save()

        next()
    } catch (error) {
        console.log(error)
    }
}

const editar = async (req, res) => {
    
        const { id } = req.params
        
        // Validar que la propiedad exista
        const propiedad = await Propiedad.findByPk(id)
            
        if(!propiedad) {
            return res.redirect('/mis-propiedades')
        }

        // Revisar que quien visita la URL, es quien creo la propiedad
        if(propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
            return res.redirect('/mis-propiedades')
        }


        // Consultar Modelo de Precio y Categorias
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])
    
    
        res.render('propiedades/editar', {
            pagina: `Editar Propiedad ${propiedad.titulo}`,
            csrfToken: req.csrfToken(),
            categorias,
            precios, 
            datos: propiedad
        }) 
}


const guardarCambios = async (req, res) => {

    // Validación
    let resultado = validationResult(req)

    if(!resultado.isEmpty()) {
         // Consultar Modelo de Precio y Categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    return res.render('propiedades/editar', {
        pagina: 'Editar Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        errores: resultado.array(),
        datos: req.body
    })
    }

    const { id } = req.params
        
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
        
    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    // Reescribir Objeto y Actualizarlo

    try {
        
        const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioID, categoria: categoriaID} = req.body

        propiedad.set({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioID,
            categoriaID
        })

        await propiedad.save();
        
        res.redirect('./mis-propiedades')

    } catch (error) {
        console.log(error)
    }
}

const eliminar = async (req, res) => {
    const { id } = req.params
        
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
        
    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    // Eliminar la imagen
    if(!propiedad.imagen) {
        console.log(`No hay imagen, Eliminando: propiedad N° ${propiedad.id}, ${propiedad.titulo}.`)
    } else 
        { 
            await unlink(`public/uploads/${propiedad.imagen}`)
            console.log(`Se eliminó la imagen ${propiedad.imagen}`)
        }

    // Eliminar la propiedad
    await propiedad.destroy()
    res.redirect('/mis-propiedades')
}

// Modificar el estado de la propiedad
const cambiarEstado = async (req, res) => {

    const { id } = req.params
        
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
        
    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    // Actualizar
    propiedad.Publicado = !propiedad.Publicado

    await propiedad.save()

    res.json({
        resultado: 'ok'
    })
}

// Muestra una Propiedad

    const mostrarPropiedad = async (req, res) => {
        const { id } = req.params
        // Comprobar que la propiedad exista

        const propiedad = await Propiedad.findByPk(id, {
            include: [
                { model: Categoria, as: 'categoria'},
                { model: Precio, as: 'precio'}
            ]    
        })

        if(!propiedad || !propiedad.Publicado ) {
        res.redirect('/404')
        }

        res.render('propiedades/mostrar', {
            propiedad,
            pagina: `Propiedad: ${propiedad.titulo}`,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID)
        })
    }

    const enviarMensaje = async (req, res) => {
        const { id } = req.params
        // Comprobar que la propiedad exista

        const propiedad = await Propiedad.findByPk(id, {
            include: [
                { model: Categoria, as: 'categoria'},
                { model: Precio, as: 'precio'}
            ]    
        })

        if(!propiedad) {
        res.redirect('/404')
        }

        // Renderizar los errores
            // Validación
        let resultado = validationResult(req)

        if(!resultado.isEmpty()) {
            return  res.render('propiedades/mostrar', {
                propiedad,
                pagina: `Propiedad: ${propiedad.titulo}`,
                csrfToken: req.csrfToken(),
                usuario: req.usuario,
                esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID),
                errores: resultado.array()
            })
        }

        // console.log(req.body)
        // console.log(req.params)
        // console.log(req.usuario)

        const { mensaje } = req.body
        const { id: propiedadID } = req.params
        const { id: usuarioID } = req.usuario


        // Almacenar el mensaje
        await Mensaje.create({
            mensaje,
            propiedadID,
            usuarioID, 

        })

        res.render('propiedades/mostrar', {
            propiedad,
            pagina: `Propiedad: ${propiedad.titulo}`,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID), 
            enviado: true
        })
    }

    // Leer mensajes recibidos
    const verMensajes = async (req, res) => {

        const { id } = req.params
        
        // Validar que la propiedad exista
        const propiedad = await Propiedad.findByPk(id, {
            include: [
                { model: Mensaje, as: 'mensajes',
                    include: [
                        {model: Usuario.scope('eliminarPassword'), as: 'usuario'}
                    ]
                },
            ],
        })
            
        if(!propiedad) {
            return res.redirect('/mis-propiedades')
        }
    
        // Revisar que quien visita la URL, es quien creo la propiedad
        if(propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
            return res.redirect('/mis-propiedades')
        }
    
        res.render('propiedades/mensajes', {
            pagina: 'Mensajes',
            mensajes: propiedad.mensajes, 
            formatearFecha
        })
    }
    

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios, 
    eliminar, 
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje, 
    verMensajes
}