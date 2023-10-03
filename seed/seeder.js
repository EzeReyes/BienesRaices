import { exit } from "node:process"
import categorias from "./categorias.js";
import precios from "./precios.js";
import db from "../config/db.js"
import { Categoria, Precio, Usuario } from '../models/index.js'
import usuarios from "./usuarios.js";

const importarDatos = async () => {
    try {
        // Autenticar
        await db.authenticate()

        // Generar las columnas
        await db.sync()

        // Insertar los datos
        await Promise.all([
            Categoria.bulkCreate(categorias),
            Precio.bulkCreate(precios),
            Usuario.bulkCreate(usuarios)
        ])
        console.log("Datos Importados Correctamente")
        exit(0)


    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}


const eliminarDatos = async () => {
    try {
        // Eliminar datos de tablas indicadas
        
        // await Promise.all([
        //     Categoria.destroy({where: {}, truncate:true }),
        //     Precio.destroy({where: {}, truncate:true })
        // ])

        // ELiminar los datos de todas las tablas 
        await db.sync({force: true})
        console.log("Datos Eliminados Correctamente");
        exit()
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
    }

if(process.argv[2] === "-i") {
    importarDatos();
}


if(process.argv[2] === "-e") {
    eliminarDatos();
}