import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(dto: AuthDto) {
    try {
      const hash = await argon.hash(dto.password);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });

      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credential taken');
        }
      }
      throw error;
    }
  }

  async signIn(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Credentials invalid');
    }

    const pwMatch = await argon.verify(user.hash, dto.password);

    if (!pwMatch) {
      throw new ForbiddenException('Credentials invalid');
    }

    return this.signToken(user.id, user.email);
  }

  async signToken(userId: number, email: string): Promise<{access_token : string}> {
    const secret = this.config.get('JWT_SECRET');

    const payload = {
      sub: userId,
      email: email,
    };

    const token = await this.jwt.signAsync(payload, { expiresIn: '50m', secret: secret });

    return {
      access_token : token
    }
  }
}
