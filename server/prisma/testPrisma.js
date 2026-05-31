require('dotenv').config({ path: '../.env' })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function test() {

    const user = await prisma.usuario.create({

        data:{
            email:"joel@test.com",
            password:"123456"
        }

    })

    console.log(user)

}

test()
.catch(console.error)
.finally(async ()=>{

    await prisma.$disconnect()

})