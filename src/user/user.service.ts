import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
    constructor(private prisma : PrismaService) {}

    async editUser(userId : number, dto : EditUserDto) {
        const user = await this.prisma.user.update({
            where : {
                id : userId
            },
            data : {
                ...dto
            }
        })

        delete user.hash

        return user
    }

    async DeleteUser(userId : number) {
        const user = await this.prisma.user.findUnique({
            where : {
                id : userId
            }
        })

        if(!user) {
            throw new NotFoundException()
        }

        this.prisma.user.delete({
            where: {
                id : userId
            }
        })

        return {data : "User deleted"}
    }

    Upload(file : string) {
        return {file}
    }
}
