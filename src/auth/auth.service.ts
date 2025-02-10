import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { catchAsyncErr } from '../utils/catchAsyncError'
import { CreateUserDto } from './dtos/creat-user.dto'
import { JwtService } from '@nestjs/jwt'
import { DatabaseService } from '../database/database.service';
import bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async generateToken(payload: any): Promise<string> {
    return this.jwtService.signAsync(payload)
  }

  signup = catchAsyncErr(async (user: CreateUserDto): Promise<any> => {
    const queryText = 'SELECT * FROM users WHERE email = $1';
    const values = [user.email];

    const existingAdmin = await this.databaseService.query(queryText, values);

    if (existingAdmin.length > 0) {
      throw new HttpException(
        'User with the same email already exists',
        HttpStatus.CONFLICT,
      );
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const insertQuery = `
        INSERT INTO users ( email, password)
        VALUES ($1, $2)
            RETURNING id, email
    `;
    const insertValues = [ user.email, hashedPassword];

    const newUser = await this.databaseService.query(insertQuery, insertValues);

    return {
      success: true,
      message: 'user created successfully',
      data: {
        username: newUser[0].email,
        role: 'user',
      },
    }
  })

  signIn = catchAsyncErr(async (user: CreateUserDto): Promise<any> => {
    const findUserQuery = `
        SELECT * FROM users WHERE email = $1
    `;
    const findUserValues = [user.email];
    const foundUser = await this.databaseService.query(findUserQuery, findUserValues);

    const validatePassword:Boolean = await bcrypt.compare(user.password, foundUser[0].password);

    if (foundUser.length === 0 || !validatePassword) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const payload = {
      id: foundUser[0].id,
      email: foundUser[0].email,
      role: foundUser[0].role,
    };

    const token = await this.generateToken(payload)
    return {
      success: true,
      message: 'User signed in successfully',
      token: token,
      data: {
        username: foundUser[0].email,
        role: 'user',
      },
    }
  })
}
