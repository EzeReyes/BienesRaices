import  Datatypes  from 'sequelize'
import bcrypt from 'bcrypt'
import db from '../config/db.js'

const Usuario = db.define('usuarios', {
    nombre: {
        type: Datatypes.STRING,
        allowNull: false
    },
    email: {
        type: Datatypes.STRING,
        allowNull: false
    },
    password: {
        type: Datatypes.STRING,
        allowNull: false
    },
    token: Datatypes.STRING,
    confirmado: Datatypes.BOOLEAN
    }, {
    hooks: {
        beforeCreate: async function(usuario) {
            const salt = await bcrypt.genSalt(10)
            usuario.password = await bcrypt.hash( usuario.password , salt);
        }
    },
    scopes: {
        eliminarPassword: {
            attributes: {
                exclude: ['password','token', 'confirmado', 'createdAt', 'updatedAt']
            }
        }
    }
})

// Métodos Personalizados
Usuario.prototype.verificarPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
}

export default Usuario
