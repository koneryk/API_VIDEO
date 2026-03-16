import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import { User } from './users.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesService } from '../roles/roles.service';
import {AddRoleDTO} from "./dto/add-role.dto";
import {BanUserDto} from "./dto/ban-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    private roleService: RolesService,
  ) {}

  async createUser(dto: CreateUserDto) {
    const user = await this.userRepository.create(dto);
    const role = await this.roleService.getRoleByValue('ADMIN');
    // @ts-ignore
    await user.$set('roles', [role.id]);
    // @ts-ignore;
    user.roles = [role];
    return user;
  }
  async getAllUsers() {
    const users = await this.userRepository.findAll({ include: { all: true } });
    return users;
  }

  async getUsersByEmail(email: string){
    const user = await this.userRepository.findOne({
      where: { email },
      attributes: ['id', 'email', 'password', 'banned', 'banReason'],
      include: { all: true },
    });
    console.log('Данные пользователя:', {
      id: user?.id,
      email: user?.email,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length
    });
    return user;
  }
  async  addRole(dto: AddRoleDTO) {
    const user = await this.userRepository.findByPk(dto.userId);
    const role = await this.roleService.getRoleByValue(dto.value);
    if (role && user) {
      await user.$set('roles', role.id);
      return dto;
    }
    throw new HttpException(
      'Пользователи или роль не найдены',
      HttpStatus.NOT_FOUND,
    );
  }

  async ban(dto: BanUserDto) {
    const user = await this.userRepository.findByPk((dto.userId))
    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }
    // @ts-ignore
    user.banned = true;
    // @ts-ignore
    user.banReason = dto.banReason;
    // @ts-ignore
    await user.save();
    return user;
  }
}
