import bcrypt from 'bcrypt'

const usuarios = [
    {
        nombre: 'Juan',
        email: 'juan@juan.com',
        confirmado: 1,
        password: bcrypt.hashSync('password', 10)
    },
    {
        nombre: 'Sancho',
        email: 'sancho@sancho.com',
        confirmado: 1,
        password: bcrypt.hashSync('password', 10)
    },
    {
        nombre: 'Pepe',
        email: 'pepe@gmail.com',
        confirmado: 1,
        password: bcrypt.hashSync('pepe', 10)
    }
]

export default usuarios