import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCanalOrigemDto } from './dto/create-canal-origem.dto';
import { UpdateCanalOrigemDto } from './dto/update-canal-origem.dto';
import { CanalOrigem } from './entities/canal-origem.entity';

@Injectable()
export class CanalOrigemService {
  constructor(private prisma: PrismaService) {}

  async create(createCanalOrigemDto: CreateCanalOrigemDto): Promise<any> {
    // Criar entidade e validar regras de negócio
    const canalOrigemEntity = CanalOrigem.create(createCanalOrigemDto);

    const canalOrigem = await this.prisma.canalOrigem.create({
      data: {
        publicId: canalOrigemEntity.publicId,
        nome: canalOrigemEntity.nome,
        descricao: canalOrigemEntity.descricao,
        ativo: canalOrigemEntity.ativo,
      },
      include: {
        Cliente: true,
      },
    });

    return canalOrigem;
  }

  async findAll(): Promise<any[]> {
    const canaisOrigem = await this.prisma.canalOrigem.findMany({
      include: {
        Cliente: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return canaisOrigem;
  }

  async findOne(publicId: string): Promise<any> {
    const canalOrigem = await this.prisma.canalOrigem.findUnique({
      where: { publicId },
      include: {
        Cliente: true,
      },
    });

    if (!canalOrigem) {
      throw new NotFoundException(
        `Canal de origem com ID ${publicId} não encontrado`,
      );
    }

    return canalOrigem;
  }

  async update(
    publicId: string,
    updateCanalOrigemDto: UpdateCanalOrigemDto,
  ): Promise<any> {
    const existingCanalOrigem = await this.findOne(publicId);

    // Criar entidade com dados atualizados para validar
    const updatedData = { ...existingCanalOrigem, ...updateCanalOrigemDto };
    const canalOrigemEntity = new CanalOrigem(updatedData);
    canalOrigemEntity.validateBusinessRules();

    const canalOrigem = await this.prisma.canalOrigem.update({
      where: { publicId },
      data: updateCanalOrigemDto,
      include: {
        Cliente: true,
      },
    });

    return canalOrigem;
  }

  async remove(publicId: string): Promise<void> {
    const canalOrigem = await this.findOne(publicId);

    // Verificar se pode ser removido usando regra de negócio da entidade
    const canalOrigemEntity = new CanalOrigem(canalOrigem);
    if (!canalOrigemEntity.canBeDeleted()) {
      throw new BadRequestException(
        'Canal de origem não pode ser removido pois possui clientes associados',
      );
    }

    await this.prisma.canalOrigem.delete({
      where: { publicId },
    });
  }

  async activate(publicId: string): Promise<any> {
    const existingCanalOrigem = await this.findOne(publicId);
    const canalOrigemEntity = new CanalOrigem(existingCanalOrigem);
    canalOrigemEntity.activate();

    return this.update(publicId, { ativo: canalOrigemEntity.ativo });
  }

  async deactivate(publicId: string): Promise<any> {
    const existingCanalOrigem = await this.findOne(publicId);
    const canalOrigemEntity = new CanalOrigem(existingCanalOrigem);
    canalOrigemEntity.deactivate();

    return this.update(publicId, { ativo: canalOrigemEntity.ativo });
  }
}
