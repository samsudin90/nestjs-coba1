import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseFilePipeBuilder,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from 'src/auth/guard';
import { EditUserDto } from './dto';
import { UserService } from './user.service';
import { FileInterceptor, MulterModule } from '@nestjs/platform-express';
import { Express } from 'express';
import { diskStorage } from 'multer';
import path, { extname } from 'path';

@Controller('users')
@UseGuards(JwtGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    return req.user;
  }

  @Patch()
  getId(@Req() req: Request, @Body() dto: EditUserDto) {
    return this.userService.editUser(req.user['id'], dto);
  }

  @Delete(':id')
  deleteId(@Param('id', ParseIntPipe) id: number) {
    return this.userService.DeleteUser(id);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter(req, file, callback) {
        var ext = extname(file.originalname);
        ext = ext.toLowerCase()
        if (ext !== '.jpg' && ext !== '.jpeg') {
            return callback(null, false)
        }
        callback(null, true)
      },
      storage: diskStorage({
        destination: './upload',
        filename: (req, file, callback) => {
          callback(
            null,
            `${Date.now()}-${file.originalname.split('.')[0]}${extname(
              file.originalname,
            )}`,
          );
        },
      }),
    }),
  )
  async fileUpload(
    @Body() body : Request,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'jpeg' })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
  ) {
    return this.userService.Upload(file.path)
  }
}
