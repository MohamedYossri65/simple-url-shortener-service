import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { CreateUserDto } from './dtos/creat-user.dto'
import { AuthService } from './auth.service'
import { CustomResponse } from '../utils/custom-response'

@Controller('v1/auth')
export class AuthController {
  // Implement authentication logic here
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.OK)
  async signUp(@Body() user: CreateUserDto): Promise<CustomResponse> {
    return await this.authService.signup(user)
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() user: CreateUserDto): Promise<CustomResponse> {
    return await this.authService.signIn(user)
  }
}
