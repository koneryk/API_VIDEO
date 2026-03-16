import {
  CanActivate,
  ExecutionContext, HttpException, HttpStatus, Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles-auth.decorator';


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private jwtService: JwtService,
              private reflector: Reflector) {
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [context.getHandler(), context.getClass(),]);
      if (!requiredRoles) {
        return true;
      }
      const req = context.switchToHttp().getRequest();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const authHeader = req.headers.authorization;
      const bearer = authHeader.split(' ')[0];
      const token = authHeader.split(' ')[1];
      console.log(bearer)
      console.log(token)
      if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedException();
      }
      const user = this.jwtService.verify(token);
      req.user = user;



      if (!user.roles) {
        console.log('User has no roles property');
        throw new HttpException(
          { message: 'У пользователя нет ролей' },
          HttpStatus.FORBIDDEN,
        );
      }


      // Проверяем, что roles - это массив
      if (!Array.isArray(user.roles)) {
        console.log('User roles is not an array');
        throw new HttpException(
          { message: 'Некорректный формат ролей' },
          HttpStatus.FORBIDDEN,
        );
      }




      return user.roles.some(role => requiredRoles.includes(role.value));
    } catch (e) {
      console.log(e);
      throw new HttpException(
        { message: 'Не автризован' },
        HttpStatus.FORBIDDEN,
      );
    }
  }

}