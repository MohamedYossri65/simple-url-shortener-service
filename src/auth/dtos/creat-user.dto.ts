import { IsEmail,IsString, Length } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsString()
  @Length(8, 20)
  password: string
}
